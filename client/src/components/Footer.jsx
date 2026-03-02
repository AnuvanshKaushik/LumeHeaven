import { Link } from "react-router-dom";
import NewsletterForm from "./NewsletterForm";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>LUMEHEAVEN</h3>
          <p>Luxury jewellery crafted with timeless artistry and modern elegance.</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>Email: care@lumeheaven.com</p>
          <p>Phone: +91 90000 11111</p>
          <p>Mumbai, India</p>
        </div>
        <div>
          <h4>Follow</h4>
          <div className="social-row">
            <a href="#" aria-label="Instagram">
              IG
            </a>
            <a href="#" aria-label="Facebook">
              FB
            </a>
            <a href="#" aria-label="Pinterest">
              PT
            </a>
          </div>
        </div>
        <div>
          <h4>Newsletter</h4>
          <NewsletterForm placeholder="Your email" />
        </div>
      </div>
      <p className="copyright">&copy; {new Date().getFullYear()} LUMEHEAVEN. All rights reserved.</p>
      <div className="footer-links">
        <Link to="/products">Shop</Link>
        <Link to="/customer-auth">Customer Login</Link>
        <Link to="/manager-login">Manager Login</Link>
      </div>
    </footer>
  );
};

export default Footer;
