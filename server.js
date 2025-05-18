const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Redis client (Render Key-Value DB üçün)
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.connect().catch(console.error);

// Statik faylları göstər
app.use(express.static('public'));

// Socket.io bağlantısı
io.on('connection', (socket) => {
  socket.on('join', async (room) => {
    socket.join(room);

    // Redis-dən həmin otağın mətnini oxu
    let content = '';
    try {
      content = await redisClient.get(room) || '';
    } catch (err) {
      console.error('Redis error (get):', err);
    }

    socket.emit('code', content);

    socket.on('code', async (data) => {
      try {
        await redisClient.set(data.room, data.content);
        socket.to(data.room).emit('code', data.content);
      } catch (err) {
        console.error('Redis error (set):', err);
      }
    });
  });
});

// Bütün GET istəkləri üçün index.html göstər
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serveri işə sal
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
