import React, { useState } from 'react';

const images = [
  {
    src: process.env.PUBLIC_URL + '/ConstructionImage/Sunrise_Residency.PNG',
    alt: 'Construction Site 1',
  },
  {
    src: process.env.PUBLIC_URL + '/ConstructionImage/Oceanic_Towers.PNG',
    alt: 'Construction Site 2',
  },
  {
    src: process.env.PUBLIC_URL + '/ConstructionImage/Lakeview_Apartments.PNG',
    alt: 'Construction Site 3',
  },
  {
    src: process.env.PUBLIC_URL + '/ConstructionImage/Metro_City_Homes.PNG',
    alt: 'Construction Site 4',
  },
];

function Hero() {
  const [current, setCurrent] = useState(0);

  // Auto-rollup every 3 seconds
    React.useEffect(() => {
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(interval);
    }, []);

  const nextImage = () => setCurrent((current + 1) % images.length);
  const prevImage = () => setCurrent((current - 1 + images.length) % images.length);

    return (
      <section className="w-100 py-4 d-flex justify-content-center align-items-center" style={{ margin: 0, padding: 0, background: 'transparent' }}>
        <div style={{ maxWidth: '900px', width: '100%', margin: 0, padding: 0 }}>
        <div className="d-flex justify-content-center align-items-center mb-3">
          <button 
            className="btn me-3" 
            onClick={prevImage} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#667eea',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            &lt;
          </button>
          <img
            src={images[current].src}
            alt={images[current].alt}
            className="img-fluid shadow-lg"
            style={{ 
              width: '100%', 
              maxWidth: '900px', 
              height: '280px', 
              objectFit: 'cover', 
              border: '5px solid rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          />
          <button 
            className="btn ms-3" 
            onClick={nextImage} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: '2px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#667eea',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            &gt;
          </button>
        </div>
        <div className="d-flex justify-content-center">
          {images.map((img, idx) => (
            <button
              key={idx}
              className="btn btn-sm mx-1"
              style={{ 
                borderRadius: '50%', 
                width: 20, 
                height: 20, 
                padding: 0,
                background: idx === current ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.6)',
                boxShadow: idx === current ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.3s'
              }}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
