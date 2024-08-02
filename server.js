const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'qa_data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

let qaData = {};

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

app.get('/api/qa/:id', (req, res) => {
    const id = req.params.id;
    if (qaData[id]) {
      const { question, answers } = qaData[id];
      const latestAnswer = answers.length > 0 ? answers[answers.length - 1] : null;
      res.json({ question, latestAnswer, answers });
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  });
  
app.post('/api/qa/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    const { answer } = req.body;
    const image = req.file;
  
    if (answer || image) {
      if (!qaData[id]) {
        qaData[id] = { question: `Question ${id}`, answers: [] };
      }
      const newAnswer = {
        text: answer || '', // Use an empty string if no text is provided
        timestamp: new Date().toISOString(),
        image: image ? `/uploads/${image.filename}` : null // null if no image is uploaded
      };
      qaData[id].answers.push(newAnswer);
      await saveData(qaData);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid request: Please provide either text or an image' });
    }
  });

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});