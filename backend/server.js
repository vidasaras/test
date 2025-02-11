const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"]
  }
});

let users = {};

io.on('connection', (socket) => {
  const userId = uuid.v4();
  users[userId] = socket;

  socket.emit('userId', userId);
  console.log(`User connected with ID: ${userId}`);

  socket.on('offer', (data) => {
    const receiverSocket = users[data.receiverId];
    if (receiverSocket) {
      receiverSocket.emit('offer', {
        offer: data.offer,
        senderId: data.senderId
      });
    }
  });

  socket.on('answer', (data) => {
    const receiverSocket = users[data.receiverId];
    if (receiverSocket) {
      receiverSocket.emit('answer', data.answer);
    }
  });

  socket.on('candidate', (data) => {
    const receiverSocket = users[data.receiverId];
    if (receiverSocket) {
      receiverSocket.emit('candidate', data.candidate);
    }
  });

  socket.on('disconnect', () => {
    delete users[userId];
    console.log(`User disconnected with ID: ${userId}`);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
