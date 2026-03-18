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
    origin: function (origin, callback) {
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
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: 'Progress', enum: ['Progress', 'Cancel', 'Done'] },
    isPublic: { type: Boolean, default: true },
    messages: [{
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
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

// API to add a message to an interaction (public)
app.patch('/api/interactions/:id/message', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Message text is required' });

        const result = await Interaction.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: { text } } },
            { new: true }
        );

        if (!result) return res.status(404).json({ error: 'Interaction not found' });
        res.status(200).json({ message: 'Message added successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add message' });
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

// API to delete an interaction (protected)
app.delete('/api/admin/interactions/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer siam-admin-token-2026') return res.status(401).json({ error: 'Unauthorized' });

        const result = await Interaction.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// API to update an interaction (protected)
app.put('/api/admin/interactions/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer siam-admin-token-2026') return res.status(401).json({ error: 'Unauthorized' });

        // Update finalSalami (or other fields)
        const result = await Interaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!result) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ message: 'Updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// API to update interaction status (protected)
app.patch('/api/admin/interactions/:id/status', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer siam-admin-token-2026') return res.status(401).json({ error: 'Unauthorized' });

        const { status } = req.body;
        if (!['Progress', 'Cancel', 'Done'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await Interaction.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!result) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ message: 'Status updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// API to update interaction public visibility (protected)
app.patch('/api/admin/interactions/:id/visibility', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer siam-admin-token-2026') return res.status(401).json({ error: 'Unauthorized' });

        const { isPublic } = req.body;
        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ error: 'Invalid isPublic value' });
        }

        const result = await Interaction.findByIdAndUpdate(req.params.id, { isPublic }, { new: true });
        if (!result) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ message: 'Visibility updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update visibility' });
    }
});

// API to edit a specific message (protected)
app.put('/api/admin/interactions/:id/message/:messageId', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer siam-admin-token-2026') return res.status(401).json({ error: 'Unauthorized' });

        const { text } = req.body;
        const result = await Interaction.findOneAndUpdate(
            { _id: req.params.id, "messages._id": req.params.messageId },
            { $set: { "messages.$.text": text } },
            { new: true }
        );

        if (!result) return res.status(404).json({ error: 'Interaction or message not found' });
        res.status(200).json({ message: 'Message updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// API to delete a specific message (protected)
app.delete('/api/admin/interactions/:id/message/:messageId', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== 'Bearer siam-admin-token-2026') return res.status(401).json({ error: 'Unauthorized' });

        const result = await Interaction.findByIdAndUpdate(
            req.params.id,
            { $pull: { messages: { _id: req.params.messageId } } },
            { new: true }
        );

        if (!result) return res.status(404).json({ error: 'Interaction not found' });
        res.status(200).json({ message: 'Message deleted successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// GET public interactions
app.get('/api/public/interactions', async (req, res) => {
    try {
        // Only fetch required fields: visitorName, status, timestamp
        // And only those explicitly marked as public
        const interactions = await Interaction.find({ isPublic: { $ne: false } })
            .select('visitorName status timestamp')
            .sort({ timestamp: -1 });
        res.status(200).json(interactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch public interactions' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
