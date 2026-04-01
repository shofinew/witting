require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db.js');
const authRoutes = require('./src/routes/auth.js');
const eventRoutes = require('./src/routes/event.js');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to Database
connectDB();

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.use('/api', authRoutes);
app.use('/api', eventRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
