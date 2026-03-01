const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from the client directory
const envPath = path.join(__dirname, '../client/.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    console.error('ERROR: client/.env not found at', envPath);
    process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase URL or Anon Key in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Running robust prompt initialization...');
    try {
        const prompts = [
            {
                prompt_type: 'receipt',
                prompt_text: 'Extract the following details from this receipt image. \nCRITICAL RULES:\n1. The "expense_type" MUST exactly match one of these explicitly allowed categories: [{{allowedCategories}}]. If no category matches perfectly, pick the closest one from the list.\n2. If the VAT % is not clearly visible or stated, leave "vat_percentage" as null.'
            },
            {
                prompt_type: 'statement',
                prompt_text: 'Extract all transaction lines from this bank statement into a structured list.\nCRITICAL RULES:\n1. For each transaction, identify the Date (YYYY-MM-DD), Merchant/Vendor, Amount, and Currency code.\n2. Assign a "suggestedType" from this list: [{{allowedCategories}}].\n3. If a line is not a transaction (e.g., summary, header, balance), ignore it.\n4. Output MUST be a single JSON object containing a "transactions" array.'
            }
        ];

        for (const p of prompts) {
            const { error: upsertErr } = await supabase.from('ai_prompts').upsert(p, { onConflict: 'prompt_type' });
            if (upsertErr) {
                console.error(`Failed to upsert prompt ${p.prompt_type}:`, upsertErr);
            } else {
                console.log(`Successfully synced ${p.prompt_type} prompt.`);
            }
        }
        console.log('Prompt initialization complete.');
    } catch (err) {
        console.error('Fatal setup error:', err);
    }
}
run();
