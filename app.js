const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let users = {}; // 用戶對象，鍵是socket.id，值是{username, room}
let rooms = {}; // 房間對象，鍵是房間名，值是房間內的用戶數
let roomAdmins = {}; // 房間管理員對象，鍵是房間名，值是管理員的socket.id

// 處理客戶端連接
io.on('connection', (socket) => {
    console.log('有新的客戶端連接');

    // 接收用戶名
    socket.on('set username', (username) => {
        users[socket.id] = { username, room: '' };
    });

    // 創建房間
    socket.on('create room', (room) => {
        if (rooms[room]) {
            socket.emit('room exists', room);
        } else {
            rooms[room] = 0;
            roomAdmins[room] = socket.id; // 設置創建者為管理員
            joinRoom(socket, room);
            socket.emit('room created', room);
        }
    });

    // 加入房間
    socket.on('join room', (room) => {
        if (rooms[room]) {
            joinRoom(socket, room);
            socket.emit('joined room', room);
        } else {
            socket.emit('room not found', room);
        }
    });

    // 接收客戶端發送的YouTube連結
    socket.on('youtube-link', ({ link, room }) => {
        if (roomAdmins[room] === socket.id) {
            io.to(room).emit('play-youtube', { link, room });
        } else {
            socket.emit('not authorized');
        }
    });

    // 接收播放和暫停請求
    socket.on('control video', ({ action, room }) => {
        if (roomAdmins[room] === socket.id) {
            io.to(room).emit('control video', { action, room });
        } else {
            socket.emit('not authorized');
        }
    });

    // 接收表情符號請求
    socket.on('send emoji', ({ emoji, room }) => {
        io.to(room).emit('display emoji', { emoji });
    });

    // 接收聊天訊息
    socket.on('chat message', ({ msg, room }) => {
        const username = users[socket.id] ? users[socket.id].username : '匿名';
        io.to(room).emit('chat message', { msg: `${username}: ${msg}`, room });
    });

    // 客戶端斷開連接
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const { username, room } = user;
            leaveRoom(socket, room);
            delete users[socket.id];
            io.to(room).emit('user list', { users: getUsersInRoom(room), room });
            io.to(room).emit('chat message', { msg: `${username} 離開了房間`, room });
            io.to(room).emit('user count', { count: getUsersInRoom(room).length, room });
        }
    });
});

function joinRoom(socket, room) {
    if (users[socket.id]) {
        const previousRoom = users[socket.id].room;
        if (previousRoom) {
            leaveRoom(socket, previousRoom);
        }
        socket.join(room);
        users[socket.id].room = room;
        rooms[room] = (rooms[room] || 0) + 1;
        io.to(room).emit('user list', { users: getUsersInRoom(room), room });
        io.to(room).emit('chat message', { msg: `${users[socket.id].username} 加入了房間`, room });
        io.to(room).emit('user count', { count: rooms[room], room });
    }
}

function leaveRoom(socket, room) {
    if (users[socket.id] && rooms[room]) {
        socket.leave(room);
        rooms[room]--;
        if (rooms[room] === 0) {
            delete rooms[room];
            delete roomAdmins[room]; // 刪除管理員信息
        } else {
            io.to(room).emit('user count', { count: rooms[room], room });
        }
    }
}

function getUsersInRoom(room) {
    return Object.values(users).filter(user => user.room === room).map(user => user.username);
}

// 配置Express應用程序
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 配置靜態文件夾
app.use(express.static(__dirname));

// 啟動服務器
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
