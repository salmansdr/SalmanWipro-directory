import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import './Styles/MoreDetails.css';


function MoreDetails({ onBack, projectId, allProjects }) {
  const project = allProjects.find(p => (p._id || p.id) === projectId) || {};
  // Fallback for documents if missing
  const documents = project.projectdocuments && project.projectdocuments.length > 0
    ? project.projectdocuments
    : [
        { name: 'Master Plan', url: '#' },
        { name: 'Site Plan', url: '#' },
        { name: 'Booking Form', url: '#' },
        { name: 'Brochure', url: '#' }
      ];

  // Fallback for amenities if missing
  const amenities = Array.isArray(project.amenities) && project.amenities.length > 0
    ? project.amenities
    : [
        { type: 'indoor', items: ['Gym', 'Club House', 'Indoor Games'] },
        { type: 'outdoor', items: ['Swimming Pool', 'Garden', 'Children Play Area'] }
      ];


  // Fallback for gallery images if missing
  const gallery = (project && project.gallery && project.gallery.length > 0)
    ? project.gallery
    : [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Exterior view
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80', // Living room
        'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80', // Bedroom
        'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=800&q=80'  // Kitchen
      ];
  const [galleryIndex, setGalleryIndex] = React.useState(0);

  // State for map coordinates
  const [coords, setCoords] = React.useState({ lat: null, lng: null });

  // Helper to improve location string for geocoding
  function getGeoLocationString(location) {
    if (!location) return '';
    let loc = location;
   
    return loc;
  }

  // Fetch coordinates from Nominatim API when project changes
  React.useEffect(() => {
    const geoLocation = getGeoLocationString(project.location);
    if (geoLocation) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geoLocation)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setCoords({ lat: data[0].lat, lng: data[0].lon });
          } else {
            setCoords({ lat: null, lng: null });
          }
        })
        .catch(() => setCoords({ lat: null, lng: null }));
    }
  }, [project.location]);

  // Auto-rotate gallery images every 3 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setGalleryIndex(idx => (idx + 1) % gallery.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [gallery.length]);
  const nextImage = () => setGalleryIndex((galleryIndex + 1) % gallery.length);
  const prevImage = () => setGalleryIndex((galleryIndex - 1 + gallery.length) % gallery.length);

  if (!project) return <div>Project not found</div>;

  return (
    <Container className="more-details-page py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <Button variant="outline-secondary" className="back-btn" onClick={onBack}>&larr; Back</Button>
          <h3 className="mb-0 ms-3">{project.name}</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3">
              <Card className="mb-3">
                {(() => {
                  // Extract Project Image from projectdocuments array or use image property
                  let projectImage = project.image;
                  if (!projectImage && project.projectdocuments && Array.isArray(project.projectdocuments)) {
                    const imageDoc = project.projectdocuments.find(doc => doc.name === 'Project Image');
                    if (imageDoc && imageDoc.data) {
                      projectImage = imageDoc.data;
                    }
                  }
                  return projectImage ? (
                    <Card.Img 
                      variant="top" 
                      src={projectImage.startsWith('http') ? projectImage : (projectImage.startsWith('data:') ? projectImage : process.env.PUBLIC_URL + '/' + projectImage)} 
                      alt={project.name} 
                      className="main-project-image" 
                    />
                  ) : null;
                })()}
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Key Details</Card.Title>
                  <ul className="list-unstyled mb-0">
                    <li><b>Location:</b> {project.location}</li>
                    <li><b>Floors:</b> {project.floors}</li>
                    <li><b>Flats per Floor:</b> {project.flatsPerFloor}</li>
                    <li><b>Price:</b> {project.sellingPrice}</li>
                    <li><b>Start Date:</b> {project.startDate}</li>
                    <li><b>End Date:</b> {project.endDate}</li>
                    <li><b>Status:</b> {project.status}</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Amenities</Card.Title>
                  <Row>
                    {amenities.map((group, idx) => (
                      <Col key={group.type || idx}>
                        <h6>{group.type ? group.type.charAt(0).toUpperCase() + group.type.slice(1) : ''}</h6>
                        <ul className="list-unstyled">
                          {group.items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Gallery</Card.Title>
                  <div className="gallery-carousel-wrapper position-relative d-flex justify-content-center mb-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <Button
                      variant="outline-primary"
                      className="gallery-btn gallery-btn-left position-absolute"
                      style={{ top: '50%', left: '-32px', transform: 'translateY(-50%)' }}
                      onClick={prevImage}
                    >&lt;</Button>
                    <img
                      src={gallery[galleryIndex]}
                      alt={`Gallery ${galleryIndex + 1}`}
                      className="gallery-image rounded"
                      style={{ maxHeight: '220px', maxWidth: '100%', display: 'block' }}
                    />
                    <Button
                      variant="outline-primary"
                      className="gallery-btn gallery-btn-right position-absolute"
                      style={{ top: '50%', right: '-32px', transform: 'translateY(-50%)' }}
                      onClick={nextImage}
                    >&gt;</Button>
                  </div>
                  <div className="gallery-indicators d-flex justify-content-center">
                    {gallery.map((img, idx) => (
                      <span
                        key={idx}
                        className={idx === galleryIndex ? 'indicator active mx-1' : 'indicator mx-1'}
                        style={{ cursor: 'pointer', width: 12, height: 12, borderRadius: '50%', background: idx === galleryIndex ? '#1976d2' : '#e0e0e0', display: 'inline-block' }}
                        onClick={() => setGalleryIndex(idx)}
                      />
                    ))}
                  </div>
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Documents</Card.Title>
                  <div className="d-flex flex-wrap gap-2">
                    {documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        className="btn btn-outline-primary"
                        style={{ minWidth: '120px', textAlign: 'center' }}
                        download
                        onClick={e => {
                          // Only trigger download if url is not '#'
                          if (!doc.url || doc.url === '#') {
                            e.preventDefault();
                            alert('No document available for download.');
                          }
                        }}
                      >
                        {doc.name}
                        <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9V14a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9.9a.5.5 0 0 0-1 0V14a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 .5 14V9.9a.5.5 0 0 0-1 0z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                          </svg>
                        </span>
                      </a>
                    ))}
                  </div>
                </Card.Body>
              </Card>
              {/* Virtual Tours Section */}
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Virtual Tours</Card.Title>
                  <div className="mb-3">
                    <strong>360° Walkthrough & Video Tour</strong>
                    <div className="ratio ratio-16x9 mt-2 mb-2" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(33,150,243,0.08)' }}>
                      <iframe
                        src="https://www.youtube.com/embed/1La4QzGeaaQ"
                        title="360° Virtual Tour Demo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ width: '100%', height: '100%', border: 0 }}
                      ></iframe>
                    </div>
                    <div className="mt-2">
                      <a href="https://arvr.google.com/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">Try Augmented Reality (AR) Demo</a>
                    </div>
                  </div>
                  <div className="text-secondary small">Experience immersive 360° walkthroughs and AR for your future home.</div>
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Location</Card.Title>
                  <div className="map-container">
                    {coords.lat && coords.lng ? (
                      <iframe
                        title="Google Map"
                        width="100%"
                        height="180"
                        frameBorder="0"
                        style={{ border: 0, borderRadius: '12px' }}
                        src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                        Map not available for this location
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default MoreDetails;
