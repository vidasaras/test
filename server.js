const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {}; // Store users by their unique IDs

app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  // Generate and assign a unique user ID
  const userId = uuid.v4();
  users[userId] = socket;

  // Send user ID to the client
  socket.emit('userId', userId);
  
  console.log(`User connected with ID: ${userId}`);

  // Handle incoming offer, answer, and candidate
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
