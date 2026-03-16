import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data:', error);
    }
};

// API to save a new interaction
app.post('/api/interactions', (req, res) => {
    const interaction = req.body;
    
    if (!interaction) {
        return res.status(400).json({ error: 'Interaction data is required' });
    }

    // Add a unique ID and ensure timestamp exists
    const newInteraction = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...interaction
    };

    const data = readData();
    data.push(newInteraction);
    writeData(data);

    res.status(201).json({ message: 'Interaction saved successfully', data: newInteraction });
});

// API for admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'siam' && password === 'salami2026') {
        // Return a simple token for verification
        res.status(200).json({ token: 'siam-admin-token-2026' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// API to get all interactions (protected)
app.get('/api/admin/interactions', (req, res) => {
    const authHeader = req.headers.authorization;
    
    // Very simple authentication check for this project
    if (authHeader !== 'Bearer siam-admin-token-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = readData();
    // Return data sorted by newest first
    res.status(200).json(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
