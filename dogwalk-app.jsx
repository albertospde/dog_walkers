// DogWalk PWA — Prototipo React
// Stack: React + Leaflet + Supabase
// Installa: npm install react react-dom leaflet @supabase/supabase-js
// oppure usa come artifact in Claude (Leaflet via CDN)

import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG (sostituisci con le tue credenziali Supabase) ───────────────────
const SUPABASE_URL = "https://TUOPROGETTO.supabase.co";
const SUPABASE_ANON_KEY = "TUA_ANON_KEY";

// Inizializza Supabase (senza SDK: fetch diretto per max compatibilità)
const sbFetch = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Auth helper
const sbAuth = async (email, password, mode = "signin") => {
  const endpoint = mode === "signup" ? "signup" : "token?grant_type=password";
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
};

// ─── PALETTE & STILE ────────────────────────────────────────────────────────
const colors = {
  bg: "#f0f4f8",
  card: "#ffffff",
  primary: "#2d6a4f",     // verde foresta — evoca natura, percorsi
  accent: "#f4a261",      // arancio caldo — calore, compagnia
  text: "#1a1a2e",
  muted: "#6b7280",
  danger: "#e63946",
  busy: "#e63946",
  moderate: "#f4a261",
  quiet: "#2d6a4f",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Dati mock per la heatmap (in produzione arrivano da Supabase)
const mockHeatmapData = {
  0: 1, 1: 0, 2: 0, 3: 0, 4: 1, 5: 3,
  6: 12, 7: 28, 8: 35, 9: 22, 10: 18, 11: 15,
  12: 10, 13: 8, 14: 9, 15: 14, 16: 20, 17: 38,
  18: 45, 19: 42, 20: 30, 21: 18, 22: 8, 23: 3,
};

const maxVal = Math.max(...Object.values(mockHeatmapData));

function getLevel(val) {
  const pct = val / maxVal;
  if (pct > 0.65) return { label: "Molto affollato", color: colors.busy, emoji: "🔴" };
  if (pct > 0.35) return { label: "Moderato", color: colors.moderate, emoji: "🟡" };
  return { label: "Tranquillo", color: colors.quiet, emoji: "🟢" };
}

// ─── COMPONENTI ─────────────────────────────────────────────────────────────

function HeatmapBar({ hour, value, isCurrent }) {
  const pct = value / maxVal;
  const level = getLevel(value);
  const isNight = hour < 6 || hour >= 22;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        flexDirection: "column",
        gap: 2,
        cursor: "pointer",
        position: "relative",
      }}
      title={`${String(hour).padStart(2, "0")}:00 — ${value} passeggiate`}
    >
      <div
        style={{
          width: isCurrent ? 18 : 14,
          height: Math.max(4, pct * 80),
          background: isNight ? "#c8d6e5" : level.color,
          borderRadius: "3px 3px 0 0",
          opacity: isCurrent ? 1 : 0.75,
          transition: "height 0.4s ease",
          border: isCurrent ? `2px solid ${colors.text}` : "none",
        }}
      />
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: -20,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            fontWeight: 700,
            color: colors.text,
            whiteSpace: "nowrap",
          }}
        >
          ora
        </div>
      )}
    </div>
  );
}

function HeatmapPanel() {
  const now = new Date().getHours();
  const currentLevel = getLevel(mockHeatmapData[now]);

  // Suggerimento orario migliore (tranquillo + vicino all'ora corrente)
  const suggestion = (() => {
    const candidates = HOURS.filter((h) => {
      const pct = mockHeatmapData[h] / maxVal;
      return pct <= 0.35 && Math.abs(h - now) <= 4 && h !== now;
    });
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) =>
      Math.abs(a - now) < Math.abs(b - now) ? a : b
    );
  })();

  return (
    <div style={{ padding: "0 16px 16px" }}>
      {/* Status attuale */}
      <div
        style={{
          background: currentLevel.color + "18",
          border: `1.5px solid ${currentLevel.color}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: colors.muted, marginBottom: 2 }}>
            Adesso ({String(now).padStart(2, "0")}:00)
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: currentLevel.color }}>
            {currentLevel.emoji} {currentLevel.label}
          </div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            ~{mockHeatmapData[now]} passeggiate attive nella zona
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          {currentLevel.label === "Tranquillo" ? (
            <div style={{ fontSize: 32 }}>🐾</div>
          ) : (
            <div style={{ fontSize: 32 }}>⏳</div>
          )}
        </div>
      </div>

      {/* Suggerimento */}
      {suggestion !== null && currentLevel.label !== "Tranquillo" && (
        <div
          style={{
            background: "#e8f5e9",
            border: "1.5px solid " + colors.quiet,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: colors.quiet,
            fontWeight: 600,
          }}
        >
          💡 Momento migliore vicino: {String(suggestion).padStart(2, "0")}:00 —{" "}
          più tranquillo e sicuro
        </div>
      )}

      {/* Grafico 24h */}
      <div style={{ marginBottom: 8, fontSize: 13, color: colors.muted, fontWeight: 600 }}>
        Affollamento nelle ultime 24h (media settimanale)
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 110,
          paddingTop: 24,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {HOURS.map((h) => (
          <HeatmapBar
            key={h}
            hour={h}
            value={mockHeatmapData[h]}
            isCurrent={h === now}
          />
        ))}
      </div>

      {/* Labels ore significative */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: colors.muted,
          marginTop: 4,
          paddingLeft: 2,
        }}
      >
        {["00", "06", "12", "18", "23"].map((h) => (
          <span key={h}>{h}h</span>
        ))}
      </div>

      {/* Legenda */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { color: colors.quiet, label: "Tranquillo" },
          { color: colors.moderate, label: "Moderato" },
          { color: colors.busy, label: "Affollato" },
          { color: "#c8d6e5", label: "Notte" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: color,
              }}
            />
            <span style={{ fontSize: 11, color: colors.muted }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapPlaceholder({ userPos, nearbyCount }) {
  // Placeholder mappa — in produzione integra Leaflet con react-leaflet
  return (
    <div
      style={{
        height: 220,
        background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 50%, #b8dacc 100%)",
        borderRadius: 12,
        margin: "0 16px 16px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1.5px solid #a8d5b5",
      }}
    >
      {/* Griglia stile mappa */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.15 }}
        width="100%"
        height="100%"
      >
        {[0, 40, 80, 120, 160, 200].map((y) => (
          <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="#2d6a4f" strokeWidth="1" />
        ))}
        {[0, 50, 100, 150, 200, 250, 300].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="100%" stroke="#2d6a4f" strokeWidth="1" />
        ))}
      </svg>

      {/* Punti vicini simulati */}
      {[
        { x: "30%", y: "35%", you: false },
        { x: "55%", y: "60%", you: false },
        { x: "70%", y: "30%", you: false },
        { x: "42%", y: "50%", you: true },
      ].map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            transform: "translate(-50%, -50%)",
            fontSize: p.you ? 28 : 22,
            filter: p.you ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none",
          }}
        >
          {p.you ? "📍" : "🐕"}
        </div>
      ))}

      {/* Badge nearby */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: colors.primary,
          color: "#fff",
          borderRadius: 20,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {nearbyCount} vicino a te
      </div>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.85)",
          borderRadius: 8,
          padding: "3px 10px",
          fontSize: 11,
          color: colors.muted,
          whiteSpace: "nowrap",
        }}
      >
        {userPos
          ? `📡 GPS: ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`
          : "Attiva il GPS per vedere la mappa live"}
      </div>
    </div>
  );
}

function NearbyCard({ name, dogName, distance, status }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        background: colors.card,
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: colors.primary + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        🐶
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{name}</div>
        <div style={{ fontSize: 12, color: colors.muted }}>con {dogName} · {distance}m</div>
      </div>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: status === "active" ? colors.quiet : colors.moderate,
        }}
      />
    </div>
  );
}

// ─── APP PRINCIPALE ──────────────────────────────────────────────────────────

export default function DogWalkApp() {
  const [tab, setTab] = useState("map");
  const [userPos, setUserPos] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const watchRef = useRef(null);

  // Geolocalizzazione
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS non supportato dal browser");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsError(null);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    setTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setTracking(false);
    setUserPos(null);
  }, []);

  useEffect(() => () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const nearbyMock = [
    { name: "Giulia", dogName: "Rocky", distance: 120, status: "active" },
    { name: "Marco", dogName: "Bella", distance: 280, status: "active" },
    { name: "Sara", dogName: "Toby", distance: 450, status: "idle" },
  ];

  const now = new Date().getHours();
  const currentAdvice = getLevel(mockHeatmapData[now]);

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        minHeight: "100vh",
        background: colors.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: colors.primary,
          padding: "16px 16px 12px",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
              🐾 DogWalk
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              Passeggia con sicurezza
            </div>
          </div>
          {/* SOS Button */}
          <button
            style={{
              background: colors.danger,
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "6px 14px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(230,57,70,0.4)",
            }}
            onClick={() => alert("SOS inviato! I tuoi contatti di fiducia sono stati avvisati.")}
          >
            🆘 SOS
          </button>
        </div>

        {/* GPS Toggle */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: tracking ? "#69f0ae" : "#ffb74d",
              boxShadow: tracking ? "0 0 6px #69f0ae" : "none",
            }}
          />
          <span style={{ fontSize: 12, flex: 1 }}>
            {tracking
              ? userPos
                ? "GPS attivo — posizione condivisa"
                : "Rilevamento GPS..."
              : "GPS spento — non visibile agli altri"}
          </span>
          <button
            onClick={tracking ? stopTracking : startTracking}
            style={{
              background: tracking ? "rgba(255,255,255,0.2)" : colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {tracking ? "Disattiva" : "Attiva"}
          </button>
        </div>
        {gpsError && (
          <div style={{ fontSize: 11, color: "#ffcdd2", marginTop: 4 }}>⚠ {gpsError}</div>
        )}
      </div>

      {/* BANNER CONSIGLIO */}
      <div
        style={{
          background: currentAdvice.color,
          color: "#fff",
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {currentAdvice.emoji} Ora:{" "}
        {currentAdvice.label === "Tranquillo"
          ? "ottimo momento per uscire!"
          : currentAdvice.label === "Moderato"
          ? "zona moderatamente frequentata"
          : "zona molto affollata — considera di aspettare"}
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          background: colors.card,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {[
          { id: "map", label: "🗺 Mappa" },
          { id: "heatmap", label: "📊 Orari" },
          { id: "nearby", label: "🐕 Vicini" },
          { id: "profile", label: "👤 Profilo" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 4px",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? `2px solid ${colors.primary}` : "2px solid transparent",
              color: tab === t.id ? colors.primary : colors.muted,
              fontSize: 11,
              fontWeight: tab === t.id ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ paddingTop: 12 }}>
        {tab === "map" && (
          <>
            <MapPlaceholder userPos={userPos} nearbyCount={nearbyMock.length} />
            <div style={{ padding: "0 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.muted, marginBottom: 8 }}>
                Nelle vicinanze ({nearbyMock.length})
              </div>
              {nearbyMock.map((p) => (
                <NearbyCard key={p.name} {...p} />
              ))}
            </div>
          </>
        )}

        {tab === "heatmap" && <HeatmapPanel />}

        {tab === "nearby" && (
          <div>
            <div style={{ padding: "0 16px 12px", fontSize: 13, color: colors.muted }}>
              Utenti attivi entro 500m
            </div>
            {nearbyMock.map((p) => (
              <NearbyCard key={p.name} {...p} />
            ))}
            <div
              style={{
                margin: 16,
                padding: 14,
                background: colors.accent + "18",
                borderRadius: 10,
                fontSize: 13,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              🤝 <strong>Vuoi dire ciao?</strong> Tocca un utente per mandare un saluto anonimo — solo se entrambi sono d'accordo viene condiviso il profilo.
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div style={{ padding: 16 }}>
            <div
              style={{
                background: colors.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🐕‍🦺</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Mario Rossi</div>
                <div style={{ color: colors.muted, fontSize: 13 }}>con Artù (Labrador, 3 anni)</div>
              </div>
            </div>

            <div
              style={{
                background: colors.card,
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Le mie statistiche</div>
              {[
                { label: "Passeggiate questo mese", val: "18" },
                { label: "Media passeggiate/settimana", val: "4.5" },
                { label: "Orario preferito", val: "18:00 – 19:00" },
                { label: "Zona abituale", val: "Parco Centrale" },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: colors.muted }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            <button
              style={{
                width: "100%",
                marginTop: 12,
                background: colors.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Contatti di fiducia (SOS) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
