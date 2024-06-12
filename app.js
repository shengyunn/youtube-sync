const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let users = {}; // 用戶對象，鍵是socket.id，值是用戶名

// 處理客戶端連接
io.on('connection', (socket) => {
    console.log('有新的客戶端連接');

    // 接收用戶名
    socket.on('set username', (username) => {
        users[socket.id] = username;
        io.emit('user list', Object.values(users));
        io.emit('chat message', `${username} 加入了聊天室`);
    });

    // 接收客戶端發送的YouTube連結
    socket.on('youtube-link', (link) => {
        io.emit('play-youtube', link);
    });

    // 接收聊天訊息
    socket.on('chat message', (msg) => {
        const username = users[socket.id];
        io.emit('chat message', `${username}: ${msg}`);
    });

    // 客戶端斷開連接
    socket.on('disconnect', () => {
        const username = users[socket.id];
        delete users[socket.id];
        io.emit('user list', Object.values(users));
        io.emit('chat message', `${username} 離開了聊天室`);
    });

    // 發送當前在線人數
    socket.emit('user count', Object.keys(users).length);
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
