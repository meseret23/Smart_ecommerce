
import { NavLink, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  cartCount?: number;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onLogout?: () => void;
}

function Navbar({
  cartCount = 0,
  user = null,
  searchQuery = '',
  onSearchChange,
  onLogout,
}: NavbarProps) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="navbar">
      <NavLink to="/" className="logo">
        Smart<span>Market</span>
      </NavLink>

      <nav className="nav-links">
        {isAdmin ? (
          <>
            <NavLink to="/admin" end>Dashboard</NavLink>
            <NavLink to="/admin/products">Manage Products</NavLink>
            <NavLink to="/admin/reports">Manage Reports</NavLink>
          </>
        ) : (
         <>
  <NavLink to="/">Home</NavLink>
  <NavLink to="/products">Shop</NavLink>
  {user && <NavLink to="/orders">My Orders</NavLink>}
  {user && <NavLink to="/my-reviews">My Reviews</NavLink>}
  {user && <NavLink to="/reports">My Reports</NavLink>}
</>
        )}
      </nav>

      <div className="navbar-actions">
        {!isAdmin && (
          <div className="nav-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Search products"
            />
          </div>
        )}

        {user && (
          <div className="navbar-notification">
            <NotificationBell />
          </div>
        )}

        {user ? (
          <div className="nav-account">
            <NavLink
              to={isAdmin ? '/admin' : '/profile'}
              className="account-link"
            >
              {user.name || 'My Account'}
            </NavLink>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="login-link">
            Sign in
          </NavLink>
        )}

        {!isAdmin && (
          <button
            type="button"
            className="cart-button"
            onClick={() => navigate('/cart')}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            Cart <span className="cart-count">{cartCount}</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
