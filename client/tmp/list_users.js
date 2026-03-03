import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhmouevprsqxtulhqzqp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobW91ZXZwcnNxeHR1bGhxenFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjcwMDMsImV4cCI6MjA4NzYwMzAwM30.liJiYTJBSNeeWHOAPvIslsjknUaI4p_fCrsh-q_JCwY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
    console.log("Listing all users in public.users table...");
    const { data, error } = await supabase
        .from('users')
        .select('name, email, roles');

    if (error) {
        console.error("Error listing users:", error.message);
    } else {
        console.log("Users found:", data);
    }
}

listUsers();
