import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const extractionSchema = {
    type: SchemaType.OBJECT,
    properties: {
        expense_currency: {
            type: SchemaType.STRING,
            description: 'ISO 4217 Currency Code (e.g. USD, EUR, TRY)'
        },
        gross_amount: {
            type: SchemaType.NUMBER,
            description: 'Total absolute gross amount printed on the receipt'
        },
        vat_percentage: {
            type: SchemaType.NUMBER,
            description: 'VAT Percentage if explicitly stated (e.g. 19 for 19%), otherwise null'
        },
        transaction_date: {
            type: SchemaType.STRING,
            description: 'Date of the transaction in YYYY-MM-DD format based on the receipt'
        },
        vendor_name: {
            type: SchemaType.STRING,
            description: 'Name of the business or vendor'
        },
        expense_type: {
            type: SchemaType.STRING,
            description: 'Must exactly match one of the provided allowed categories in the prompt'
        }
    },
    required: ['expense_currency', 'gross_amount', 'transaction_date', 'vendor_name', 'expense_type']
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/api/extract', upload.single('receipt'), async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured in Vercel Environment Variables');
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No receipt file provided' });
        }

        const allowedCategories = req.body.allowedCategories || 'Other';
        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

        // Fetch dynamic prompt from DB
        let promptTemplate = `Extract the following details from this receipt image. 
        CRITICAL RULES:
        1. The 'expense_type' MUST exactly match one of these explicitly allowed categories: [{{allowedCategories}}]. If no category matches perfectly, pick the closest one from the list.
        2. If the VAT % is not clearly visible or stated, leave 'vat_percentage' as null.`;

        try {
            const { data: prompts } = await supabase.from('ai_prompts').select('prompt_text').eq('prompt_type', 'receipt').single();
            if (prompts && prompts.prompt_text) {
                promptTemplate = prompts.prompt_text;
            }
        } catch (err) {
            console.warn("Could not fetch ai_prompts from DB, using fallback", err.message);
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
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: extractionSchema,
                temperature: 0.1
            }
        });

        const result = await model.generateContent([finalPrompt, filePart]);
        const extractedText = result.response.text();

        let parsedData;
        try {
            parsedData = JSON.parse(extractedText);
        } catch (je) {
            throw new Error("Model returned malformed JSON");
        }

        res.json({
            raw_json: extractedText,
            parsed: parsedData,
            model_version: 'gemini-1.5-flash',
            file_hash: fileHash
        });

    } catch (error) {
        console.error("Gemini Extraction Error:", error);
        res.status(500).json({
            error: 'Failed to extract receipt data',
            details: error.message
        });
    }
});

export default app;
