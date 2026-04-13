
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-lite-preview';

async function testModel() {
    console.log(`Probando modelo: ${MODEL}...`);
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hola, di "Gemini 3.1 Lite funcionando" si me escuchas.' }] }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('EXITO:', data.candidates[0].content.parts[0].text);
        } else {
            console.error('ERROR:', response.status, JSON.stringify(data));
        }
    } catch (e) {
        console.error('EXCEPCIÓN:', e.message);
    }
}

testModel();
