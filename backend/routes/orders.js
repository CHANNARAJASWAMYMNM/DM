const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const COMMISSION_PERCENT = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) || 10;

// 1. CHECKOUT (Create Order)
router.post('/', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  const { cartItems, shippingAddress, contactPhone, paymentMethod } = req.body;

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !shippingAddress || !contactPhone) {
    return res.status(400).json({ success: false, message: 'Please provide cart items, shipping address, and contact phone.' });
  }

  try {
    let totalAmount = 0;
    const validatedItems = [];

    // Step A: Validate stock and calculate prices
    for (const item of cartItems) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, seller:seller_profiles(*)')
        .eq('id', item.productId)
        .maybeSingle();

      if (productError || !product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.productId} not found.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product,
        quantity: item.quantity,
        price: parseFloat(product.price),
        sellerId: product.seller.id
      });
    }

    // Step B: Create Order Record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: req.user.id,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          contact_phone: contactPhone,
          status: 'pending',
          payment_status: paymentMethod === 'online' ? 'paid' : 'pending', // Mock instant payment for online
          payment_method: paymentMethod,
          tracking_id: 'TRK' + Math.floor(100000 + Math.random() * 900000) // Mock shipping number
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Step C: Create Order Items & Update Stock
    for (const item of validatedItems) {
      // 1. Insert order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
            seller_id: item.sellerId
          }
        ]);

      if (itemError) throw itemError;

      // 2. Decrement stock
      const newStock = item.product.stock - item.quantity;
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product.id);

      if (stockError) throw stockError;
    }

    // Step D: Create Payment Record
    const commissionAmount = (totalAmount * COMMISSION_PERCENT) / 100;
    const sellerPayoutAmount = totalAmount - commissionAmount;

    const { error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          order_id: order.id,
          transaction_id: paymentMethod === 'online' ? 'TXN' + Date.now() : null,
          amount: totalAmount,
          payment_method: paymentMethod,
          status: paymentMethod === 'online' ? 'completed' : 'pending',
          commission_amount: commissionAmount,
          seller_payout_amount: sellerPayoutAmount
        }
      ]);

    if (paymentError) throw paymentError;

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: order.id,
      order
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, message: 'Server error during checkout.' });
  }
});

// 2. CUSTOMER ORDER HISTORY
router.get('/customer', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', req.user.id);

    if (error) throw error;

    // Sort by date newest first
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Fetch details for each order
    const detailedOrders = [];
    for (const order of orders) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(*), seller:seller_profiles(business_name)')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;
      detailedOrders.push({
        ...order,
        items
      });
    }

    return res.json({ success: true, orders: detailedOrders });
  } catch (error) {
    console.error('Customer order retrieval error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving orders.' });
  }
});

// 3. SELLER ORDER LIST (Fulfillment workspace)
router.get('/seller', authenticateToken, authorizeRoles('seller'), async (req, res) => {
  try {
    // A. Fetch seller profile first
    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    // B. Query order items for this seller
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, order:orders(*), product:products(*)')
      .eq('seller_id', seller.id);

    if (itemsError) throw itemsError;

    // Sort items newest first (based on order date)
    items.sort((a, b) => new Date(b.order.created_at) - new Date(a.order.created_at));

    return res.json({ success: true, items });
  } catch (error) {
    console.error('Seller order retrieval error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving seller orders.' });
  }
});

// 4. UPDATE ORDER STATUS (Processing, Shipped, Delivered, Cancelled)
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Please provide status.' });
  }

  try {
    // A. Validate order exists
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // B. Authorization check
    let authorized = false;

    if (req.user.role === 'admin') {
      authorized = true;
    } else if (req.user.role === 'seller') {
      // Seller can only update order if they have items in this order
      const { data: seller, error: sellerError } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!sellerError && seller) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', id)
          .eq('seller_id', seller.id);
        
        if (!itemsError && items && items.length > 0) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot modify this order.' });
    }

    // C. Perform update
    const updateFields = { status };
    if (payment_status) {
      updateFields.payment_status = payment_status;
    }

    // If order status is marked as delivered, payment status for COD is also paid
    if (status === 'delivered' && order.payment_method === 'cod') {
      updateFields.payment_status = 'paid';

      // Update payment record in database as well
      await supabase
        .from('payments')
        .update({ status: 'completed', transaction_id: 'TXN_COD_' + Date.now() })
        .eq('order_id', id);
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({ success: true, message: 'Order status updated successfully.', order: updatedOrder });

  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
});

// 5. POST PRODUCT REVIEW
router.post('/review', authenticateToken, authorizeRoles('customer'), async (req, res) => {
  const { productId, rating, comment } = req.body;

  if (!productId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Please provide productId, rating (1-5), and comment.' });
  }

  try {
    // A. Check if customer actually purchased this product and if order is delivered
    const { data: purchasedItems, error: purchaseError } = await supabase
      .from('order_items')
      .select('id, order:orders(*)')
      .eq('product_id', productId)
      .eq('order.customer_id', req.user.id);

    if (purchaseError) throw purchaseError;

    // Filter to ensure at least one order was delivered or completed
    const hasDeliveredOrder = purchasedItems && purchasedItems.some(item => 
      item.order && ['delivered', 'shipped'].includes(item.order.status)
    );

    if (!hasDeliveredOrder) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only review products that have been shipped or delivered to you.' 
      });
    }

    // B. Check if already reviewed
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('customer_id', req.user.id)
      .maybeSingle();

    if (reviewCheckError) throw reviewCheckError;

    if (existingReview) {
      // Update existing review instead of creating duplicate
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({ rating: parseInt(rating), comment })
        .eq('id', existingReview.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return res.json({ success: true, message: 'Review updated successfully!', review: updatedReview });
    }

    // C. Create review
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert([
        {
          product_id: productId,
          customer_id: req.user.id,
          rating: parseInt(rating),
          comment
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });

  } catch (error) {
    console.error('Review submit error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting review.' });
  }
});

module.exports = router;
