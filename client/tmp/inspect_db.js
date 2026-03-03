
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTable() {
    console.log('--- Inspecting Table: claims ---');

    // 1. Check Columns
    const { data: cols, error: colErr } = await supabase.rpc('get_table_columns', { table_name: 'claims' });
    if (colErr) {
        // Fallback: search for columns info if RPC doesn't exist
        const { data: sample, error: sampleErr } = await supabase.from('claims').select('*').limit(1);
        if (sampleErr) {
            console.error('Error fetching sample to infer columns:', sampleErr);
        } else {
            console.log('Sample Row Keys (Columns):', Object.keys(sample[0] || {}).join(', '));
        }
    } else {
        console.log('Columns:', cols.map(c => c.column_name).join(', '));
    }

    // 2. Check RLS Policies (requires access to pg_policies)
    const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'claims');
    if (polErr) {
        // Fallback: try raw query via RPC if allowed
        const { data: rawPol, error: rawPolErr } = await supabase.rpc('get_policies', { t_name: 'claims' });
        if (rawPolErr) {
            console.warn('Could not fetch RLS policies via standard methods. Proceeding with schema check.');
        } else {
            console.log('Policies (via RPC):', JSON.stringify(rawPol, null, 2));
        }
    } else {
        console.log('Policies:', JSON.stringify(policies, null, 2));
    }

    // 3. Check specific missing columns from code
    const columnsToCheck = ['history', 'approval_status', 'claim_status', 'currency', 'claim_type'];
    console.log('Verifying crucial columns existence...');
}

// Helper to get columns if RPC is missing
async function fallbackInspect() {
    const { data, error } = await supabase.from('claims').select('*').limit(1);
    if (data) {
        console.log('Detected Columns:', Object.keys(data[0] || {}).join(', '));
    } else {
        console.error('Failed to detect columns. Error:', error);
    }
}

inspectTable().then(() => fallbackInspect());
