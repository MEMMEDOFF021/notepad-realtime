const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Təhlükəsizlik üçün sonra spesifik domainləri qeyd edin
    methods: ["GET", "POST"]
  }
});

// Redis bağlantısı
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Redis error handling
redisClient.on('error', (err) => console.error('Redis error:', err));

// Redis bağlantısını başlat
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis-ə bağlantı uğurlu oldu!');
  } catch (err) {
    console.error('Redis bağlantı xətası:', err);
    process.exit(1); // Əgər Redis olmadan işləməyəcəksə
  }
})();

// Static fayllar
app.use(express.static(path.join(__dirname, 'public')));

// Əsas route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io real-time əlaqə
io.on('connection', (socket) => {
  console.log('Yeni istifadəçi qoşuldu:', socket.id);

  socket.on('join', async (room) => {
    socket.join(room);
    console.log(`İstifadəçi ${socket.id} "${room}" otağına qoşuldu`);

    // Redis-dən mövcud məzmunu gətir
    try {
      const existingContent = await redisClient.get(room);
      if (existingContent) {
        socket.emit('code', existingContent);
      }
    } catch (err) {
      console.error('Redis-dən oxuma xətası:', err);
    }

    // Kod dəyişikliklərini emal et
    socket.on('code', async (data) => {
      try {
        await redisClient.set(data.room, data.content);
        socket.to(data.room).emit('code', data.content);
      } catch (err) {
        console.error('Redis-ə yazma xətası:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('İstifadəçi ayrıldı:', socket.id);
    });
  });
});

// Serveri işə sal
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server http://localhost:${PORT} ünvanında işləyir`);
});
