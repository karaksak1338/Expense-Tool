const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dhmouevprsqxtulhqzqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobW91ZXZwcnNxeHR1bGhxenFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjcwMDMsImV4cCI6MjA4NzYwMzAwM30.liJiYTJBSNeeWHOAPvIslsjknUaI4p_fCrsh-q_JCwY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
    const { data, error } = await supabase.from('expense_items').select('*').limit(1);
    if (error) {
        console.error('Audit Error:', error);
    } else {
        console.log('Columns in expense_items:', Object.keys(data[0] || {}));
    }
}

checkCols();
