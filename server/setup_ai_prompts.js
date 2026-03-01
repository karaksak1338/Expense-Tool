const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dhmouevprsqxtulhqzqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobW91ZXZwcnNxeHR1bGhxenFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjcwMDMsImV4cCI6MjA4NzYwMzAwM30.liJiYTJBSNeeWHOAPvIslsjknUaI4p_fCrsh-q_JCwY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Running robust prompt initialization...');
    try {
        const { error: queryErr } = await supabase.from('ai_prompts').select('id').limit(1);

        if (queryErr && queryErr.code === '42P01') {
            console.log('Table ai_prompts does not exist. Please run this SQL in your Supabase SQL Editor:');
            console.log(`
CREATE TABLE IF NOT EXISTS public.ai_prompts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_type text NOT NULL UNIQUE,
    prompt_text text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.ai_prompts (prompt_type, prompt_text)
VALUES (
    'receipt',
    'Extract the following details from this receipt image. 
    CRITICAL RULES:
    1. The "expense_type" MUST exactly match one of these explicitly allowed categories: [{{allowedCategories}}]. If no category matches perfectly, pick the closest one from the list.
    2. If the VAT % is not clearly visible or stated, leave "vat_percentage" as null.'
) ON CONFLICT (prompt_type) DO NOTHING;
      `);
        } else {
            console.log('Table exists. Attempting seed...');
            const { error: insertErr } = await supabase.from('ai_prompts').insert([
                {
                    prompt_type: 'receipt',
                    prompt_text: 'Extract the following details from this receipt image. \nCRITICAL RULES:\n1. The "expense_type" MUST exactly match one of these explicitly allowed categories: [{{allowedCategories}}]. If no category matches perfectly, pick the closest one from the list.\n2. If the VAT % is not clearly visible or stated, leave "vat_percentage" as null.'
                }
            ]).select();

            if (insertErr && insertErr.code === '23505') {
                console.log('Seed data already present! (Unique violation)');
            } else if (insertErr) {
                console.error('Failed to seed:', insertErr);
            } else {
                console.log('Successfully seeded default receipt prompt.');
            }
        }
    } catch (err) {
        console.error('Fatal setup error:', err);
    }
}
run();
