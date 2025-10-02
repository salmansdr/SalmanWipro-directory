import React from 'react';

function About() {
  return (
    <div className="container py-4">
      {/* Company Overview */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#eaf2fb' }}>
        <h2 className="text-primary mb-3">Company Overview</h2>
        <div className="row align-items-center">
          <div className="col-md-8">
            <p><strong>Founded:</strong> 2005</p>
            <p><strong>Mission:</strong> To deliver innovative, sustainable, and high-quality construction solutions.</p>
            <p><strong>Vision:</strong> To be the most trusted name in real estate development.</p>
            <ul className="list-unstyled mt-3">
              <li><span className="badge bg-primary me-2">Integrity</span> <span className="badge bg-success me-2">Innovation</span> <span className="badge bg-info">Sustainability</span></li>
            </ul>
          </div>
          <div className="col-md-4 text-center">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Metro_City_Homes.PNG'} alt="Company" className="img-fluid rounded shadow" style={{ maxHeight: 120 }} />
          </div>
        </div>
      </section>

      {/* Leadership & Team Introduction */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#f8f9fa' }}>
        <h2 className="text-primary mb-3">Leadership & Team</h2>
        <div className="row g-4">
          <div className="col-md-3 text-center">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Skyline_Heights.PNG'} alt="CEO" className="img-fluid rounded-circle mb-2" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            <h5 className="mb-1">Reza Kawsar</h5>
            <p className="text-muted small">CEO, PMP, 20+ yrs experience</p>
          </div>
          <div className="col-md-3 text-center">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Garden_Estate.PNG'} alt="CTO" className="img-fluid rounded-circle mb-2" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            <h5 className="mb-1">Reza Kawsar</h5>
            <p className="text-muted small">CTO, LEED AP, 15+ yrs experience</p>
          </div>
          <div className="col-md-3 text-center">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Hilltop_Villas.PNG'} alt="Project Manager" className="img-fluid rounded-circle mb-2" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            <h5 className="mb-1">Priya Sharma</h5>
            <p className="text-muted small">Project Manager, Civil Engg.</p>
          </div>
          <div className="col-md-3 text-center">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Lakeview_Apartments.PNG'} alt="Architect" className="img-fluid rounded-circle mb-2" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            <h5 className="mb-1">Ravi Verma</h5>
            <p className="text-muted small">Lead Architect, M.Arch</p>
          </div>
        </div>
        <div className="mt-3 text-center text-secondary">Our collaborative, client-first culture drives every project to success.</div>
      </section>

      {/* Project Portfolio Highlights */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#eaf2fb' }}>
        <h2 className="text-primary mb-3">Project Portfolio Highlights</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Sunrise_Residency.PNG'} alt="Sunrise Residency" className="img-fluid rounded shadow mb-2" />
            <h6>Sunrise Residency</h6>
            <p className="small">2020-2023 | 120 units | Green Building Award</p>
          </div>
          <div className="col-md-4">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Oceanic_Towers.PNG'} alt="Oceanic Towers" className="img-fluid rounded shadow mb-2" />
            <h6>Oceanic Towers</h6>
            <p className="small">2018-2021 | 200 units | Landmark Project</p>
          </div>
          <div className="col-md-4">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Green_Valley_Residency.PNG'} alt="Green Valley" className="img-fluid rounded shadow mb-2" />
            <h6>Green Valley Residency</h6>
            <p className="small">2016-2019 | 80 units | Sustainability Award</p>
          </div>
        </div>
        <div className="mt-3 text-end">
          <a href="#portfolio" className="btn btn-outline-primary btn-sm">View Full Portfolio</a>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#f8f9fa' }}>
        <h2 className="text-primary mb-3">Client Testimonials</h2>
        <div className="row g-4">
          <div className="col-md-6">
            <blockquote className="blockquote border-start border-3 ps-3 mb-0" style={{ borderColor: '#003366' }}>
              <p>"BuildPro exceeded our expectations in every way. On-time delivery and top-notch quality!"</p>
              <footer className="blockquote-footer">Amit Gupta, Sunrise Residency</footer>
            </blockquote>
          </div>
          <div className="col-md-6">
            <blockquote className="blockquote border-start border-3 ps-3 mb-0" style={{ borderColor: '#003366' }}>
              <p>"Professional, transparent, and innovative. Highly recommended for any real estate project."</p>
              <footer className="blockquote-footer">Neha Jain, Oceanic Towers</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Licenses, Certifications & Awards */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#eaf2fb' }}>
        <h2 className="text-primary mb-3">Licenses, Certifications & Awards</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="bg-white rounded p-3 shadow-sm text-center">
              <span className="fw-bold text-success">ISO 9001:2015</span>
              <div className="small text-muted">Quality Management</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white rounded p-3 shadow-sm text-center">
              <span className="fw-bold text-info">LEED Gold</span>
              <div className="small text-muted">Green Building</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white rounded p-3 shadow-sm text-center">
              <span className="fw-bold text-warning">RERA Registered</span>
              <div className="small text-muted">Real Estate Regulatory</div>
            </div>
          </div>
        </div>
        <div className="mt-3 text-end">
          <span className="badge bg-success me-2">Best Developer 2023</span>
          <span className="badge bg-primary">Sustainability Award</span>
        </div>
      </section>

      {/* Community Engagement */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#f8f9fa' }}>
        <h2 className="text-primary mb-3">Community Engagement</h2>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="bg-white rounded p-3 shadow-sm">
              <h6 className="text-success">CSR Initiatives</h6>
              <p className="mb-0">Annual blood donation camps, local school sponsorships, and skill development workshops.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="bg-white rounded p-3 shadow-sm">
              <h6 className="text-info">Sustainability Efforts</h6>
              <p className="mb-0">Rainwater harvesting, solar panels, and eco-friendly construction materials.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="mb-5 p-4 rounded shadow-sm" style={{ background: '#eaf2fb' }}>
        <h2 className="text-primary mb-3">Why Choose Us</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="bg-white rounded p-3 shadow-sm text-center">
              <span className="fw-bold text-primary">On-Time Delivery</span>
              <div className="small text-muted">98% projects delivered before deadline</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white rounded p-3 shadow-sm text-center">
              <span className="fw-bold text-success">Design Excellence</span>
              <div className="small text-muted">Award-winning architects & engineers</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white rounded p-3 shadow-sm text-center">
              <span className="fw-bold text-info">Client-First Approach</span>
              <div className="small text-muted">Personalized service & transparency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visuals & Branding */}
      <section className="mb-4 p-4 rounded shadow-sm" style={{ background: '#f8f9fa' }}>
        <h2 className="text-primary mb-3">Visuals & Branding</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Metro_City_Homes.PNG'} alt="Office" className="img-fluid rounded shadow" />
          </div>
          <div className="col-md-4">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Riverfront_Residency.PNG'} alt="Team" className="img-fluid rounded shadow" />
          </div>
          <div className="col-md-4">
            <img src={process.env.PUBLIC_URL + '/ConstructionImage/Skyline_Heights.PNG'} alt="Site" className="img-fluid rounded shadow" />
          </div>
        </div>
        <div className="mt-3 text-secondary text-center">Consistent colors, fonts, and tone reflect our brand identity.</div>
      </section>
    </div>
  );
}

export default About;
