import React, { useEffect, useState } from 'react';

const apiKey = "pub_8e5c79aa6fed4de6bb63588483f7bcd3";
const apiUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=floods&language=en`;

const fallbackImage = 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80';

function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        setArticles(data.results || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      fontFamily: 'Poppins, sans-serif',
      background: '#ffffffff',
      minHeight: '100vh',
      margin: 0,
      padding: 0
    }}>
      <h1 style={{
        textAlign: 'center',
        marginTop: 30,
        color: '#1b74e4',
        fontSize: '2.5em',
        letterSpacing: 2
      }}>News</h1>
      <div className="news-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 30,
        padding: 40,
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        {loading && <div style={{textAlign:'center',fontSize:'1.2em',color:'#888'}}>Loading...</div>}
        {error && <div style={{textAlign:'center',fontSize:'1.2em',color:'#e53935'}}>Error loading news: {error}</div>}
        {!loading && !error && articles.length === 0 && (
          <div style={{textAlign:'center',fontSize:'1.2em',color:'#888'}}>No news found.</div>
        )}
        {articles.map((article, idx) => (
          <div className="news-tile" key={idx} style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 24px rgba(46,125,50,0.12)',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s',
            position: 'relative',
            animation: 'fadeInUp 1s ease'
          }}>
            <img className="news-image" src={article.image_url || fallbackImage} alt="News" style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              background: '#e0faffff',
              borderBottom: '3px solid #2e6b7dff'
            }} />
            <div className="news-content" style={{padding: 22}}>
              <div className="news-title" style={{fontSize:'1.3em',fontWeight:600,color:'#38538eff',marginBottom:10,minHeight:48}}>{article.title || 'No Title'}</div>
              <div className="news-desc" style={{color:'#555',fontSize:'1em',marginBottom:18}}>{article.description || ''}</div>
              <div className="news-meta" style={{fontSize:'0.95em',color:'#888',marginBottom:8}}>
                {article.pubDate ? new Date(article.pubDate).toLocaleString() : ''} | {article.source_id || ''}
              </div>
              <a className="news-link" href={article.link} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block',
                padding: '8px 18px',
                background: 'linear-gradient(90deg, #43c3eaff 0%, #2e6d7dff 100%)',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'background 0.3s'
              }}>Read More</a>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default NewsPage;
