import React from 'react';

const Footer: React.FC = () => {
  const footerStyle = {
    backgroundColor: '#2d5a3d' ,
    color: 'black',
    padding: '40px 0 20px 0',
  };

  const logoSectionStyle = {
    marginBottom: '20px',
  };

  const logoStyle = {
    height: '40px',
    marginBottom: '15px',
  };

  const contactInfoStyle = {
    color: 'black',
    fontSize: '14px',
    marginBottom: '15px',
  };

  const socialIconsStyle = {
    color: 'color' ,
    fontSize: '18px',
    marginRight: '15px',
    textDecoration: 'none',
    transition: 'opacity 0.3s ease',
  };

  const footerLinksStyle = {
    marginBottom: '30px',
  };

  const footerLinkStyle = {
    color: '#2d5a3d',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'opacity 0.3s ease',
  };

  const copyrightStyle = {
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    paddingTop: '20px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#2d5a3d',
  };

  const handleLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.opacity = '0.7';
  };

  const handleLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <footer style={footerStyle}>
      <div className="container">
        <div className="row">
          <div className="col-lg-3 col-md-6 mb-4">
            <div style={logoSectionStyle}>
              <img 
                src="/PICTURES/Logo-hr.png" 
                alt="Aniko Logo" 
                className="img-fluid" 
                style={logoStyle}
              />
              <div style={contactInfoStyle}>
                Call us at<br />
                09 125 425 1234
              </div>
              <div>
                <a 
                  href="#" 
                  aria-label="Facebook" 
                  style={socialIconsStyle}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a 
                  href="#" 
                  aria-label="Instagram" 
                  style={socialIconsStyle}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a 
                  href="#" 
                  aria-label="YouTube" 
                  style={socialIconsStyle}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 mb-4">
            <div style={footerLinksStyle}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Home
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#about" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    About
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#features" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Feature
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#download" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Testimonial
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 mb-4">
            <div style={footerLinksStyle}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#download" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Download
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#why-aniko" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Why Aniko
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#team" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Team
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 mb-4">
            <div style={footerLinksStyle}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Location
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Contact Us
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div style={footerLinksStyle}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Privacy Policy
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={footerLinkStyle}
                    onMouseEnter={handleLinkHover}
                    onMouseLeave={handleLinkLeave}
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div style={copyrightStyle}>
              Copy Right 2025, Aniko
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;