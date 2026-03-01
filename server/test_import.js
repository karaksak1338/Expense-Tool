try {
    const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
    console.log("Successfully imported @google/generative-ai");
    console.log("SchemaType definition:", !!SchemaType);
    process.exit(0);
} catch (e) {
    console.error("Import failed:", e.message);
    process.exit(1);
}
