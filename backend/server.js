const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

let clients = [];

server.on('connection', (ws) => {
    clients.push(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (e) {
            console.error("Erro ao processar mensagem", e);
        }
    });

    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'leave' }));
            }
        });
    });
});
