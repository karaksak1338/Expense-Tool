CREATE TABLE IF NOT EXISTS public.ai_prompts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_type text NOT NULL UNIQUE,
    prompt_text text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.ai_prompts (prompt_type, prompt_text)
VALUES (
    'receipt',
    'Extract the following details from this receipt image. 
    CRITICAL RULES:
    1. The "expense_type" MUST exactly match one of these explicitly allowed categories: [{{allowedCategories}}]. If no category matches perfectly, pick the closest one from the list.
    2. If the VAT % is not clearly visible or stated, leave "vat_percentage" as null.'
) ON CONFLICT (prompt_type) DO NOTHING;
