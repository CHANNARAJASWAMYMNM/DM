const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const COMMISSION_PERCENT = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) || 10;

// 1. GET ALL APPROVED SELLERS (Public Directory)
router.get('/', async (req, res) => {
  try {
    const { data: sellers, error } = await supabase
      .from('seller_profiles')
      .select('id, business_name, story, craft_type, city, state, created_at')
      .eq('is_approved', true);

    if (error) throw error;

    return res.json({ success: true, sellers });
  } catch (error) {
    console.error('Fetch sellers directory error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving seller directory.' });
  }
});

// 2. GET SELLER BY ID (Public Story & Profile)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: seller, error } = await supabase
      .from('seller_profiles')
      .select('id, business_name, story, craft_type, city, state, created_at')
      .eq('id', id)
      .eq('is_approved', true)
      .maybeSingle();

    if (error) throw error;
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    return res.json({ success: true, seller });
  } catch (error) {
    console.error('Fetch seller error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving seller.' });
  }
});

// 3. GET SELLER DASHBOARD METRICS (Seller Auth required)
router.get('/dashboard/analytics', authenticateToken, authorizeRoles('seller'), async (req, res) => {
  try {
    // A. Fetch seller profile
    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    // B. Fetch products count
    const { count: productCount, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', seller.id);

    if (countError) throw countError;

    // C. Fetch all order items and compute metrics
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, order:orders(*), product:products(*)')
      .eq('seller_id', seller.id);

    if (itemsError) throw itemsError;

    let totalRevenue = 0;
    let pendingFulfillmentCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;

    orderItems.forEach(item => {
      if (item.order) {
        const itemSales = parseFloat(item.price_at_purchase) * item.quantity;
        
        // Count statuses
        if (item.order.status === 'pending' || item.order.status === 'processing') {
          pendingFulfillmentCount++;
        } else if (item.order.status === 'shipped') {
          shippedCount++;
        } else if (item.order.status === 'delivered') {
          deliveredCount++;
        }

        // Add to revenue if order is not cancelled
        if (item.order.status !== 'cancelled') {
          totalRevenue += itemSales;
        }
      }
    });

    const commissionDeducted = (totalRevenue * COMMISSION_PERCENT) / 100;
    const netEarnings = totalRevenue - commissionDeducted;

    return res.json({
      success: true,
      analytics: {
        productCount: productCount || 0,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        commissionDeducted: parseFloat(commissionDeducted.toFixed(2)),
        netEarnings: parseFloat(netEarnings.toFixed(2)),
        orderCounts: {
          pending: pendingFulfillmentCount,
          shipped: shippedCount,
          delivered: deliveredCount,
          total: orderItems.length
        }
      },
      recentSales: orderItems.slice(0, 5) // Send last 5 orders
    });

  } catch (error) {
    console.error('Seller dashboard metrics error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving metrics.' });
  }
});

// 4. UPDATE SELLER PROFILE (Seller Auth required)
router.put('/profile', authenticateToken, authorizeRoles('seller'), async (req, res) => {
  const { business_name, story, craft_type, city, state, upi_id, bank_details } = req.body;

  try {
    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const updateData = {};
    if (business_name !== undefined) updateData.business_name = business_name;
    if (story !== undefined) updateData.story = story;
    if (craft_type !== undefined) updateData.craft_type = craft_type;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (upi_id !== undefined) updateData.upi_id = upi_id;
    if (bank_details !== undefined) updateData.bank_details = bank_details;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('seller_profiles')
      .update(updateData)
      .eq('id', seller.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({ 
      success: true, 
      message: 'Seller profile updated successfully!', 
      profile: updatedProfile 
    });

  } catch (error) {
    console.error('Update seller profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

module.exports = router;
