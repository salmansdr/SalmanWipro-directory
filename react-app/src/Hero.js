import React, { useState } from 'react';
import './Hero.css';

const images = [
  {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    alt: 'Construction Site 1',
  },
  {
    src: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
    alt: 'Construction Site 2',
  },
  {
    src: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80',
    alt: 'Construction Site 3',
  },
  {
    src: 'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=800&q=80',
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
