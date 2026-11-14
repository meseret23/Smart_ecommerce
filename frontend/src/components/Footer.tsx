
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="logo">
            Smart<span>Market</span>
          </Link>
          <p>
            Discover quality products and enjoy a simpler shopping
            experience with SmartMarket.
          </p>
        </div>

        <div className="footer-links">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/cart">Shopping Cart</Link>
        </div>

        <div className="footer-links">
          <h3>Account</h3>
          <Link to="/login">Sign In</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/profile">My Profile</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SmartMarket. All rights reserved.</p>
        <span>Made for a better shopping experience.</span>
      </div>
    </footer>
  );
}

export default Footer;
