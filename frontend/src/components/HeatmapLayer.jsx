import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';

// points: [{lat, lng, value}]
function HeatmapLayer({ points, options }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    // Remove previous heat layer if exists
    if (map._heatLayer) {
      map.removeLayer(map._heatLayer);
      map._heatLayer = null;
    }
    // Prepare data for leaflet.heat
    const heatData = points.map(p => [p.lat, p.lng, p.value || 1]);
    const heatLayer = window.L.heatLayer(heatData, {
      radius: options?.radius || 20,
      blur: options?.blur || 15,
      maxZoom: 17,
      gradient: options?.gradient || { 0.4: 'blue', 0.65: 'cyan', 1: 'white' },
      ...options,
    }).addTo(map);
    map._heatLayer = heatLayer;

    // Redraw heatmap on zoom and move
    const redraw = () => {
      if (map._heatLayer) {
        map._heatLayer.redraw();
      }
    };
    map.on('zoomend moveend', redraw);

    return () => {
      map.off('zoomend moveend', redraw);
      if (map._heatLayer) {
        map.removeLayer(map._heatLayer);
        map._heatLayer = null;
      }
    };
  }, [map, points, options]);

  return null;
}

export default HeatmapLayer;
