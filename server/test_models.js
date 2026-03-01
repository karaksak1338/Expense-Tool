const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
require('dotenv').config({ path: '../client/.env' });

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log("Attempting to hit gemini-1.5-flash with v1...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash (v1) check: OK");
    } catch (err) {
        console.error("gemini-1.5-flash (v1) failed:", err.message);
    }

    try {
        console.log("Attempting to hit gemini-1.5-flash with current default...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash (default) check: OK");
    } catch (err) {
        console.error("gemini-1.5-flash (default) failed:", err.message);
    }

    try {
        console.log("Attempting to hit gemini-1.5-flash-latest...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash-latest (default) check: OK");
    } catch (err) {
        console.error("gemini-1.5-flash-latest (default) failed:", err.message);
    }
}
run();
