const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../client/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('entities').select('*').limit(1);
    if (error) {
        console.error('Error fetching entities:', error);
    } else {
        console.log('Sample entity columns:', Object.keys(data[0] || {}));
    }
}

checkSchema();
