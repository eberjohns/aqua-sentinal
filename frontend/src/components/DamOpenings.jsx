import React, { useState, useEffect } from 'react';

// Hardcoded admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const API_URL = 'http://127.0.0.1:8000/api/v1/dam-openings';

function DamOpenings() {
  const [openings, setOpenings] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [login, setLogin] = useState({ user: '', pass: '' });
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', time: '' });
  const [error, setError] = useState('');

  // Fetch dam openings from backend
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOpenings(data))
      .catch(() => setOpenings([]));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (login.user === ADMIN_USER && login.pass === ADMIN_PASS) {
      setIsAdmin(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude || !form.time) return;
    const newOpening = {
      name: form.name,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      time: form.time
    };
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOpening)
      });
      if (res.ok) {
        // Refresh list after successful add
        const updated = await res.json();
        setOpenings(updated);
        setForm({ name: '', latitude: '', longitude: '', time: '' });
      }
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1565c0' }}>Dam Openings</h1>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px #90caf944', padding: 24 }}>
        <h2 style={{ color: '#1976d2' }}>Upcoming Dam Shutter Openings</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {openings.length === 0 && <li style={{ color: '#888' }}>No dam openings scheduled.</li>}
          {openings.map((d, i) => (
            <li key={i} style={{ margin: '18px 0', padding: '12px 16px', background: '#e3f2fd', borderRadius: 8 }}>
              <b>{d.name}</b><br />
              <span style={{ color: '#1976d2' }}>Lat: {d.latitude}, Lng: {d.longitude}</span><br />
              <span style={{ color: '#555' }}>Opens at: {new Date(d.time).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
      {!isAdmin && (
        <form onSubmit={handleLogin} style={{ marginTop: 32, background: '#f0f7fa', borderRadius: 8, padding: 18, boxShadow: '0 2px 8px #90caf922' }}>
          <h3 style={{ color: '#1976d2' }}>Admin Login</h3>
          <input type="text" placeholder="Username" value={login.user} onChange={e => setLogin({ ...login, user: e.target.value })} style={{ marginRight: 8, padding: 8, borderRadius: 6, border: '1px solid #90caf9' }} />
          <input type="password" placeholder="Password" value={login.pass} onChange={e => setLogin({ ...login, pass: e.target.value })} style={{ marginRight: 8, padding: 8, borderRadius: 6, border: '1px solid #90caf9' }} />
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }}>Login</button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
      )}
      {isAdmin && (
        <form onSubmit={handleAdd} style={{ marginTop: 32, background: '#f0f7fa', borderRadius: 8, padding: 18, boxShadow: '0 2px 8px #90caf922' }}>
          <h3 style={{ color: '#1976d2' }}>Add Dam Opening</h3>
          <input type="text" placeholder="Dam Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ marginRight: 8, padding: 8, borderRadius: 6, border: '1px solid #90caf9' }} />
          <input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} style={{ marginRight: 8, padding: 8, borderRadius: 6, border: '1px solid #90caf9', width: 120 }} />
          <input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} style={{ marginRight: 8, padding: 8, borderRadius: 6, border: '1px solid #90caf9', width: 120 }} />
          <input type="datetime-local" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={{ marginRight: 8, padding: 8, borderRadius: 6, border: '1px solid #90caf9' }} />
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }}>Add</button>
        </form>
      )}
    </div>
  );
}

export default DamOpenings;
