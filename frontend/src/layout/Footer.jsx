import React from 'react';

const Footer = () => {
  return (
    <footer className="main-footer no-print">
      <div className="footer-content">
        <span>© {new Date().getFullYear()} Voltaic Cable Enterprise • Smart Manufacturing Suite</span>
        <div className="footer-links">
          <span>Support</span>
          <span className="dot-divider">•</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
