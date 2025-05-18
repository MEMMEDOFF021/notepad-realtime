const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Redis bağlantısı (Render Key-Value xidmətindən URL al)
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

app.use(express.static('public'));

// Əsas route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io ilə real-time bağlantı
io.on('connection', (socket) => {
  console.log('Yeni istifadəçi qoşuldu');

  socket.on('join', async (room) => {
    socket.join(room);
    console.log(`İstifadəçi ${room} otağına qoşuldu`);

    // Redis-dən mövcud mətn gətir
    try {
      const existingContent = await redisClient.get(room);
      if (existingContent) {
        socket.emit('code', existingContent);
      }
    } catch (err) {
      console.error('Redis-dən oxunma xətası:', err);
    }

    socket.on('code', async (data) => {
      // Verilən mətni Redis-ə yadda saxla
      try {
        await redisClient.set(data.room, data.content);
        socket.to(data.room).emit('code', data.content); // digər istifadəçilərə göndər
      } catch (err) {
        console.error('Redis-ə yazma xətası:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('İstifadəçi ayrıldı');
    });
  });
});

// Port (Render avtomatik təyin edir)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server işə düşdü: http://localhost:${PORT}`);
});
