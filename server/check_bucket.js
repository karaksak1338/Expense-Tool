const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../client/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureBucket() {
    const { data, error } = await supabase.storage.createBucket('receipts', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket "receipts" already exists.');
        } else {
            console.error('Error creating bucket:', error.message);
        }
    } else {
        console.log('Bucket "receipts" created successfully.');
    }
}

ensureBucket();
