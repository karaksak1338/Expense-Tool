import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhmouevprsqxtulhqzqp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobW91ZXZwcnNxeHR1bGhxenFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjcwMDMsImV4cCI6MjA4NzYwMzAwM30.liJiYTJBSNeeWHOAPvIslsjknUaI4p_fCrsh-q_JCwY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
    console.log("Checking public.users table for wfciadminsk@dcbi.aero...");
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'wfciadminsk@dcbi.aero')
        .single();

    if (error) {
        console.error("User not found in public.users table:", error.message);
    } else {
        console.log("User found in public.users table:", data);
    }
}

checkUsers();
