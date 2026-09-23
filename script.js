const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const loginScreen = document.getElementById('login-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const gameContainer = document.getElementById('game-container');

// CONEXÃO WEBSOCKET (Mudar após deploy no Render)
const ws = new WebSocket('ws://localhost:8080');

let drawing = false;
let myUsername = "";

ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.strokeStyle = '#000000';

joinBtn.addEventListener('click', joinGame);
usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinGame(); });

function joinGame() {
    const name = usernameInput.value.trim();
    if (!name) return alert("Digite um nome!");
    myUsername = name;
    loginScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    ws.send(JSON.stringify({ type: 'join', username: myUsername }));
}

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', draw);

function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    ws.send(JSON.stringify({ type: 'draw', x, y }));
}

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ type: 'clear' }));
});

chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage(myUsername, text, 'me');
    ws.send(JSON.stringify({ type: 'chat', username: myUsername, text }));
    chatInput.value = '';
}

function appendMessage(sender, text, styleType) {
    const msgEl = document.createElement('div');
    if (styleType === 'system') {
        msgEl.className = 'msg-system';
        msgEl.textContent = text;
    } else {
        msgEl.className = `msg-user msg-${styleType}`;
        msgEl.innerHTML = `<span class="username">${sender}:</span> ${text}`;
    }
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch(data.type) {
        case 'join': appendMessage(null, `📢 ${data.username} entrou!`, 'system'); break;
        case 'chat': appendMessage(data.username, data.text, 'other'); break;
        case 'draw':
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);
            break;
        case 'clear': ctx.clearRect(0, 0, canvas.width, canvas.height); break;
        case 'leave': appendMessage(null, `❌ Alguém saiu da sala.`, 'system'); break;
    }
};

ws.onclose = () => { appendMessage(null, '🔴 Desconectado do servidor.', 'system'); };
