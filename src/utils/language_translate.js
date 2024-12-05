const express = require('express');
const translate = require('translate-google');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Translate Function
(async () => {
    const text = "Hello, how are you?";
    const targetLanguage = "es";

    try {
        const translatedText = await translate(text, { to: targetLanguage });
        const data = {
            originalText: text,
            translatedText: translatedText,
            targetLanguage: targetLanguage,
        };
        console.log(data);
    } catch (error) {
        console.error('Translation error:', error.message || error);
    }
})();

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
