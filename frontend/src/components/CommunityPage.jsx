import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// Supabase config (reuse from ReportForm)
const SUPABASE_URL = 'https://xyiqiwttgfqgnlfmvijo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5aXFpd3R0Z2ZxZ25sZm12aWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NzA2NTEsImV4cCI6MjA3NDQ0NjY1MX0.FPrJ553cnB9VBpVtTX2MCFE8d6-L9TvuL4Hg7ZZgc9s';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
import './CommunityPage.css'; // Move styles here if needed

function CommunityPage() {
  // Mock location state for testing
  const [useMockLocation, setUseMockLocation] = useState(false);
  const [mockLat, setMockLat] = useState(11.0168); // Example: Coimbatore
  const [mockLng, setMockLng] = useState(76.9558);
  const [posts, setPosts] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  const [radius, setRadius] = useState(5);
  const [pendingNearMe, setPendingNearMe] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [username, setUsernameState] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [editingUsername, setEditingUsername] = useState(false);

  // Helper to sync username with localStorage
  const setUsername = (name) => {
    setUsernameState(name);
    if (name) {
      localStorage.setItem('community_username', name);
    } else {
      localStorage.removeItem('community_username');
    }
  };

  // Fetch posts and username from localStorage on mount
  // Fetch posts (all or near me)
  // Fetch all posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/posts');
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        setPosts(
          data.map(post => ({
            ...post,
            profilePhoto: getProfilePhoto(post.user),
            time: new Date(post.created_at).toLocaleString(),
            caption: post.caption,
            image: post.image_url,
            location: post.latitude && post.longitude ? { latitude: post.latitude, longitude: post.longitude } : null,
          }))
        );
      } catch (e) {}
    };
    // Load username from localStorage
    const savedUsername = localStorage.getItem('community_username');
    if (savedUsername) {
      setUsernameState(savedUsername);
      setEditingUsername(false);
    } else {
      setEditingUsername(true);
    }
    fetchPosts();
  }, []);

  // Fetch nearby posts only when Find is clicked
  const fetchNearMePosts = async () => {
    setPendingNearMe(true);
    try {
      let url = 'http://localhost:8000/api/v1/posts';
      let lat, lng;
      if (useMockLocation) {
        lat = mockLat;
        lng = mockLng;
      } else {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      url += `?lat=${lat}&lng=${lng}&radius=${radius}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(
        data.map(post => ({
          ...post,
          profilePhoto: getProfilePhoto(post.user),
          time: new Date(post.created_at).toLocaleString(),
          caption: post.caption,
          image: post.image_url,
          location: post.latitude && post.longitude ? { latitude: post.latitude, longitude: post.longitude } : null,
        }))
      );
    } catch (e) {}
    setPendingNearMe(false);
  };
  // Dicebear avatar url with random seed
  const getProfilePhoto = (seed) => `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }
    let userLocation = null;
    if (includeLocation) {
      if (useMockLocation) {
        userLocation = { latitude: mockLat, longitude: mockLng };
      } else if (!location) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          userLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setLocation(userLocation);
        } catch (err) {
          alert('Could not get your location.');
        }
      } else {
        userLocation = location;
      }
    }

    let imageUrl = null;
    if (image) {
      // Upload image to Supabase Storage
      const fileName = `community_${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
      const { data, error } = await supabase.storage
        .from('reports') // reuse the 'reports' bucket
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

    const postPayload = {
      user: username,
      caption: text,
      image_url: imageUrl,
      latitude: userLocation ? userLocation.latitude : null,
      longitude: userLocation ? userLocation.longitude : null,
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });
      if (!res.ok) {
        throw new Error('Failed to post.');
      }
      const data = await res.json();
      // Add profilePhoto and time for UI
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} Today`;
      setPosts([
        {
          ...data,
          profilePhoto: getProfilePhoto(data.user),
          time: timeString,
          location: data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : null,
        },
        ...posts,
      ]);
      setText('');
      setImage(null);
      setUsername('');
      setIncludeLocation(false);
      setLocation(null);
    } catch (err) {
      alert('Failed to post.');
    }
  };

  return (
    <main>
      <div className="container">
        <section className="middle" aria-label="Main content">
          {/* Centered search bar for near me and radius, with mock location for testing */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            {showNearMe && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <label style={{ fontSize: '0.95em', color: '#888' }}>
                  <input type="checkbox" checked={useMockLocation} onChange={e => setUseMockLocation(e.target.checked)} /> Use Mock Location
                </label>
                {useMockLocation && (
                  <>
                    <input type="number" value={mockLat} onChange={e => setMockLat(Number(e.target.value))} step={0.0001} style={{ width: 100, borderRadius: 8, border: '1px solid #dcdcdc', padding: '6px 10px' }} placeholder="Latitude" />
                    <input type="number" value={mockLng} onChange={e => setMockLng(Number(e.target.value))} step={0.0001} style={{ width: 100, borderRadius: 8, border: '1px solid #dcdcdc', padding: '6px 10px' }} placeholder="Longitude" />
                  </>
                )}
              </div>
            )}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (showNearMe) fetchNearMePosts();
                else window.location.reload();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '12px 24px', minWidth: 320 }}
            >
              <label style={{ fontWeight: 500, marginRight: 8, whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={showNearMe} onChange={e => setShowNearMe(e.target.checked)} /> Posts Near Me
              </label>
              {showNearMe && (
                <>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={radius}
                    onChange={e => setRadius(Number(e.target.value))}
                    style={{ width: 80, borderRadius: 8, border: '1px solid #dcdcdc', padding: '8px 12px', fontSize: '1rem' }}
                    placeholder="Radius"
                  />
                  <span style={{ color: '#888', fontSize: '0.95em', marginLeft: 4 }}>degrees</span>
                </>
              )}
              <button type="submit" style={{ background: '#1b74e4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 500, fontSize: '1rem', marginLeft: 8 }} disabled={pendingNearMe}>{showNearMe ? (pendingNearMe ? 'Finding...' : 'Find') : 'All Posts'}</button>
            </form>
            {/* Floating + button */}
            <button
              type="button"
              onClick={() => setShowPostForm(true)}
              style={{
                fontSize: 32,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#1b74e4',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                position: 'fixed',
                bottom: 32,
                right: 32,
                zIndex: 1000,
              }}
              aria-label="Create Post"
            >
              +
            </button>
          </div>
          {/* Modal post form */}
          {showPostForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ background: '#fff', borderRadius: 18, padding: 32, minWidth: 340, maxWidth: 420, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative' }}>
                <button onClick={() => setShowPostForm(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 24, color: '#888', cursor: 'pointer' }} aria-label="Close">×</button>
                <form onSubmit={async (e) => { await handleSubmit(e); setShowPostForm(false); }} aria-label="Create a new post" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="profile-photo" style={{ alignSelf: 'center', marginBottom: 8 }}>
                    <img src={getProfilePhoto(username || 'default')} alt={`Profile picture of ${username || 'user'}`} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #e6e8eb' }} />
                  </div>
                  {(!username || editingUsername) ? (
                    <>
                      <label htmlFor="username">Username</label>
                      <input
                        type="text"
                        id="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        autoFocus
                        onBlur={() => { if (username) setEditingUsername(false); }}
                        style={{ fontSize: '1.1rem', padding: '12px', borderRadius: 8, border: '1px solid #dcdcdc' }}
                      />
                    </>
                  ) : (
                    <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                      <b>{username}</b>
                      <button type="button" style={{ marginLeft: 8 }} onClick={() => setEditingUsername(true)}>
                        Change
                      </button>
                    </div>
                  )}
                  <label htmlFor="post-text">Share your thoughts</label>
                  <input
                    type="text"
                    id="post-text"
                    placeholder="What's on your mind?"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    required
                    style={{ fontSize: '1.1rem', padding: '12px', borderRadius: 8, border: '1px solid #dcdcdc' }}
                  />
                  <label htmlFor="post-image">Upload an image (optional)</label>
                  <input
                    type="file"
                    id="post-image"
                    accept="image/*"
                    onChange={e => setImage(e.target.files[0])}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #dcdcdc', background: '#fafafa' }}
                  />
                  <label style={{ display: 'block', marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      checked={includeLocation}
                      onChange={e => setIncludeLocation(e.target.checked)}
                    />
                    {' '}Include my location
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button type="button" onClick={() => setShowPostForm(false)} style={{ background: '#eee', color: '#333', borderRadius: 8, padding: '10px 20px' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 8, padding: '10px 20px' }}>Post</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Feeds */}
          <div className="feeds" role="feed">
            {posts.map(post => (
              <article className="feed" key={post.id} aria-labelledby={`feed-${post.id}-heading`}>
                <div className="head">
                  <div className="user">
                    <div className="profile-photo">
                      <img src={post.profilePhoto} alt={`Profile picture of ${post.user}`} />
                    </div>
                    <div className="info">
                      <h3 id={`feed-${post.id}-heading`}>{post.user}</h3>
                      <small>{post.time}</small>
                      {post.location && (
                        <div style={{ fontSize: '0.8em', color: '#888' }}>
                          📍 {post.location.latitude.toFixed(4)}, {post.location.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="caption">
                  <p>{post.caption}</p>
                </div>
                {post.image && (
                  <div className="photo">
                    <img src={post.image} alt="User uploaded" />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default CommunityPage;
