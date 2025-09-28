import React, { useState } from 'react';
import './Styles/Hero.css';

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
    <section className="hero-webpart">
      <div className="hero-carousel">
        <button className="carousel-btn" onClick={prevImage}>&lt;</button>
        <img
          src={images[current].src}
          alt={images[current].alt}
          className="carousel-image"
        />
        <button className="carousel-btn" onClick={nextImage}>&gt;</button>
      </div>
      <div className="carousel-indicators">
        {images.map((img, idx) => (
          <span
            key={idx}
            className={idx === current ? 'indicator active' : 'indicator'}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </section>
  );
}

export default Hero;
