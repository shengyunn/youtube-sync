const socket = io();
let player;
let roomName;

document.addEventListener('DOMContentLoaded', () => {
    // 當頁面加載完成時顯示用戶名彈出窗口
    document.getElementById('usernameModal').style.display = 'block';
});

// 監聽在線用戶數量的更新
socket.on('update online users', count => {
    document.getElementById('userCount').textContent = `在線人數: ${count}`;
});
// 設置用戶名
function setUsername() {
    const username = document.getElementById('usernameInput').value;
    if (username) {
        socket.emit('set username', username);
        document.getElementById('usernameDisplay').textContent = `用戶名: ${username}`;
        document.getElementById('usernameModal').style.display = 'none';
        document.getElementById('roomSelection').style.display = 'block';
    } else {
        alert('請輸入一個有效的用戶名');
    }
}

// 創建房間
function createRoom() {
    roomName = document.getElementById('roomInput').value;
    if (roomName) {
        const username = document.getElementById('usernameInput').value;
        socket.emit('create room', roomName, username);
    } else {
        alert('請輸入房間名稱');
    }
}

// 加入房間
function joinRoom() {
    roomName = document.getElementById('roomInput').value;
    if (roomName) {
        const username = document.getElementById('usernameInput').value;
        socket.emit('join room', roomName, username);
    } else {
        alert('請輸入房間名稱');
    }
}

// 當加入房間成功時，顯示相應的區域
socket.on('room joined', () => {
    document.getElementById('roomSelection').style.display = 'none';
    document.getElementById('youtubeSection').style.display = 'block';
    document.getElementById('chatContainer').style.display = 'block';
    document.getElementById('emojiContainer').style.display = 'block';
});

// 更新在線人數
socket.on('update user count', count => {
    document.getElementById('userCount').textContent = `在線人數: ${count}`;
});

// 接收新訊息
socket.on('new message', message => {
    const messages = document.getElementById('messages');
    const li = document.createElement('li');
    li.textContent = message;
    messages.appendChild(li);
});

// 發送訊息
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value;
    if (message) {
        socket.emit('send message', message);
        input.value = '';
    }
}

// 發送YouTube鏈接
function sendLink() {
    const link = document.getElementById('youtubeLink').value;
    if (link) {
        socket.emit('send link', link);
    }
}

// 播放視頻
socket.on('play video', link => {
    if (player) {
        player.loadVideoByUrl(link);
    } else {
        player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: link,
            events: {
                'onReady': event => event.target.playVideo()
            }
        });
    }
});

// 顯示全屏表情符號
function showEmoji(emoji) {
    const fullScreenEmoji = document.getElementById('fullScreenEmoji');
    fullScreenEmoji.textContent = emoji;
    fullScreenEmoji.style.display = 'flex';
    setTimeout(() => {
        fullScreenEmoji.style.display = 'none';
    }, 1000);
}
