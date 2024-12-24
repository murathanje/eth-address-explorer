const express = require('express');
const cors = require('cors');
const path = require('path');
const addressRoutes = require('./routes/addressRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'templates' directory
app.use(express.static(path.join(__dirname, 'templates')));

// Routes
app.use('/api/address', addressRoutes);

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Ethereum Address Explorer is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
}); 