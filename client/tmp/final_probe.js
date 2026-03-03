
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCols() {
    console.log('--- Probing Claims Table Columns ---');
    // We try to select the specific columns that often cause the 406/RLS error if missing
    const { data, error } = await supabase.from('claims').select('id, history, submission_date').limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('column') || error.code === '42703') {
            console.error('❌ CONFIRMED: Missing columns in "claims" table.');
            console.error('Error Detail:', error.message);
            console.log('\n>>> ACTION REQUIRED: You MUST run the fix_claims_columns.sql script in Supabase SQL Editor.');
        } else {
            console.error('Unexpected Error:', error);
        }
    } else {
        console.log('✅ Columns "history" and "submission_date" exist.');
        console.log('If RLS still fails, it might be a policy logic issue or a missing "currency" column.');

        // Check currency column too
        const { error: curErr } = await supabase.from('claims').select('currency').limit(1);
        if (curErr) {
            console.error('❌ Missing "currency" column:', curErr.message);
        } else {
            console.log('✅ Column "currency" exists.');
        }
    }
}

checkCols();
