const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'qa_data.json');

app.use(bodyParser.json());
app.use(express.static('public'));

async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

let qaData = {};

loadData().then(data => {
    qaData = data;
});

app.get('/api/qa/:id', (req, res) => {
    const id = req.params.id;
    if (qaData[id]) {
        const { question, answers } = qaData[id];
        const latestAnswer = answers.length > 0 ? answers[answers.length - 1] : null;
        res.json({ question, latestAnswer });
    } else {
        res.status(404).json({ error: 'Question not found' });
    }
});

app.post('/api/qa/:id', async (req, res) => {
    const id = req.params.id;
    const { answer } = req.body;
    if (answer) {
        if (!qaData[id]) {
            qaData[id] = { question: `Question ${id}`, answers: [] };
        }
        qaData[id].answers.push({
            text: answer,
            timestamp: new Date().toISOString()
        });
        await saveData(qaData);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Invalid request' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});