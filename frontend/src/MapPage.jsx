import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import HeatmapLayer from './components/HeatmapLayer';
import 'leaflet/dist/leaflet.css';
import ReportForm from './components/ReportForm';
import axios from 'axios';
import L from 'leaflet';

// --- Custom Icons ---
const unverifiedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Heatmap & Buffer Configurable Variables ---
const HEATMAP_MAX_INTENSITY = 10; // max value for normalization
const HEATMAP_RADIUS = 20; // px
const HEATMAP_BLUR = 15; // px
const HEATMAP_GRADIENT = {
  0.2: 'blue',    // low trust
  0.5: 'cyan',    // medium trust
  0.8: 'lime',    // high trust
  1.0: 'red'      // very high trust
};

// Buffer radius in meters (change this variable to adjust buffer size)
const BUFFER_RADIUS_METERS = 1000; // e.g., 300 meters


function MapPage() {
  // Helper: Haversine distance in meters
  function haversineDistance(lat1, lng1, lat2, lng2) {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function MapRightClickHandler({ mockMode, setMockLat, setMockLng }) {
    const map = useMap();
    const handlerRef = useRef();
    useEffect(() => {
      if (!map) return;
      if (handlerRef.current) {
        map.off('contextmenu', handlerRef.current);
      }
      const handler = (e) => {
        if (mockMode) {
          setMockLat(e.latlng.lat);
          setMockLng(e.latlng.lng);
        }
      };
      map.on('contextmenu', handler);
      handlerRef.current = handler;
      return () => {
        map.off('contextmenu', handler);
      };
    }, [map, mockMode, setMockLat, setMockLng]);
    return null;
  }

  const [position, setPosition] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [mockMode, setMockMode] = useState(false);
  const [mockLat, setMockLat] = useState(10.55);
  const [mockLng, setMockLng] = useState(76.15);

  const API_URL = 'http://127.0.0.1:8000';

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/reports`);
      setAllReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  useEffect(() => {
    if (mockMode) {
      setPosition([mockLat, mockLng]);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        (err) => {
          console.error("Error getting location:", err);
          setPosition([10.55, 76.15]);
        }
      );
    }
    fetchReports();
  }, [mockMode, mockLat, mockLng]);

  const handleReportSubmit = async (formData) => {
    try {
      await axios.post(`${API_URL}/api/v1/reports`, formData);
      alert('Report submitted successfully!');
      setIsFormVisible(false);
      fetchReports();
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert('Error submitting report. Please try again.');
    }
  };

  // Cluster reports by proximity (simple radius clustering)
  const clusterRadius = 0.001;
  const clusters = useMemo(() => {
    const arr = [];
    allReports.forEach(report => {
      let found = false;
      for (const cluster of arr) {
        const dx = cluster.latitude - report.latitude;
        const dy = cluster.longitude - report.longitude;
        if (Math.sqrt(dx*dx + dy*dy) < clusterRadius) {
          cluster.reports.push(report);
          found = true;
          break;
        }
      }
      if (!found) {
        arr.push({
          latitude: report.latitude,
          longitude: report.longitude,
          reports: [report]
        });
      }
    });
    return arr;
  }, [allReports, clusterRadius]);

  useEffect(() => {
    if (!position || !clusters.length) return;
    for (const cluster of clusters) {
      const dist = haversineDistance(position[0], position[1], cluster.latitude, cluster.longitude);
      if (dist <= BUFFER_RADIUS_METERS) {
        alert('Warning: You have entered a hazard buffer area!');
        break;
      }
    }
  }, [position, clusters]);

  if (!position) {
    return <div>Loading map... Please grant location permission.</div>;
  }

  // Use clusters for heatmap points, intensity = trust score
  const heatmapPoints = clusters.map(cluster => ({
    lat: cluster.latitude,
    lng: cluster.longitude,
    value: Math.min(cluster.reports.length / 10, HEATMAP_MAX_INTENSITY)
  }));

  return (
    <>
      <div style={{ padding: '10px', background: '#f8f8f8', borderBottom: '1px solid #ddd' }}>
        <label>
          <input type="checkbox" checked={mockMode} onChange={e => setMockMode(e.target.checked)} />
          Mock Location
        </label>
        {mockMode && (
          <span style={{ marginLeft: '10px' }}>
            Lat: <input type="number" value={mockLat} step="0.0001" onChange={e => setMockLat(Number(e.target.value))} style={{ width: '100px' }} />
            Lng: <input type="number" value={mockLng} step="0.0001" onChange={e => setMockLng(Number(e.target.value))} style={{ width: '100px' }} />
            <button onClick={() => setPosition([mockLat, mockLng])} style={{ marginLeft: '10px' }}>Set</button>
          </span>
        )}
      </div>
      <MapContainer
        center={position}
        zoom={13}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        style={{ height: '100vh', width: '100vw' }}
      >
        {/* Right-click handler for mock location */}
        <MapRightClickHandler mockMode={mockMode} setMockLat={setMockLat} setMockLng={setMockLng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Heatmap layer for flood-prone areas */}
        <HeatmapLayer
          points={heatmapPoints}
          options={{ radius: HEATMAP_RADIUS, blur: HEATMAP_BLUR, gradient: HEATMAP_GRADIENT }}
        />
        {/* Marker for the user's current location */}
        <Marker position={position} icon={userLocationIcon}>
          <Popup>Your current location.</Popup>
        </Marker>
        {/* Clustered area markers with buffer circles and popup */}
        {clusters.map((cluster, idx) => {
          // Find first flood image in cluster
          const firstImage = cluster.reports.find(r => r.image_url);
          // Create custom icon if image exists
          const customIcon = firstImage ? new L.Icon({
            iconUrl: firstImage.image_url,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
            className: 'flood-thumbnail-icon'
          }) : unverifiedIcon;
          return (
            <>
              <Circle
                key={`circle-${idx}`}
                center={[cluster.latitude, cluster.longitude]}
                radius={BUFFER_RADIUS_METERS}
                pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.15 }}
              />
              <Marker
                key={`marker-${idx}`}
                position={[cluster.latitude, cluster.longitude]}
                icon={customIcon}
              >
                <Popup>
                  <b>Area Reports: {cluster.reports.length}</b><br />
                  Trust Score: {cluster.reports.length}<br />
                  <div style={{ maxWidth: '200px', maxHeight: '200px', overflowY: 'auto' }}>
                    {cluster.reports.map((r, i) => r.image_url ? (
                      <img key={i} src={r.image_url} alt="Flood report" style={{ width: '100%', marginBottom: '5px' }} />
                    ) : null)}
                  </div>
                  <ul>
                    {cluster.reports.map((r, i) => (
                      <li key={i}>{r.details}</li>
                    ))}
                  </ul>
                </Popup>
              </Marker>
            </>
          );
        })}
      </MapContainer>
      <button className="report-button" onClick={() => setIsFormVisible(true)}>
        Report Hazard
      </button>
      {isFormVisible && (
        <ReportForm 
          position={position}
          onSubmit={handleReportSubmit}
          onClose={() => setIsFormVisible(false)}
        />
      )}
    </>
  );
}

export default MapPage;
