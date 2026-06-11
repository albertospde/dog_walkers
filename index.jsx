<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>🐾 DogWalk</title>

<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<!-- Leaflet JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<!-- Leaflet.heat plugin -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js"></script>

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #f0f4f8; }

  :root {
    --primary: #2d6a4f;
    --accent: #f4a261;
    --danger: #e63946;
    --quiet: #2d6a4f;
    --moderate: #f4a261;
    --busy: #e63946;
    --muted: #6b7280;
    --text: #1a1a2e;
    --card: #ffffff;
  }

  #app { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #f0f4f8; position: relative; }

  /* HEADER */
  .header { background: var(--primary); padding: 14px 16px 10px; color: #fff; }
  .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .app-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .app-sub { font-size: 11px; opacity: 0.8; margin-top: 2px; }
  .sos-btn {
    background: var(--danger); color: #fff; border: none; border-radius: 20px;
    padding: 7px 14px; font-weight: 700; font-size: 13px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(230,57,70,0.45);
  }
  .gps-bar {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 10px;
  }
  .gps-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffb74d; transition: all 0.3s; }
  .gps-dot.active { background: #69f0ae; box-shadow: 0 0 8px #69f0ae; }
  .gps-label { font-size: 12px; flex: 1; }
  .gps-toggle {
    border: none; border-radius: 6px; padding: 3px 10px;
    font-size: 11px; font-weight: 700; cursor: pointer; color: #fff;
    background: var(--accent);
  }
  .gps-toggle.off { background: rgba(255,255,255,0.2); }

  /* BANNER */
  .status-banner {
    padding: 7px 16px; font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 6px; color: #fff;
    transition: background 0.3s;
  }

  /* SLIDER */
  .sim-bar {
    background: #fff; padding: 8px 16px; border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center; gap: 10px;
  }
  .sim-label { font-size: 11px; color: var(--muted); white-space: nowrap; }
  .sim-bar input[type=range] { flex: 1; accent-color: var(--primary); }
  .sim-hour { font-size: 12px; font-weight: 700; color: var(--primary); min-width: 36px; text-align: right; }

  /* TABS */
  .tabs { display: flex; background: #fff; border-bottom: 1px solid #e5e7eb; }
  .tab-btn {
    flex: 1; padding: 10px 4px; background: none; border: none;
    border-bottom: 2px solid transparent; color: var(--muted);
    font-size: 12px; cursor: pointer; transition: all 0.15s; font-weight: 400;
  }
  .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 700; }

  /* TAB CONTENT */
  .tab-content { display: none; padding-top: 12px; }
  .tab-content.visible { display: block; }

  /* MAP */
  #leaflet-map { height: 260px; border-radius: 12px; margin: 0 16px 12px; border: 1.5px solid #a8d5b5; z-index: 1; }
  .map-overlay-badge {
    position: absolute; top: 22px; right: 26px; z-index: 1000;
    background: var(--primary); color: #fff; border-radius: 20px;
    padding: 4px 10px; font-size: 12px; font-weight: 700;
    pointer-events: none;
  }
  .map-wrap { position: relative; }

  /* NEARBY LIST */
  .section-title { padding: 0 16px; font-size: 13px; font-weight: 600; color: var(--muted); margin-bottom: 8px; }
  .nearby-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; background: #fff; border-bottom: 1px solid #f0f0f0;
  }
  .nearby-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: #2d6a4f22; display: flex; align-items: center;
    justify-content: center; font-size: 20px; flex-shrink: 0;
  }
  .nearby-name { font-weight: 600; font-size: 14px; }
  .nearby-sub { font-size: 12px; color: var(--muted); }
  .nearby-dot { width: 8px; height: 8px; border-radius: 50%; }

  /* HEATMAP PANEL */
  .heatmap-panel { padding: 0 16px 16px; }
  .status-card {
    border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
    display: flex; justify-content: space-between; align-items: center;
    border: 1.5px solid;
  }
  .status-label { font-size: 13px; color: var(--muted); margin-bottom: 2px; }
  .status-level { font-size: 20px; font-weight: 700; }
  .status-count { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .suggestion-box {
    background: #e8f5e9; border: 1.5px solid var(--quiet); border-radius: 10px;
    padding: 10px 14px; margin-bottom: 16px; font-size: 13px;
    color: var(--quiet); font-weight: 600;
  }
  .chart-label { font-size: 13px; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
  .chart-wrap {
    display: flex; align-items: flex-end; gap: 3px;
    height: 120px; padding-top: 28px; overflow-x: auto; padding-bottom: 4px;
  }
  .bar-col { display: flex; flex-direction: column; align-items: center; gap: 2px; position: relative; flex-shrink: 0; }
  .bar-now-label {
    position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
    font-size: 9px; font-weight: 700; color: var(--text); white-space: nowrap;
    background: #fff; padding: 1px 4px; border-radius: 4px; border: 1px solid var(--text);
  }
  .bar { border-radius: 3px 3px 0 0; transition: height 0.3s; }
  .chart-hours {
    display: flex; justify-content: space-between; font-size: 10px;
    color: var(--muted); margin-top: 4px;
  }
  .legend { display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 4px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
  .legend-txt { font-size: 11px; color: var(--muted); }

  /* PROFILE */
  .profile-wrap { padding: 16px; }
  .profile-card {
    background: #fff; border-radius: 12px; padding: 20px;
    margin-bottom: 12px; border: 1px solid #e5e7eb; text-align: center;
  }
  .profile-emoji { font-size: 52px; margin-bottom: 8px; }
  .profile-name { font-weight: 700; font-size: 18px; }
  .profile-dog { color: var(--muted); font-size: 13px; margin-bottom: 12px; }
  .stats-row { display: flex; justify-content: center; gap: 20px; }
  .stat-item { text-align: center; }
  .stat-val { font-weight: 700; font-size: 20px; color: var(--primary); }
  .stat-lbl { font-size: 11px; color: var(--muted); }
  .security-card {
    background: #fff; border-radius: 12px; padding: 16px;
    border: 1px solid #e5e7eb; margin-bottom: 12px;
  }
  .security-title { font-weight: 600; margin-bottom: 10px; font-size: 14px; }
  .security-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px;
  }
  .security-row:last-child { border-bottom: none; }
  .security-lbl { color: var(--muted); }
  .security-val { font-weight: 600; }
  .sos-big {
    width: 100%; background: var(--danger); color: #fff; border: none;
    border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 700;
    cursor: pointer; box-shadow: 0 2px 10px rgba(230,57,70,0.3);
  }

  /* SOS MODAL */
  .modal-overlay {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    align-items: center; justify-content: center; z-index: 9999; padding: 20px;
  }
  .modal-overlay.open { display: flex; }
  .modal-box {
    background: #fff; border-radius: 16px; padding: 24px;
    max-width: 320px; width: 100%; text-align: center;
  }
  .modal-icon { font-size: 48px; margin-bottom: 8px; }
  .modal-title { font-weight: 700; font-size: 18px; margin-bottom: 8px; }
  .modal-text { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
  .modal-btns { display: flex; gap: 10px; }
  .modal-cancel {
    flex: 1; padding: 12px; background: #f0f0f0; border: none;
    border-radius: 10px; font-size: 14px; cursor: pointer; font-weight: 600;
  }
  .modal-confirm {
    flex: 1; padding: 12px; background: var(--danger); color: #fff;
    border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
  }
</style>
</head>
<body>
<div id="app">

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="app-title">🐾 DogWalk</div>
        <div class="app-sub">Passeggia con sicurezza</div>
      </div>
      <button class="sos-btn" onclick="openSOS()">🆘 SOS</button>
    </div>
    <div class="gps-bar">
      <div class="gps-dot" id="gpsDot"></div>
      <span class="gps-label" id="gpsLabel">GPS spento — non visibile agli altri</span>
      <button class="gps-toggle" id="gpsToggle" onclick="toggleGPS()">Attiva</button>
    </div>
  </div>

  <!-- BANNER STATUS -->
  <div class="status-banner" id="statusBanner">⏳ Caricamento...</div>

  <!-- SLIDER ORA -->
  <div class="sim-bar">
    <span class="sim-label">Simula ora:</span>
    <input type="range" min="0" max="23" id="hourSlider" oninput="onHourChange(this.value)">
    <span class="sim-hour" id="hourDisplay">00:00</span>
  </div>

  <!-- TABS -->
  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('map', this)">🗺 Mappa</button>
    <button class="tab-btn" onclick="switchTab('heatmap', this)">📊 Orari</button>
    <button class="tab-btn" onclick="switchTab('profile', this)">👤 Profilo</button>
  </div>

  <!-- TAB: MAPPA -->
  <div class="tab-content visible" id="tab-map">
    <div class="map-wrap">
      <div id="leaflet-map"></div>
      <div class="map-overlay-badge" id="nearbyBadge">3 vicino a te</div>
    </div>
    <div class="section-title">Nelle vicinanze (3)</div>
    <div class="nearby-item">
      <div class="nearby-avatar">🐶</div>
      <div style="flex:1"><div class="nearby-name">Giulia</div><div class="nearby-sub">con Rocky · 120m</div></div>
      <div class="nearby-dot" style="background:var(--quiet)"></div>
    </div>
    <div class="nearby-item">
      <div class="nearby-avatar">🐶</div>
      <div style="flex:1"><div class="nearby-name">Marco</div><div class="nearby-sub">con Bella · 280m</div></div>
      <div class="nearby-dot" style="background:var(--quiet)"></div>
    </div>
    <div class="nearby-item">
      <div class="nearby-avatar">🐶</div>
      <div style="flex:1"><div class="nearby-name">Sara</div><div class="nearby-sub">con Toby · 450m</div></div>
      <div class="nearby-dot" style="background:var(--moderate)"></div>
    </div>
  </div>

  <!-- TAB: HEATMAP -->
  <div class="tab-content" id="tab-heatmap">
    <div class="heatmap-panel">
      <div class="status-card" id="statusCard">
        <div>
          <div class="status-label" id="statusTimeLabel">Ora (00:00)</div>
          <div class="status-level" id="statusLevelText">—</div>
          <div class="status-count" id="statusCount">—</div>
        </div>
        <div style="font-size:36px" id="statusIcon">⏳</div>
      </div>
      <div class="suggestion-box" id="suggestionBox" style="display:none"></div>
      <div class="chart-label">Affollamento 24h — media settimanale</div>
      <div class="chart-wrap" id="chartWrap"></div>
      <div class="chart-hours">
        <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:var(--quiet)"></div><span class="legend-txt">Tranquillo</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--moderate)"></div><span class="legend-txt">Moderato</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--busy)"></div><span class="legend-txt">Affollato</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:#c8d6e5"></div><span class="legend-txt">Notte</span></div>
      </div>
    </div>
  </div>

  <!-- TAB: PROFILO -->
  <div class="tab-content" id="tab-profile">
    <div class="profile-wrap">
      <div class="profile-card">
        <div class="profile-emoji">🐕‍🦺</div>
        <div class="profile-name">Mario Rossi</div>
        <div class="profile-dog">con Artù · Labrador · 3 anni</div>
        <div class="stats-row">
          <div class="stat-item"><div class="stat-val">18</div><div class="stat-lbl">passeggiate</div></div>
          <div class="stat-item"><div class="stat-val">4.5</div><div class="stat-lbl">settimana</div></div>
          <div class="stat-item"><div class="stat-val">18h</div><div class="stat-lbl">orario preferito</div></div>
        </div>
      </div>
      <div class="security-card">
        <div class="security-title">🔒 Sicurezza</div>
        <div class="security-row"><span class="security-lbl">👨‍👩‍👧 Contatti SOS</span><span class="security-val">2 salvati</span></div>
        <div class="security-row"><span class="security-lbl">📍 Condivisione posizione</span><span class="security-val">Solo amici</span></div>
        <div class="security-row"><span class="security-lbl">⏱ Timer rientro</span><span class="security-val">Attivo — 45 min</span></div>
      </div>
      <button class="sos-big" onclick="openSOS()">🆘 Invia SOS ora</button>
    </div>
  </div>

</div><!-- /app -->

<!-- SOS MODAL -->
<div class="modal-overlay" id="sosModal">
  <div class="modal-box">
    <div class="modal-icon">🆘</div>
    <div class="modal-title">Invia SOS?</div>
    <div class="modal-text">La tua posizione GPS verrà inviata ai tuoi contatti di fiducia immediatamente.</div>
    <div class="modal-btns">
      <button class="modal-cancel" onclick="closeSOS()">Annulla</button>
      <button class="modal-confirm" onclick="confirmSOS()">Invia SOS</button>
    </div>
  </div>
</div>

<script>
// ─── DATI ────────────────────────────────────────────────────────────────────
const mockHeatmap = {
  0:1,1:0,2:0,3:0,4:1,5:3,6:12,7:28,8:35,9:22,10:18,11:15,
  12:10,13:8,14:9,15:14,16:20,17:38,18:45,19:42,20:30,21:18,22:8,23:3
};
const maxVal = Math.max(...Object.values(mockHeatmap));

// Posizioni mock vicini (relative a centro mappa)
const nearbyUsers = [
  { lat: 0.0012, lng: 0.0018, name: "Giulia + Rocky" },
  { lat: -0.0008, lng: 0.0025, name: "Marco + Bella" },
  { lat: 0.0020, lng: -0.0010, name: "Sara + Toby" },
];

// Punti heatmap mock (simulano storico anonimizzato)
// Formato Leaflet.heat: [lat, lng, intensity]
let heatPoints = [];

// ─── STATO ───────────────────────────────────────────────────────────────────
let map = null;
let heatLayer = null;
let userMarker = null;
let nearbyMarkers = [];
let gpsActive = false;
let watchId = null;
let userPos = null;
let simHour = new Date().getHours();

// ─── INIT ────────────────────────────────────────────────────────────────────
window.onload = () => {
  document.getElementById('hourSlider').value = simHour;
  updateHourDisplay(simHour);
  buildChart();
  updateHeatmapPanel(simHour);
  updateBanner(simHour);
  initMap();
};

// ─── MAPPA ───────────────────────────────────────────────────────────────────
function initMap() {
  // Centro default: Roma (verrà aggiornato con GPS reale)
  const defaultCenter = [41.9028, 12.4964];

  map = L.map('leaflet-map', {
    zoomControl: true,
    attributionControl: true,
  }).setView(defaultCenter, 16);

  // Tile OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  // Genera punti heatmap attorno al centro
  heatPoints = generateHeatPoints(defaultCenter[0], defaultCenter[1], simHour);

  // Layer heatmap
  heatLayer = L.heatLayer(heatPoints, {
    radius: 28,
    blur: 20,
    maxZoom: 17,
    gradient: { 0.2: '#2d6a4f', 0.5: '#f4a261', 0.8: '#e63946' },
  }).addTo(map);

  // Icona utente
  const youIcon = L.divIcon({
    html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div>',
    iconSize: [32, 32], iconAnchor: [16, 28], className: '',
  });
  userMarker = L.marker(defaultCenter, { icon: youIcon })
    .addTo(map)
    .bindPopup('<b>Tu sei qui</b>');

  // Markers vicini
  const dogIcon = L.divIcon({
    html: '<div style="font-size:22px">🐕</div>',
    iconSize: [28, 28], iconAnchor: [14, 22], className: '',
  });
  nearbyUsers.forEach(u => {
    const marker = L.marker(
      [defaultCenter[0] + u.lat, defaultCenter[1] + u.lng],
      { icon: dogIcon }
    ).addTo(map).bindPopup(`<b>${u.name}</b>`);
    nearbyMarkers.push(marker);
  });
}

// Genera punti heatmap simulati attorno a un centro, modulati per ora
function generateHeatPoints(lat, lng, hour) {
  const intensity = mockHeatmap[hour] / maxVal;
  const points = [];
  const count = Math.round(intensity * 80) + 5;
  for (let i = 0; i < count; i++) {
    const dlat = (Math.random() - 0.5) * 0.012;
    const dlng = (Math.random() - 0.5) * 0.015;
    const w = Math.random() * intensity;
    points.push([lat + dlat, lng + dlng, w]);
  }
  return points;
}

// Aggiorna heatmap in base all'ora simulata
function updateHeatLayer(center, hour) {
  if (!heatLayer || !map) return;
  const pts = generateHeatPoints(center[0], center[1], hour);
  heatLayer.setLatLngs(pts);
}

// ─── GPS ──────────────────────────────────────────────────────────────────────
function toggleGPS() {
  if (gpsActive) {
    stopGPS();
  } else {
    startGPS();
  }
}

function startGPS() {
  if (!navigator.geolocation) {
    alert("GPS non supportato dal browser");
    return;
  }
  watchId = navigator.geolocation.watchPosition(
    pos => {
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      onGPSUpdate(userPos);
    },
    err => {
      document.getElementById('gpsLabel').textContent = '⚠ ' + err.message;
    },
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
  gpsActive = true;
  document.getElementById('gpsDot').classList.add('active');
  document.getElementById('gpsLabel').textContent = 'GPS attivo — rilevamento...';
  document.getElementById('gpsToggle').textContent = 'Disattiva';
  document.getElementById('gpsToggle').classList.add('off');
}

function stopGPS() {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  gpsActive = false;
  userPos = null;
  document.getElementById('gpsDot').classList.remove('active');
  document.getElementById('gpsLabel').textContent = 'GPS spento — non visibile agli altri';
  document.getElementById('gpsToggle').textContent = 'Attiva';
  document.getElementById('gpsToggle').classList.remove('off');
}

function onGPSUpdate(pos) {
  document.getElementById('gpsLabel').textContent = `GPS attivo — posizione condivisa`;
  if (!map) return;
  const latlng = [pos.lat, pos.lng];
  map.setView(latlng, 16);
  userMarker.setLatLng(latlng);
  // Sposta vicini relativamente alla posizione reale
  nearbyUsers.forEach((u, i) => {
    nearbyMarkers[i].setLatLng([pos.lat + u.lat, pos.lng + u.lng]);
  });
  updateHeatLayer(latlng, simHour);
}

// ─── SLIDER ORA ───────────────────────────────────────────────────────────────
function onHourChange(val) {
  simHour = parseInt(val);
  updateHourDisplay(simHour);
  updateHeatmapPanel(simHour);
  updateBanner(simHour);
  // Aggiorna heatmap sulla mappa
  const center = userPos
    ? [userPos.lat, userPos.lng]
    : map ? [map.getCenter().lat, map.getCenter().lng] : [41.9028, 12.4964];
  updateHeatLayer(center, simHour);
}

function updateHourDisplay(h) {
  document.getElementById('hourDisplay').textContent = String(h).padStart(2,'0') + ':00';
}

// ─── BANNER ───────────────────────────────────────────────────────────────────
function getLevel(h) {
  const pct = mockHeatmap[h] / maxVal;
  if (pct > 0.65) return { label: 'Molto affollato', color: '#e63946', emoji: '🔴' };
  if (pct > 0.35) return { label: 'Moderato', color: '#f4a261', emoji: '🟡' };
  return { label: 'Tranquillo', color: '#2d6a4f', emoji: '🟢' };
}

function updateBanner(h) {
  const lv = getLevel(h);
  const banner = document.getElementById('statusBanner');
  banner.style.background = lv.color;
  const msgs = {
    'Tranquillo': 'Ottimo momento per uscire!',
    'Moderato': 'Zona moderatamente frequentata',
    'Molto affollato': 'Zona molto affollata — valuta di aspettare',
  };
  banner.textContent = lv.emoji + ' ' + msgs[lv.label];
}

// ─── HEATMAP PANEL ────────────────────────────────────────────────────────────
function updateHeatmapPanel(h) {
  const lv = getLevel(h);
  const card = document.getElementById('statusCard');
  card.style.background = lv.color + '18';
  card.style.borderColor = lv.color;
  document.getElementById('statusTimeLabel').textContent = `Ora simulata (${String(h).padStart(2,'0')}:00)`;
  document.getElementById('statusLevelText').textContent = lv.emoji + ' ' + lv.label;
  document.getElementById('statusLevelText').style.color = lv.color;
  document.getElementById('statusCount').textContent = `~${mockHeatmap[h]} passeggiate attive nella zona`;
  document.getElementById('statusIcon').textContent = lv.label === 'Tranquillo' ? '🐾' : '⏳';

  // Suggerimento
  const candidates = Array.from({length:24},(_,i)=>i).filter(i => {
    const pct = mockHeatmap[i] / maxVal;
    return pct <= 0.35 && Math.abs(i - h) <= 4 && i !== h;
  });
  const best = candidates.length
    ? candidates.reduce((a,b) => Math.abs(a-h) < Math.abs(b-h) ? a : b)
    : null;
  const sb = document.getElementById('suggestionBox');
  if (best !== null && lv.label !== 'Tranquillo') {
    sb.style.display = 'block';
    sb.textContent = `💡 Momento migliore vicino: ${String(best).padStart(2,'0')}:00 — più tranquillo`;
  } else {
    sb.style.display = 'none';
  }

  // Aggiorna highlight barra corrente
  document.querySelectorAll('.bar-col').forEach(col => {
    const barH = parseInt(col.dataset.hour);
    const bar = col.querySelector('.bar');
    bar.style.border = barH === h ? `2px solid #1a1a2e` : 'none';
    bar.style.width = barH === h ? '16px' : '12px';
    const nowLbl = col.querySelector('.bar-now-label');
    if (nowLbl) nowLbl.style.display = barH === h ? 'block' : 'none';
  });
}

function buildChart() {
  const wrap = document.getElementById('chartWrap');
  wrap.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    const val = mockHeatmap[h];
    const pct = val / maxVal;
    const lv = getLevel(h);
    const isNight = h < 6 || h >= 22;
    const isCurrent = h === simHour;
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.dataset.hour = h;
    col.title = `${String(h).padStart(2,'0')}:00 — ${val} passeggiate`;
    col.innerHTML = `
      <div class="bar-now-label" style="display:${isCurrent?'block':'none'}">ora</div>
      <div class="bar" style="
        width:${isCurrent?16:12}px;
        height:${Math.max(4, pct*80)}px;
        background:${isNight?'#c8d6e5':lv.color};
        opacity:${isCurrent?1:0.72};
        border:${isCurrent?'2px solid #1a1a2e':'none'};
      "></div>
    `;
    wrap.appendChild(col);
  }
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('visible'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('visible');
  btn.classList.add('active');
  // Invalidate mappa dopo toggle (Leaflet richiede refresh)
  if (id === 'map' && map) setTimeout(() => map.invalidateSize(), 50);
}

// ─── SOS ──────────────────────────────────────────────────────────────────────
function openSOS() { document.getElementById('sosModal').classList.add('open'); }
function closeSOS() { document.getElementById('sosModal').classList.remove('open'); }
function confirmSOS() {
  closeSOS();
  alert('✅ SOS inviato! I tuoi contatti di fiducia sono stati avvisati con la tua posizione.');
}
</script>
</body>
</html>
