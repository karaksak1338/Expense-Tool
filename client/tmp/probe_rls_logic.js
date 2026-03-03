
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectRLS() {
    console.log('--- Inspecting RLS Policies for "claims" ---');
    // We try to query pg_policies via RPC to see the active rules
    const { data: policies, error } = await supabase.rpc('get_policies_for_table', { table_name: 'claims' });

    if (error) {
        console.error('RPC "get_policies_for_table" failed. Trying alternative...');
        // Fallback: try to see if we can read from pg_policies directly via standard select (unlikely to work without bypass)
        const { data: direct, error: directErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'claims');
        if (directErr) {
            console.error('Could not fetch RLS rules via standard client.');
            console.log('Attempting to create a temporary test row to check policy behavior...');

            // Test insert with Service Role (should always work)
            const testId = 'TEST-RLS-' + Date.now();
            const { error: insErr } = await supabase.from('claims').insert({
                id: testId,
                title: 'RLS Probe',
                user_id: '429040bb-f520-4f88-a285-8f3c42ef32fe', // The user ID from the user's logs
                entity_id: 'E1',
                claim_status: 'NEW',
                approval_status: 'N/A'
            });

            if (insErr) {
                console.error('SERVICE ROLE INSERT FAILED. This implies a hard schema constraint (NULL check, FK, etc), NOT RLS.');
                console.error('Error:', insErr);
            } else {
                console.log('✅ Service Role insert worked. The issue is definitely RLS Policy logic for non-service-role users.');
                await supabase.from('claims').delete().eq('id', testId);
            }
        } else {
            console.log('Direct Policies:', JSON.stringify(direct, null, 2));
        }
    } else {
        console.log('Active Policies:', JSON.stringify(policies, null, 2));
    }
}

inspectRLS();
