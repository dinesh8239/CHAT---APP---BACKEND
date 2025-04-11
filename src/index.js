const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const http = require('http');
const { Server } = require('socket.io');
const { setSocketInstance } = require("./controllers/messageController");

dotenv.config({ path: '../.env' });

const app = require('../src/utils/app');
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set('io', io); // So you can use it in controllers

// Track users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(' Socket connected:', socket.id);

  socket.on('setup', (user) => {
    socket.join(user._id);
    onlineUsers.set(user._id, socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('disconnect', () => {
    for (let [id, sid] of onlineUsers) {
      if (sid === socket.id) {
        onlineUsers.delete(id);
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

setSocketInstance(io);


connectDB().then(() => {
  const PORT = process.env.PORT || 4200;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
