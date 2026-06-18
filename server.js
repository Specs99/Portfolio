const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (the portfolio itself)
app.use(express.static(path.join(__dirname)));

// Contact Form API Endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    console.log('\n--- New Contact Submission ---');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);
    console.log('------------------------------\n');

    // In a real production environment, you would send this to a database or an email service (like Nodemailer)
    
    // Send a success response
    res.status(200).json({ success: true, message: 'Message received successfully!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend Server running at http://localhost:${PORT}`);
});
