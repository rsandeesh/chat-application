const WebSocket = require('ws');

const wss = new WebSocket.WebSocketServer({port: 8080});

let clients = [];
let admin;

function handleIncomingMessage(parse, sender) {

    if (typeof parse.message === 'string') {
        const messageParts = parse.message.split(':');

        if (sender === admin) {
            if (messageParts.length >= 2) {
                const clientId = messageParts.shift();
                const msg = messageParts.join(':');
                const client = Array.from(clients).find(client => client.id === clientId);
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(`Admin: ${msg}`);
                    admin.send(`You: ${msg}`);
                }
            }
        } else {
            if (admin && admin.readyState === WebSocket.OPEN) {
                const clientId = messageParts.shift();
                const msg = messageParts.join(':');
                const client = Array.from(clients).find(client => client.id === sender.id);
                admin.send(`Minion Client Id ${sender.id}: ${msg}`);
                client.send(`You: ${msg}`);
            }
        }
    }


}

wss.on('connection', ws => {
    // Assign an ID to the client
    ws.id =(clients.length + 1).toString();
    clients.push(ws);

    console.log(clients);

    // Handle incoming messages from the client
    ws.on('message', message => {
        let parse = JSON.parse(message);
        console.log(parse);
        console.log(parse.type === 'request')
        if (parse.type === 'request') {
            handleIncomingMessage(parse, ws);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        clients = clients.filter(value => value !== ws);
    });

    // If admin is not set, assign the current client as admin
    if (!admin) {
        admin = ws;
        admin.send(`Master Client Id :  ${ws.id}`);
    }else{
        ws.send(`Minion Client Id : ${ws.id}`);
    }
});

console.log('Chat server started on port 8080');
