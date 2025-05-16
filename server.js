const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const Redis = require('ioredis');  // Redis client

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Render Key-Value instance URL-ni ENV-dən oxu (Render-də konfiqurasiya et)
// Məsələn: REDIS_URL=rediss://:password@host:port
const redis = new Redis(process.env.REDIS_URL);

// Statik fayllar üçün public qovluğunu göstər
app.use(express.static(path.join(__dirname, 'public')));

// Dinamik route-lar üçün index.html qaytar (room adı URL-dədirsə)
app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Yeni istifadəçi qoşuldu');

  // İstifadəçi otağa qoşulur
  socket.on('join', async (room) => {
    socket.join(room);
    console.log(`İstifadəçi ${room} otağına qoşuldu`);

    // Redis-dən həmin otağın yazısını oxu
    const savedContent = await redis.get(room);
    // Yeni qoşulan istifadəçiyə saxlanılan mətni göndər
    if (savedContent) {
      socket.emit('code', savedContent);
    }
  });

  // Kimsə otaqda kod yazanda
  socket.on('code', async (data) => {
    const { room, content } = data;

    // Yazını Redis-də yadda saxla
    await redis.set(room, content);

    // Otaqdakı digər istifadəçilərə göndər (özünə göndərmə)
    socket.to(room).emit('code', content);
  });

  socket.on('disconnect', () => {
    console.log('İstifadəçi ayrıldı');
  });
});

// Portu Render üçün ya da local üçün təyin et
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda işləyir`);
});
