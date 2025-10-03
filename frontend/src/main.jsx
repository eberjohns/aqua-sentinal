import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import 'leaflet/dist/leaflet.css';
import MapPage from './MapPage.jsx';
import DashboardHome from './DashboardHome.jsx';
import CommunityPage from './components/CommunityPage.jsx';
import Navbar from './components/Navbar.jsx';
import NewsPage from './components/NewsPage.jsx';
import DamOpenings from './components/DamOpenings.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
  <Route path="/" element={<DashboardHome />} />
  <Route path="/map" element={<MapPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/dam-openings" element={<DamOpenings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
