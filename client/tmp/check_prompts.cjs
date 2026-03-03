
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrompts() {
    const { data, error } = await supabase.from('ai_prompts').select('*');
    if (error) {
        console.error('Error fetching prompts:', error);
    } else {
        console.log('Prompts count:', data.length);
        console.log('Prompts:', JSON.stringify(data, null, 2));
    }
}

checkPrompts();
