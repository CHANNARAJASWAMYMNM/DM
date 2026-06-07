const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply Admin restriction to all routes in this file
router.use(authenticateToken, authorizeRoles('admin'));

// 1. GET ADMIN DASHBOARD METRICS
router.get('/dashboard/analytics', async (req, res) => {
  try {
    // A. Users count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role, name, email, created_at');

    if (usersError) throw usersError;

    const totalUsers = users.length;
    const customerCount = users.filter(u => u.role === 'customer').length;
    const sellerCount = users.filter(u => u.role === 'seller').length;

    // B. Sellers status count
    const { data: sellers, error: sellersError } = await supabase
      .from('seller_profiles')
      .select('id, is_approved');

    if (sellersError) throw sellersError;

    const totalSellers = sellers.length;
    const approvedSellers = sellers.filter(s => s.is_approved).length;
    const pendingSellers = totalSellers - approvedSellers;

    // C. Orders and Payment Aggregates
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at');

    if (ordersError) throw ordersError;

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, commission_amount, seller_payout_amount, status');

    if (paymentsError) throw paymentsError;

    let totalGrossSales = 0;
    let totalCommissionRevenue = 0;

    // Sum up payments that are completed
    payments.forEach(p => {
      if (p.status === 'completed' || p.status === 'pending') {
        totalGrossSales += parseFloat(p.amount);
        totalCommissionRevenue += parseFloat(p.commission_amount);
      }
    });

    // Sort users and orders to get recent actions
    const sortedUsers = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      analytics: {
        totalUsers,
        customerCount,
        sellerCount,
        totalSellers,
        approvedSellers,
        pendingSellers,
        totalGrossSales: parseFloat(totalGrossSales.toFixed(2)),
        totalCommissionRevenue: parseFloat(totalCommissionRevenue.toFixed(2)),
        activeOrderCount: orders.filter(o => o.status !== 'cancelled').length
      },
      recentUsers: sortedUsers.slice(0, 5),
      recentOrders: sortedOrders.slice(0, 5)
    });

  } catch (error) {
    console.error('Admin dashboard analytics error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin metrics.' });
  }
});

// 2. GET ALL SELLERS (Approved + Pending)
router.get('/sellers', async (req, res) => {
  try {
    const { data: sellers, error } = await supabase
      .from('seller_profiles')
      .select('*, user:users(name, email, phone)');

    if (error) throw error;

    return res.json({ success: true, sellers });
  } catch (error) {
    console.error('Admin list sellers error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing sellers.' });
  }
});

// 3. APPROVE/REJECT SELLER
router.put('/sellers/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body; // boolean

  if (approve === undefined) {
    return res.status(400).json({ success: false, message: 'Please specify true/false for approval.' });
  }

  try {
    const { data: updatedSeller, error } = await supabase
      .from('seller_profiles')
      .update({ is_approved: approve })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ 
      success: true, 
      message: `Seller has been ${approve ? 'approved' : 'suspended'}.`, 
      seller: updatedSeller 
    });

  } catch (error) {
    console.error('Seller approval error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating seller approval status.' });
  }
});

// 4. GET ALL USERS (Admin / Seller / Customer list)
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, phone, created_at');

    if (error) throw error;

    return res.json({ success: true, users });
  } catch (error) {
    console.error('Admin fetch users error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
});

// 5. DELETE USER (Admin management)
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting user.' });
  }
});

module.exports = router;
