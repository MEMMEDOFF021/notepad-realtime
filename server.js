const fs = require('fs');
let content = '';

// Sayt açıldıqda mövcud məlumatı oxu
fs.readFile('notepad.txt', 'utf8', (err, data) => {
    if (!err) content = data;
});

io.on('connection', (socket) => {
    // Yeni qoşulan istifadəçiyə mövcud mətni göndər
    socket.emit('loadContent', content);

    socket.on('textChange', (newText) => {
        content = newText;

        // Bütün istifadəçilərə yeniləməni göndər
        socket.broadcast.emit('textChange', newText);

        // Yaddaşa yaz
        fs.writeFile('notepad.txt', content, (err) => {
            if (err) console.log("Yazmaqda xəta:", err);
        });
    });
});
