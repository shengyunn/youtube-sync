const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let users = 0;

// 處理客戶端連接
io.on('connection', (socket) => {
    users++;
    io.emit('user count', users);

    console.log('有新的客戶端連接');

    // 接收用戶名
    socket.on('set username', (username) => {
        socket.username = username;
        io.emit('chat message', `${username} 加入了聊天室`);
    });

    // 接收客戶端發送的YouTube連結
    socket.on('youtube-link', (link) => {
        // 將YouTube連結廣播給所有客戶端
        io.emit('play-youtube', link);
    });

    // 接收聊天訊息
    socket.on('chat message', (msg) => {
        io.emit('chat message', `${socket.username}: ${msg}`);
    });

    // 客戶端斷開連接
    socket.on('disconnect', () => {
        users--;
        io.emit('user count', users);
        io.emit('chat message', `${socket.username} 離開了聊天室`);
    });
});

// 配置Express應用程序
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 配置靜態文件夾
app.use(express.static(__dirname));

// 啟動服務器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
