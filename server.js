const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => res.render('home'));
app.get('/gps', (req, res) => res.render('gps'));
app.get('/zap', (req, res) => res.render('zap'));

io.on('connection', (socket) => {
    // Ouve qualquer reporte de localização e espalha para todos
    socket.on('report_location', (data) => {
        console.log(`[DADOS RECEBIDOS] ID: ${data.id} | Lat: ${data.lat}`);
        io.emit('gps_update', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`[SISTEMA] Rodando na porta ${PORT}`);
});