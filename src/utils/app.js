const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const helmet = require('helmet');
// const xss = require('xss-clean');
// const rateLimit = require('express-rate-limit');

const app = express();

// Basic Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Security Middleware
// app.use(helmet());
// app.use(xss());
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 mins
//     max: 100, // limit per IP
//     message: "Too many requests, please try again later.",
//   })
// );

// 📦 Routes
const authRoutes = require('../routes/authRoutes.js');
const chatRoutes = require('../routes/chatRoutes.js');
const messageRoutes = require('../routes/messageRoutes.js');
const notificationRoutes = require('../routes/notificationRoutes.js');
const uploadRoutes = require('../routes/uploadRoutes.js');
const fileRoutes = require('../routes/fileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', fileRoutes);

module.exports = app;
