import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/salami_db";

const allowedOrigins = [
  'http://localhost:5173', 
  'https://salami-app.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Mongoose Schema for Interactions
const interactionSchema = new mongoose.Schema({
  visitorName: { type: String, required: true },
  relation: { type: String, required: true },
  q1Option: { type: String, required: true },
  q2Option: { type: String, required: true },
  incomeOption: { type: String, required: true },
  incomeAmount: { type: Number, default: null },
  finalSalami: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Interaction = mongoose.model('Interaction', interactionSchema);

// API to save a new interaction
app.post('/api/interactions', async (req, res) => {
    try {
        const interactionData = req.body;
        
        if (!interactionData) {
            return res.status(400).json({ error: 'Interaction data is required' });
        }

        const newInteraction = new Interaction(interactionData);
        await newInteraction.save();

        res.status(201).json({ message: 'Interaction saved successfully', data: newInteraction });
    } catch (error) {
        console.error('Error saving interaction:', error);
        res.status(500).json({ error: 'Failed to save interaction' });
    }
});

// API for admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // In a real app, use hashed passwords in the DB.
    if (username === 'siam' && password === 'salami2026') {
        res.status(200).json({ token: 'siam-admin-token-2026' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// API to get all interactions (protected)
app.get('/api/admin/interactions', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader !== 'Bearer siam-admin-token-2026') {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch all interactions sorted by newest first
        const data = await Interaction.find().sort({ timestamp: -1 });
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
