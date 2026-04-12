import express from 'express';
import { logger } from './logger.js';
import dotenv from 'dotenv';

import { russianWords } from './words_collections/russian-words.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(logger);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('content/index.ejs');
});

app.get('/word/en', async (req, res) => {
    const word = await getRandomWord();

    const data = { word: word };

    res.send(data);
});

app.get('/word/ru', async (req, res) => {
    const word = getRandomWordFromArray(russianWords);

    const data = { word: word };

    res.send(data);
});

app.post('/train/check', async (req, res) => {
    const isCorrect = await isCorrectTranslation(req.body.currentWord, req.body.targetWord);

    const data = { isCorrect: isCorrect };

    res.send(data);
});

app.post('/train/translations', async (req, res) => {
    const translations = await getTranslations(req.body.currentLanguageCode, req.body.targetWord);

    const data = { translations };

    res.send(data);
})

app.listen(port, (err) => {
    if (err) {
        console.error('Server setup error: ' + err);

        return;
    }

    console.log(`Server is running on port ${port}.`);
});

async function getRandomWord() {
    try {
        const response = await fetch(process.env.RANDOM_WORD_API_URL + '/word?diff=' + process.env.RANDOM_WORD_DIFF_LEVEL);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();

        return normalizeWord(result[0]);
    } catch (err) {
        console.error(`Get random word error: ` + err);
    } 
}

async function isCorrectTranslation(currentWord, targetWord) {
    const translations = await getTranslations({ languageCode: currentWord.languageCode }, targetWord);

    return await compareWords(currentWord, translations);
}

async function compareWords(targetWord, translated) {
    if (targetWord.word.toLowerCase() === translated.translatedText.toLowerCase()) return true;

    for (let i = 0; i < translated.alternatives.length; i++) {
        if (targetWord.word.toLowerCase() === translated.alternatives[i].toLowerCase()) return true;
    }

    return false;
}

async function getTranslations(currentLanguageCode, targetWord) {
    try {
        const response = await fetch(process.env.LIBRETRANSLATE_URL + '/translate', {
            method: "POST",
            body: JSON.stringify({
                q: targetWord.word,
                source: targetWord.languageCode,
                target: currentLanguageCode.languageCode,
                format: "text",
                alternatives: 6,
                api_key: ""
            }),
            headers: { "Content-Type": "application/json" },
        });
        
        const result = await response.json();

        return result;
    } catch (err) {
        console.error('Check translation error: ' + err);
    }
}

function getRandomWordFromArray(arr) {
    return normalizeWord(arr[Math.floor(Math.random() * arr.length)]);
}

function normalizeWord(word) {
    return word[0].toUpperCase() + word.substring(1, word.length)
}