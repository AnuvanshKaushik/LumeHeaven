import { Link } from "react-router-dom";
import NewsletterForm from "./NewsletterForm";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>DRTS</h3>
          <p>Luxury jewellery crafted with timeless artistry and modern elegance.</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>Email:varunkashyap2811@gmail.com</p>
          <p>Phone: +91 96672 81129</p>
          <p>Delhi, India</p>
        </div>
        <div>
          <h4>Follow</h4>
          <div className="social-row">
            <a href="https://www.instagram.com/lumeheaven/" aria-label="Instagram">
              Instagram
            </a>
            {/* <a href="#" aria-label="Facebook">
            </a>
            <a href="#" aria-label="Pinterest">
            </a> */}
          </div>
        </div>
        <div>
          <h4>Newsletter</h4>
          <NewsletterForm placeholder="Your email" />
        </div>
      </div>
      <p className="copyright">&copy; {new Date().getFullYear()} DRTS. All rights reserved.</p>
      <div className="footer-links">
        <Link to="/products">Shop</Link>
        <Link to="/customer-auth">Customer Login</Link>
        <Link to="/manager-login">Manager Login</Link>
      </div>
    </footer>
  );
};

export default Footer;
