const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://default:11.10.2006ysf@red-d0ji0fje5dus73chnbf0:6379'
});

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redisClient.connect 
  console.log(' Məlumatlar saxlanılır və qorunur.');
})();

io.on('connection', (socket) => {
  
  socket.on('join', async (room) => {
    if (!room) {
      console.error("Xəta: Otaq ID-si yoxdur!");
      room = "default-room";
    }

    socket.join(room);
    console.log(` Yeni istifadəçi "code2002.info/${room}" otağına qoşuldu. `);
 
    try {
      const content = await redisClient.get(room);
      if (content) socket.emit('code', content);
    } catch (err) {
      console.error('Redis xətası:', err);
    }
  });

  socket.on('code', async (data) => {
    const room = data.room || "default-room";
    if (!room) return;

    await redisClient.set(room, data.content);
    socket.to(room).emit('code', data.content);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(` Server uğurla işləyir!`);
});
