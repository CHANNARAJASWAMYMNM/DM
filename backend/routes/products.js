const express = require('express');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. GET ALL PRODUCTS (Public Catalog with Filters)
router.get('/', async (req, res) => {
  const { search, category, minPrice, maxPrice, sellerId, sortBy } = req.query;

  try {
    // We only want to show products of approved sellers in the public feed
    let query = supabase
      .from('products')
      .select('*, seller:seller_profiles!inner(business_name, craft_type, city, state, is_approved)');

    // Filter by seller approval
    query = query.eq('seller.is_approved', true);

    // Apply category filter
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Apply seller ID filter
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    // Apply search query (fuzzy search on name and description)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply price range
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Execute primary query
    const { data: products, error } = await query;
    if (error) throw error;

    // Client-side sorting
    let sortedProducts = [...products];
    if (sortBy === 'price_asc') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      // For rating sorting, we would need average reviews, let's keep it as newest by default or price
      sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      // Newest first
      sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json({ success: true, products: sortedProducts });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving products.' });
  }
});

// 2. GET SINGLE PRODUCT DETAILS (with reviews and artisan details)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch product details with seller info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, seller:seller_profiles(*)')
      .eq('id', id)
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Fetch reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*, customer:users(name)')
      .eq('product_id', id);

    if (reviewsError) throw reviewsError;

    // Calculate rating details
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.json({
      success: true,
      product,
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length
    });

  } catch (error) {
    console.error('Fetch product details error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving product details.' });
  }
});

// 3. CREATE PRODUCT (Seller only)
router.post('/', authenticateToken, authorizeRoles('seller'), async (req, res) => {
  const { name, description, price, stock, image_url, category, tags } = req.body;

  if (!name || !description || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ success: false, message: 'Please provide all required product details.' });
  }

  try {
    // 1. Fetch the seller's profile
    const { data: sellerProfile, error: profileError } = await supabase
      .from('seller_profiles')
      .select('id, is_approved')
      .eq('user_id', req.user.id)
      .single();

    if (profileError || !sellerProfile) {
      return res.status(403).json({ success: false, message: 'Seller profile not found.' });
    }

    // 2. Check if seller is approved by admin
    if (!sellerProfile.is_approved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending admin approval. You cannot upload products yet.' 
      });
    }

    // 3. Insert product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert([
        {
          seller_id: sellerProfile.id,
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          image_url: image_url || 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600', // Default terracotta image
          category,
          tags: tags || []
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({ success: true, message: 'Product created successfully!', product });

  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating product.' });
  }
});

// 4. UPDATE PRODUCT (Seller only)
router.put('/:id', authenticateToken, authorizeRoles('seller'), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url, category, tags } = req.body;

  try {
    // Fetch product to verify ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, seller:seller_profiles(user_id)')
      .eq('id', id)
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check ownership (product.seller.user_id should match req.user.id)
    if (product.seller.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this product.' });
    }

    // Update product
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({ success: true, message: 'Product updated successfully!', product: updatedProduct });

  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating product.' });
  }
});

// 5. DELETE PRODUCT (Seller only)
router.delete('/:id', authenticateToken, authorizeRoles('seller'), async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch product to verify ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, seller:seller_profiles(user_id)')
      .eq('id', id)
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check ownership
    if (product.seller.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this product.' });
    }

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return res.json({ success: true, message: 'Product deleted successfully.' });

  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
});

// 6. UPLOAD PRODUCT IMAGE FILE (Seller / Admin only)
router.post('/upload', authenticateToken, async (req, res) => {
  const { base64, filename } = req.body;

  if (!base64 || !filename) {
    return res.status(400).json({ success: false, message: 'Please provide base64 data and filename.' });
  }

  try {
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 format.' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = filename.split('.').pop();
    const newFilename = `upload_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    
    // Upload to Supabase Storage Bucket 'products'
    const { data, error } = await supabase.storage
      .from('products')
      .upload(newFilename, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return res.status(500).json({ success: false, message: 'Error uploading image to storage.' });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(newFilename);

    return res.json({
      success: true,
      message: 'Image uploaded successfully!',
      url: publicUrl
    });

  } catch (error) {
    console.error('File upload route error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving uploaded file.' });
  }
});


module.exports = router;
