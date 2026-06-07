const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'artify_secret_session_token_key_2026';

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { email, password, role, name, phone } = req.body;

  // Simple input validation
  if (!email || !password || !role || !name) {
    return res.status(400).json({ success: false, message: 'Please provide email, password, role, and name.' });
  }

  // Validate role
  if (!['customer', 'seller'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role. Choose "customer" or "seller".' });
  }

  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
          name,
          phone: phone || null
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // If user is a seller, initialize their seller profile
    let sellerProfile = null;
    if (role === 'seller') {
      const { data: profile, error: profileError } = await supabase
        .from('seller_profiles')
        .insert([
          {
            user_id: newUser.id,
            business_name: `${name}'s Crafts`,
            story: 'Tell your customers about your journey, your craft, and the materials you use.',
            craft_type: 'Clay Products / Pottery',
            city: 'Unknown',
            state: 'Unknown',
            upi_id: '',
            bank_details: '',
            is_approved: false // Requires admin approval
          }
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Failed to create seller profile:', profileError);
        // Rollback user creation to maintain integrity
        await supabase.from('users').delete().eq('id', newUser.id);
        return res.status(500).json({ success: false, message: 'Failed to initialize seller profile.' });
      }
      sellerProfile = profile;
    }

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        sellerProfileId: sellerProfile ? sellerProfile.id : null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    // Find user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Fetch seller profile id if seller
    let sellerProfileId = null;
    let isApprovedSeller = false;
    if (user.role === 'seller') {
      const { data: profile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('id, is_approved')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profile) {
        sellerProfileId = profile.id;
        isApprovedSeller = profile.is_approved;
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        sellerProfileId,
        isApprovedSeller
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// 3. GET CURRENT USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, name, phone, created_at')
      .eq('id', req.user.id)
      .single();

    if (fetchError) throw fetchError;

    let profileData = null;
    if (user.role === 'seller') {
      const { data: profile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      profileData = profile;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        sellerProfile: profileData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
});

module.exports = router;
