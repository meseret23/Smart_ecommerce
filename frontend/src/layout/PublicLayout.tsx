import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface PublicLayoutProps {
  user?: {
    full_name?: string;
    email?: string;
    role?: string;
  } | null;
  cartCount?: number;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onLogout?: () => void;
}

function PublicLayout({
  user = null,
  cartCount = 0,
  searchQuery = '',
  onSearchChange,
  onLogout,
}: PublicLayoutProps) {
  return (
    <div className="app">
      <Navbar
        user={
          user
            ? {
                name: user.full_name,
                email: user.email,
                role: user.role,
              }
            : null
        }
        cartCount={cartCount}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onLogout={onLogout}
      />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;