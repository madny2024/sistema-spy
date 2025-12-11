const socket = io();

// Configuração do Mapa
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Marcador do alvo
let targetMarker = L.marker([0, 0]).addTo(map);
let firstFix = true;

// Recebendo dados simulados do Servidor (futuramente do React Native)
socket.on('device_update', (data) => {
    // Atualiza Textos
    document.getElementById('device-id').innerText = data.deviceId;
    document.getElementById('connection-status').innerText = data.status;
    document.getElementById('connection-status').style.color = "#00ff41"; // Verde
    
    document.getElementById('battery-level').innerText = data.battery + '%';
    document.getElementById('lat').innerText = data.location.lat.toFixed(6);
    document.getElementById('lng').innerText = data.location.lng.toFixed(6);
    document.getElementById('last-ping').innerText = data.timestamp;

    // Adiciona Log no terminal
    const logList = document.getElementById('log-list');
    const newLog = document.createElement('li');
    newLog.innerText = `[${data.timestamp}] DATA_PACKET: ${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)} | BAT: ${data.battery}%`;
    logList.insertBefore(newLog, logList.firstChild);

    // Limita logs para não travar
    if(logList.children.length > 20) logList.removeChild(logList.lastChild);

    // Atualiza Mapa
    const newLatLng = [data.location.lat, data.location.lng];
    targetMarker.setLatLng(newLatLng);
    
    if(firstFix) {
        map.setView(newLatLng, 15); // Zoom no alvo na primeira vez
        firstFix = false;
    } else {
        map.panTo(newLatLng); // Apenas move a câmera
    }
});