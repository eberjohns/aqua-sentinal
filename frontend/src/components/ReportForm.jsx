import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project values
const SUPABASE_URL = 'https://xyiqiwttgfqgnlfmvijo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5aXFpd3R0Z2ZxZ25sZm12aWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NzA2NTEsImV4cCI6MjA3NDQ0NjY1MX0.FPrJ553cnB9VBpVtTX2MCFE8d6-L9TvuL4Hg7ZZgc9s';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
function ReportForm({ position, onSubmit, onClose }) {
  const [reportType, setReportType] = useState('WATER_LEVEL');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Camera capture logic
  const startCamera = async () => {
    setIsCapturing(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert('Unable to access camera.');
        setIsCapturing(false);
      }
    } else {
      alert('Camera not supported on this device/browser.');
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        setImage(blob);
      }, 'image/jpeg');
      // Stop camera
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsCapturing(false);
    }
  };

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = null;
    if (image) {
      // Upload image to Supabase Storage
      const fileName = `report_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('reports') // bucket name
        .upload(fileName, image, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });
      if (error) {
        alert('Image upload failed.');
        return;
      }
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    // Send report data as JSON
    const reportData = {
      latitude: position[0],
      longitude: position[1],
      report_type: reportType,
      details: details,
      image_url: imageUrl,
    };
    onSubmit(reportData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Report a Hazard</h2>
        <form onSubmit={handleSubmit}>
          <p>Location: {position[0].toFixed(4)}, {position[1].toFixed(4)}</p>
          
          <label htmlFor="reportType">Type of Hazard:</label>
          <select 
            id="reportType" 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="WATER_LEVEL">High Water Level</option>
            <option value="ROAD_BLOCKED">Road Blocked</option>
            <option value="FLOODING">Flooding</option>
            <option value="OTHER">Other</option>
          </select>

          <label htmlFor="details">Additional Details:</label>
          <textarea 
            id="details"
            rows="4"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <label>Capture Image (Camera only):</label>
          {!image && !isCapturing && (
            <button type="button" onClick={startCamera} style={{ marginBottom: '10px' }}>
              Open Camera
            </button>
          )}
          {isCapturing && (
            <div style={{ marginBottom: '10px' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '200px' }} />
              <div style={{ marginTop: '5px' }}>
                <button type="button" onClick={capturePhoto} style={{ marginRight: '10px' }}>Capture Photo</button>
                <button type="button" onClick={cancelCamera}>Cancel</button>
              </div>
            </div>
          )}
          {image && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '200px' }}
              />
              <div>
                <button type="button" onClick={() => setImage(null)} style={{ marginTop: '5px' }}>Retake Photo</button>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="submit" className="button-primary">Submit</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;