import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id?: number;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  if (!user) {
    return (
      <section className="profile-page">
        <h1>My Profile</h1>
        <p>Please sign in to view your profile.</p>
        <button onClick={() => navigate('/login')}>Sign In</button>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-header">
        <span className="profile-avatar">
          {user.full_name?.charAt(0).toUpperCase() || 'U'}
        </span>
        <div>
          <h1>{user.full_name || 'My Account'}</h1>
          <p>Manage your account information</p>
        </div>
      </div>

      <div className="profile-card">
        <h2>Personal Information</h2>

        <div className="profile-field">
          <span>Full Name</span>
          <strong>{user.full_name || 'Not provided'}</strong>
        </div>

        <div className="profile-field">
          <span>Email Address</span>
          <strong>{user.email || 'Not provided'}</strong>
        </div>

        <div className="profile-field">
          <span>Phone Number</span>
          <strong>{user.phone || 'Not provided'}</strong>
        </div>

        <div className="profile-field">
          <span>Account Type</span>
          <strong>{user.role || 'Customer'}</strong>
        </div>
      </div>

      <div className="profile-actions">
        <button onClick={() => navigate('/orders')}>
          View My Orders
        </button>
        <button onClick={() => navigate('/reports')}>
          My Reports
        </button>
      </div>
    </section>
  );
}

export default Profile;