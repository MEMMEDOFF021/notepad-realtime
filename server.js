const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Redis bağlantısı
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://red-d0ji0fje5dus73chnbf0:6379'
});

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redisClient.connect();
  console.log('Redis-ə bağlandı!');
})();

// Real-time əlaqə
io.on('connection', (socket) => {
  console.log('Yeni istifadəçi:', socket.id);

  socket.on('join', async (room) => {
    if (!room) {
      console.error("Xəta: Otaq ID-si yoxdur!");
      room = "default-room";
    }

    socket.join(room);
    console.log(`Qoşuldu: ${socket.id} => ${room}`);

    try {
      const content = await redisClient.get(room);
      if (content) socket.emit('code', content);
    } catch (err) {
      console.error('Redis xətası:', err);
    }
  });

  socket.on('code', async (data) => {
    if (!data.room) return;
    await redisClient.set(data.room, data.content);
    socket.to(data.room).emit('code', data.content);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda işləyir`);
});
