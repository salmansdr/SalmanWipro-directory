import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
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
  const project = allProjects.find(p => p.id === projectId) || {};
  // Fallback for documents if missing
  const documents = project.documents && project.documents.length > 0
    ? project.documents
    : [
        { name: 'Master Plan', url: '#' },
        { name: 'Site Plan', url: '#' },
        { name: 'Booking Form', url: '#' },
        { name: 'Brochure', url: '#' }
      ];

  // Fallback for amenities if missing
  const amenities = project.amenities || {
    indoor: ['Gym', 'Club House', 'Indoor Games'],
    outdoor: ['Swimming Pool', 'Garden', 'Children Play Area']
  };
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  // Fallback for gallery images if missing
  const gallery = (project && project.gallery && project.gallery.length > 0)
    ? project.gallery
    : [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Exterior view
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80', // Living room
        'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80', // Bedroom
        'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=800&q=80'  // Kitchen
      ];
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
                <Card.Img variant="top" src={project.image.startsWith('http') ? project.image : process.env.PUBLIC_URL + '/' + project.image} alt={project.name} className="main-project-image" />
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
                    <Col>
                      <h6>Indoor</h6>
                      <ul className="list-unstyled">
                        {amenities.indoor.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </Col>
                    <Col>
                      <h6>Outdoor</h6>
                      <ul className="list-unstyled">
                        {amenities.outdoor.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Gallery</Card.Title>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <Button variant="outline-primary" className="gallery-btn me-2" onClick={prevImage}>&lt;</Button>
                    <img src={gallery[galleryIndex]} alt={`Gallery ${galleryIndex + 1}`} className="gallery-image rounded" style={{ maxHeight: '220px', maxWidth: '100%' }} />
                    <Button variant="outline-primary" className="gallery-btn ms-2" onClick={nextImage}>&gt;</Button>
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary"
                        download
                        style={{ minWidth: '120px', textAlign: 'center' }}
                      >
                        {doc.name}
                      </a>
                    ))}
                  </div>
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Location</Card.Title>
                  <div className="map-container">
                    <iframe
                      title="Google Map"
                      width="100%"
                      height="180"
                      frameBorder="0"
                      style={{ border: 0, borderRadius: '12px' }}
                      src={`https://www.google.com/maps?q=${project.location?.lat},${project.location?.lng}&z=15&output=embed`}
                      allowFullScreen
                    ></iframe>
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
