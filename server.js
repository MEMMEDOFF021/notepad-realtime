const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// istənilən otaq üçün index.html göstər
app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('İstifadəçi qoşuldu');

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`İstifadəçi "${room}" otağına qoşuldu`);
  });

  socket.on('code', ({ room, content }) => {
    // eyni otaqdakı digər istifadəçilərə göndər
    socket.to(room).emit('code', content);
  });
});

http.listen(3000, () => {
  console.log('Server 3000 portunda işləyir');
});
