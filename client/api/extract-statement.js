import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const statementSchema = {
    type: SchemaType.OBJECT,
    properties: {
        transactions: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    date: { type: SchemaType.STRING, description: 'Date of transaction (YYYY-MM-DD)' },
                    vendor: { type: SchemaType.STRING, description: 'Merchant or Description' },
                    transaction_amount: { type: SchemaType.NUMBER, description: 'Original amount in the local currency' },
                    transaction_currency: { type: SchemaType.STRING, description: 'Original currency code' },
                    billing_amount: { type: SchemaType.NUMBER, description: 'Final amount billed to the account' },
                    billing_currency: { type: SchemaType.STRING, description: 'Final currency of the account' },
                    suggestedType: { type: SchemaType.STRING, description: 'Suggested expense category' }
                },
                required: ['date', 'vendor', 'transaction_amount', 'transaction_currency', 'billing_amount', 'billing_currency']
            }
        }
    },
    required: ['transactions']
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/api/extract-statement', upload.single('statement'), async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured in Vercel');
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No statement file provided' });
        }

        const allowedCategories = req.body.allowedCategories || 'Other';

        let promptTemplate = `Extract all transaction lines from this bank statement into a structured list.
        CRITICAL RULES:
        1. For each transaction, identify the Date (YYYY-MM-DD), Merchant/Vendor, Amount, and Currency code.
        2. Assign a 'suggestedType' from this list: [{{allowedCategories}}].
        3. If a line is not a transaction (e.g., summary, header, balance), ignore it.
        4. Output MUST be a single JSON object containing a 'transactions' array.`;

        try {
            const { data: prompts } = await supabase.from('ai_prompts').select('prompt_text').eq('prompt_type', 'statement').single();
            if (prompts && prompts.prompt_text) {
                promptTemplate = prompts.prompt_text;
            }
        } catch (err) {
            console.warn("Could not fetch statement prompts from DB", err.message);
        }

        const finalPrompt = promptTemplate.replace('{{allowedCategories}}', allowedCategories);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const filePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype
            }
        };

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: statementSchema,
                temperature: 0.1
            }
        });

        const result = await model.generateContent([finalPrompt, filePart]);
        const extractedText = result.response.text();
        const parsed = JSON.parse(extractedText);

        res.json({
            raw_json: extractedText,
            transactions: parsed.transactions || [],
            model_version: 'gemini-2.0-flash'
        });

    } catch (error) {
        console.error("Statement Extraction Error:", error);
        res.status(500).json({
            error: 'Failed to extract statement data',
            details: error.message
        });
    }
});

export default app;
