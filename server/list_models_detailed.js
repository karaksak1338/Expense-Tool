const https = require('https');
const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log("AVAILABLE MODELS:");
        json.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    });
}).on('error', (err) => {
    console.error("Error: " + err.message);
});
