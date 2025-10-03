import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HomePage() {
  const [location, setLocation] = useState(null);
  const [rainfall, setRainfall] = useState(null);
  const [risk, setRisk] = useState(null);
  const [bufferZones, setBufferZones] = useState([]);
  const [error, setError] = useState(null);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        setError('Location permission denied or unavailable.');
      }
    );
  }, []);

  // Fetch rainfall, risk, and buffer zones from flood_predict endpoints
  useEffect(() => {
    if (!location) return;
    const fetchData = async () => {
      try {
        // Adjust these URLs to your actual flood_predict backend endpoints
        const rainRes = await axios.get(`http://127.0.0.1:8001/rainfall?lat=${location.lat}&lon=${location.lon}`);
        setRainfall(rainRes.data);
        const riskRes = await axios.get(`http://127.0.0.1:8001/risk?lat=${location.lat}&lon=${location.lon}`);
        setRisk(riskRes.data);
        const bufferRes = await axios.get(`http://127.0.0.1:8001/buffer_zones?lat=${location.lat}&lon=${location.lon}`);
        setBufferZones(bufferRes.data.zones || []);
      } catch (e) {
        setError('Error fetching flood prediction data.');
      }
    };
    fetchData();
  }, [location]);

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
      <h2>Flood Risk & Rainfall at Your Location</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!location && <div>Detecting your location...</div>}
      {location && (
        <>
          <div><b>Latitude:</b> {location.lat.toFixed(5)} <b>Longitude:</b> {location.lon.toFixed(5)}</div>
          <div style={{ margin: '12px 0' }}>
            <b>Rainfall:</b> {rainfall ? `${rainfall.amount} mm` : 'Loading...'}
          </div>
          <div style={{ margin: '12px 0' }}>
            <b>Flood Risk:</b> {risk ? <span style={{ color: risk.level === 'High' ? 'red' : risk.level === 'Medium' ? 'orange' : 'green' }}>{risk.level}</span> : 'Loading...'}
          </div>
          <div style={{ margin: '12px 0' }}>
            <b>Nearby Buffer Zones:</b>
            {bufferZones.length === 0 ? (
              <div>No buffer zones nearby.</div>
            ) : (
              <ul>
                {bufferZones.map((zone, i) => (
                  <li key={i}>Zone at ({zone.lat.toFixed(5)}, {zone.lon.toFixed(5)}) - Radius: {zone.radius}m</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;
