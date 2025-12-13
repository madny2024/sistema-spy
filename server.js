const express = require('express');
const cors = require('cors'); // <--- Importante para aceitar conexões externas
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

// --- CONFIGURAÇÕES DE SEGURANÇA E DADOS ---
app.use(cors()); // Libera o acesso para qualquer site (resolve o erro do GitHub/Celular)
app.use(express.json()); // Permite ler JSON vindo do App ou Site
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- ROTAS DAS PÁGINAS (FRONTEND) ---
app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps'));
app.get('/zap', (req, res) => res.render('zap'));

// --- ROTA DA API (ONDE O APP E O SITE MANDAM OS DADOS) ---
app.post('/api/gps', (req, res) => {
    const dados = req.body;
    
    // Log para você ver no terminal do Render
    console.log(`[HTTP POST] Recebido de: ${dados.device_id}`);
    console.log(`📍 Lat: ${dados.latitude} | Long: ${dados.longitude}`);

    // O GRANDE TRUQUE: Pegamos o dado que veio via HTTP e jogamos no Socket
    // Assim seu mapa atualiza em tempo real igual mágica
    io.emit('gps_update', {
        id: dados.device_id,
        lat: dados.latitude,
        lng: dados.longitude, // O mapa geralmente espera 'lng' ou 'longitude'
        longitude: dados.longitude,
        speed: dados.speed,
        battery: dados.battery,
        timestamp: dados.timestamp,
        provider: dados.provider
    });

    res.status(200).json({ status: "sucesso", msg: "Dados recebidos" });
});

// --- SOCKET.IO (PARA QUEM ESTÁ VENDO O MAPA) ---
io.on('connection', (socket) => {
    console.log('[SOCKET] Novo cliente conectado ao painel');

    // Mantém a compatibilidade caso algo antigo ainda use socket direto
    socket.on('report_location', (data) => {
        console.log(`[SOCKET DADOS] ID: ${data.id} | Lat: ${data.lat}`);
        io.emit('gps_update', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Rodando na porta ${PORT}`);
    console.log(`[SISTEMA] Rota de API pronta: /api/gps`);
});