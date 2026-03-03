
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePrompts() {
    console.log('Updating prompt types...');

    // Update receipt -> receipts
    const { error: err1 } = await supabase
        .from('ai_prompts')
        .update({ prompt_type: 'receipts' })
        .eq('prompt_type', 'receipt');

    if (err1) console.error('Error updating receipt:', err1);
    else console.log('Updated "receipt" to "receipts"');

    // Update statement -> bank_statement
    const { error: err2 } = await supabase
        .from('ai_prompts')
        .update({ prompt_type: 'bank_statement' })
        .eq('prompt_type', 'statement');

    if (err2) console.error('Error updating statement:', err2);
    else console.log('Updated "statement" to "bank_statement"');

    const { data } = await supabase.from('ai_prompts').select('*');
    console.log('Final Prompts:', data);
}

updatePrompts();
