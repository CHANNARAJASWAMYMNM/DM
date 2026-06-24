const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseKey || supabaseKey === 'your-supabase-key') {
  console.warn('\n⚠️  WARNING: Supabase credentials are not configured or are placeholder values.');
  console.warn('Please update the .env file with your Supabase project URL and API key.');
  console.warn('Refer to schema.sql for table setup instructions.\n');
}

// Create and export the supabase client
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');

module.exports = supabase;
