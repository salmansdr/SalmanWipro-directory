import React from 'react';
import './Styles/MoreDetails.css';

// Sample data (replace with props or fetch as needed)
const sampleProject = {
  name: 'Sample Project',
  image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  keyDetails: {
    location: 'Downtown',
    floors: 12,
    flatsPerFloor: 4,
    price: '₹1.2 Cr',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    status: 'Running',
  },
  amenities: {
    indoor: ['Gym', 'Club House', 'Indoor Games'],
    outdoor: ['Swimming Pool', 'Garden', 'Children Play Area'],
  },
  gallery: [
    'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  ],
  documents: [
    { name: 'Master Plan', url: '#' },
    { name: 'Site Plan', url: '#' },
    { name: 'Booking Form', url: '#' },
    { name: 'Brochure', url: '#' },
  ],
  location: {
    lat: 22.5726,
    lng: 88.3639,
  },
};

function MoreDetails({ onBack, projectId, allProjects }) {
  const project = allProjects.find(p => p.id === projectId);
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const gallery = project?.gallery || [];
  const nextImage = () => setGalleryIndex((galleryIndex + 1) % gallery.length);
  const prevImage = () => setGalleryIndex((galleryIndex - 1 + gallery.length) % gallery.length);

  if (!project) return <div>Project not found</div>;

  return (
    <div className="more-details-page">
      <header className="more-details-header">
        <button className="back-btn" onClick={onBack}>&larr; Back</button>
        <h1>{project.name}</h1>
      </header>
      <section className="project-image-section">
        <img src={project.image.startsWith('http') ? project.image : process.env.PUBLIC_URL + '/' + project.image} alt={project.name} className="main-project-image" />
      </section>
      <section className="key-details-section">
        <h2>Key Details</h2>
        <ul>
          <li><b>Location:</b> {project.location}</li>
          <li><b>Floors:</b> {project.floors}</li>
          <li><b>Flats per Floor:</b> {project.flatsPerFloor}</li>
          <li><b>Price:</b> {project.sellingPrice}</li>
          <li><b>Start Date:</b> {project.startDate}</li>
          <li><b>End Date:</b> {project.endDate}</li>
          <li><b>Status:</b> {project.status}</li>
        </ul>
      </section>
      <section className="amenities-section">
        <h2>Amenities</h2>
        <div className="amenities-row">
          <div className="amenities-col">
            <h3>Indoor</h3>
            <ul>
              {(project.amenities?.indoor || []).map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
          <div className="amenities-col">
            <h3>Outdoor</h3>
            <ul>
              {(project.amenities?.outdoor || []).map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>
      <section className="gallery-section">
        <h2>Gallery</h2>
        <div className="gallery-carousel">
          <button className="gallery-btn" onClick={prevImage}>&lt;</button>
          <img src={sampleProject.gallery[galleryIndex]} alt={`Gallery ${galleryIndex + 1}`} className="gallery-image" />
          <button className="gallery-btn" onClick={nextImage}>&gt;</button>
        </div>
        <div className="gallery-indicators">
          {sampleProject.gallery.map((img, idx) => (
            <span
              key={idx}
              className={idx === galleryIndex ? 'indicator active' : 'indicator'}
              onClick={() => setGalleryIndex(idx)}
            />
          ))}
        </div>
      </section>
      <section className="documents-section">
        <h2>Documents</h2>
        <ul>
          {sampleProject.documents.map((doc, idx) => (
            <li key={idx}><a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a></li>
          ))}
        </ul>
      </section>
      <section className="location-section">
        <h2>Location</h2>
        <div className="map-container">
          <iframe
            title="Google Map"
            width="100%"
            height="250"
            frameBorder="0"
            style={{ border: 0, borderRadius: '12px' }}
            src={`https://www.google.com/maps?q=${sampleProject.location.lat},${sampleProject.location.lng}&z=15&output=embed`}
            allowFullScreen
          ></iframe>
        </div>
      </section>
    </div>
  );
}

export default MoreDetails;
