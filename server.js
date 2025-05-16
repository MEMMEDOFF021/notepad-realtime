const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Redis = require('ioredis');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(cors());

// Redis bağlantısı
const redis = new Redis(process.env.REDIS_URL); // Render Redis URL

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  const room = socket.handshake.headers.referer.split('/').pop();

  socket.join(room);

  // Redis-dən mövcud məlumatı al
  redis.get(room, (err, content) => {
    if (!err && content) {
      socket.emit('code', content);
    }
  });

  socket.on('code', ({ room, content }) => {
    socket.to(room).emit('code', content);

    // Redis-ə yadda yaz
    redis.set(room, content);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`${PORT} portunda server işləyir`);
});
