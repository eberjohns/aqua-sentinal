import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MiniMap({ location, reports }) {
  if (!location) return <div>Loading map...</div>;
  return (
    <MapContainer center={[location.lat, location.lon]} zoom={13} style={{ height: 220, width: '100%', borderRadius: 12 }} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[location.lat, location.lon]}>
        <Popup>Your Location</Popup>
      </Marker>
      {reports.map((r, i) => (
        <Circle key={i} center={[r.latitude, r.longitude]} radius={1000} pathOptions={{ color: 'red', fillOpacity: 0.2 }} />
      ))}
    </MapContainer>
  );
}

function DashboardHome() {
  const [location, setLocation] = useState(null);
  const [news, setNews] = useState([]);
  const [damOpenings, setDamOpenings] = useState([]);
  const [reports, setReports] = useState([]);
  const [floodChance, setFloodChance] = useState(null);
  const [loadingFlood, setLoadingFlood] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError('Location permission denied or unavailable.')
    );
  }, []);

  // Fetch news
  useEffect(() => {
    fetch('https://newsdata.io/api/1/news?apikey=pub_8e5c79aa6fed4de6bb63588483f7bcd3&q=floods&language=en')
      .then(res => res.json())
      .then(data => setNews(data.results || []));
  }, []);

  // Fetch dam openings
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/dam-openings')
      .then(res => res.json())
      .then(data => setDamOpenings(data || []));
  }, []);

  // Fetch nearby reports
  useEffect(() => {
    if (!location) return;
    axios.get('http://127.0.0.1:8000/api/v1/reports')
      .then(res => {
        // Filter reports within ~10km
        const filtered = res.data.filter(r => {
          const dx = r.latitude - location.lat;
          const dy = r.longitude - location.lon;
          return Math.sqrt(dx*dx + dy*dy) < 0.1;
        });
        setReports(filtered);
      });
  }, [location]);

  // Flood chance check (fixed endpoint and risk mapping)
  const checkFloodChance = async () => {
    if (!location) return;
    setLoadingFlood(true);
    setFloodChance(null);
    try {
  const res = await axios.get(`http://127.0.0.1:8000/risk_alert?lat=${location.lat}&lon=${location.lon}`);
      // Map backend risk to UI string
      let risk = res.data.risk || 'Error';
      if (risk === 'HIGH') risk = 'High';
      else if (risk === 'MEDIUM') risk = 'Medium';
      else if (risk === 'LOW') risk = 'Low';
      setFloodChance(risk);
    } catch {
      setFloodChance('Error');
    }
    setLoadingFlood(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)' }}>
      {/* Sidebar */}
      <div style={{ width: 340, background: '#fff', boxShadow: '2px 0 16px #0002', padding: 28, display: 'flex', flexDirection: 'column', gap: 36, borderTopRightRadius: 24, borderBottomRightRadius: 24 }}>
        <div>
          <h2 style={{ color: '#1976d2', marginBottom: 16, letterSpacing: 1 }}>🌊 Flood News</h2>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {news.length === 0 && <div>Loading news...</div>}
            {news.slice(0, 4).map((n, i) => (
              <a
                key={i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  background: 'linear-gradient(90deg, #f7fbff 70%, #e3f2fd 100%)',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px #1976d211',
                  padding: '14px 16px',
                  marginBottom: 0,
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  border: '1px solid #e3e3e3',
                  cursor: 'pointer',
                  minHeight: 70,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 4px 16px #1976d233';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px #1976d211';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Thumbnail or fallback icon */}
                {n.image_url ? (
                  <img
                    src={n.image_url}
                    alt="news"
                    style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: '#e3e3e3' }}
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.style.width = '54px';
                      fallback.style.height = '54px';
                      fallback.style.borderRadius = '8px';
                      fallback.style.background = '#e3e3e3';
                      fallback.style.display = 'flex';
                      fallback.style.alignItems = 'center';
                      fallback.style.justifyContent = 'center';
                      fallback.style.fontSize = '28px';
                      fallback.style.color = '#1976d2';
                      fallback.style.flexShrink = '0';
                      fallback.innerText = '📰';
                      e.currentTarget.parentNode.insertBefore(fallback, e.currentTarget.nextSibling);
                    }}
                  />
                ) : (
                  <div style={{ width: 54, height: 54, borderRadius: 8, background: '#e3e3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#1976d2', flexShrink: 0 }}>
                    📰
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2', marginBottom: 2, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#444', margin: '4px 0 0 0', lineHeight: 1.3, maxHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.description}</div>
                  <div style={{ fontSize: 12, color: '#1976d2', marginTop: 6, fontWeight: 500 }}>Read more →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 style={{ color: '#1976d2', marginBottom: 16, letterSpacing: 1 }}>💧 Dam Openings</h2>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {damOpenings.length === 0 && <div style={{ color: '#888' }}>No dam openings scheduled.</div>}
            {damOpenings.map((d, i) => (
              <div key={i} style={{ marginBottom: 16, background: 'linear-gradient(90deg, #e3f2fd 60%, #f8fafc 100%)', borderRadius: 10, padding: 12, boxShadow: '0 1px 4px #0001' }}>
                <b style={{ fontSize: 15 }}>{d.name}</b><br />
                <span style={{ color: '#1976d2', fontSize: 13 }}>Lat: {d.latitude}, Lng: {d.longitude}</span><br />
                <span style={{ color: '#555', fontSize: 13 }}>Opens at: {new Date(d.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Main content */}
      <div style={{ flex: 1, padding: 48, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 20, boxShadow: '0 4px 16px #0001', padding: 32, marginBottom: 32, transition: 'box-shadow 0.2s' }}>
          <h2 style={{ color: '#1976d2', marginBottom: 16, fontSize: 22, letterSpacing: 1 }}>📍 Nearby Reports</h2>
          <MiniMap location={location} reports={reports} />
          <div style={{ marginTop: 16, fontSize: 16, color: '#444', fontWeight: 500 }}>
            {reports.length === 0 ? 'No recent reports nearby.' : `${reports.length} reports found near you.`}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 20, boxShadow: '0 4px 16px #0001', padding: 32 }}>
          <h2 style={{ color: '#1976d2', marginBottom: 16, fontSize: 22, letterSpacing: 1 }}>⚠️ Flood Risk at Your Location</h2>
          <button onClick={checkFloodChance} style={{ padding: '12px 32px', background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px #1976d222', transition: 'background 0.2s, box-shadow 0.2s' }} disabled={loadingFlood || !location}>
            {loadingFlood ? 'Checking...' : 'Check Flood Chance'}
          </button>
          {floodChance && (
            <div style={{ marginTop: 22, fontSize: 22, color: floodChance === 'High' ? 'red' : floodChance === 'Medium' ? 'orange' : 'green', fontWeight: 800, letterSpacing: 1 }}>
              Flood Risk: {floodChance}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
