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
      <section className="w-100 py-4 d-flex justify-content-center align-items-center" style={{ margin: 0, padding: 0 }}>
        <div style={{ maxWidth: '800px', width: '100%', margin: 0, padding: 0 }}>
        <div className="d-flex justify-content-center align-items-center mb-3">
          <button className="btn btn-outline-secondary me-2" onClick={prevImage}>&lt;</button>
          <img
            src={images[current].src}
            alt={images[current].alt}
            className="img-fluid rounded shadow"
            style={{ width: '100%', maxWidth: '800px', height: '220px', objectFit: 'cover' }}
          />
          <button className="btn btn-outline-secondary ms-2" onClick={nextImage}>&gt;</button>
        </div>
        <div className="d-flex justify-content-center">
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`btn btn-sm mx-1 ${idx === current ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ borderRadius: '50%', width: 18, height: 18, padding: 0 }}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
