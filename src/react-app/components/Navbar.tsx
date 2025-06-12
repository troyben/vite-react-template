import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/variables.css';
import '../styles/Navbar.css';
import '../styles/variables.css';
import '../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinks = [
    { 
      path: '/', 
      title: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3H8.5V10H3V3Z" fill="currentColor"/>
          <path d="M11.5 3H17V7H11.5V3Z" fill="currentColor"/>
          <path d="M11.5 10H17V17H11.5V10Z" fill="currentColor"/>
          <path d="M3 13H8.5V17H3V13Z" fill="currentColor"/>
        </svg>
      )
    },
    { 
      path: '/quotations', 
      title: 'Quotations',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H16C17.1 18 18 17.1 18 16V4C18 2.9 17.1 2 16 2Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 6H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 2V0.5C12 0.5 3.5 0.5 3.5 9" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 12.5C2 12.5 2 16 5.5 18H6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    { 
      path: '/clients', 
      title: 'Clients',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="7" width="14" height="9" rx="2" fill="currentColor"/>
          <rect x="7" y="3" width="6" height="4" rx="1" fill="#edeaff"/>
          <rect x="1" y="16" width="18" height="2" rx="1" fill="#d6d3fa"/>
        </svg>
      )
    },
    { 
      path: '/users', 
      title: 'Users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="3" fill="currentColor"/>
          <circle cx="13" cy="7" r="3" fill="currentColor" fillOpacity="0.6"/>
          <ellipse cx="10" cy="15" rx="7" ry="4" fill="#edeaff"/>
        </svg>
      )
    },
    { 
      path: '/settings', 
      title: 'Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16.1667 12.2333L14.8167 11.15C14.9 10.7667 14.95 10.3833 14.95 10C14.95 9.61667 14.9 9.23333 14.8167 8.85L16.1667 7.76667C16.3 7.65 16.35 7.46667 16.2667 7.31667L14.6 4.68333C14.5167 4.53333 14.3333 4.48333 14.1833 4.53333L12.6 5.03333C12.0833 4.63333 11.5167 4.31667 10.9 4.1L10.5833 2.43333C10.55 2.26667 10.4 2.16667 10.2333 2.16667H7.23333C7.06667 2.16667 6.91667 2.26667 6.88333 2.43333L6.56667 4.1C5.95 4.31667 5.38333 4.63333 4.86667 5.03333L3.28333 4.53333C3.13333 4.48333 2.95 4.53333 2.86667 4.68333L1.2 7.31667C1.11667 7.46667 1.16667 7.65 1.3 7.76667L2.65 8.85C2.56667 9.23333 2.51667 9.61667 2.51667 10C2.51667 10.3833 2.56667 10.7667 2.65 11.15L1.3 12.2333C1.16667 12.35 1.11667 12.5333 1.2 12.6833L2.86667 15.3167C2.95 15.4667 3.13333 15.5167 3.28333 15.4667L4.86667 14.9667C5.38333 15.3667 5.95 15.6833 6.56667 15.9L6.88333 17.5667C6.91667 17.7333 7.06667 17.8333 7.23333 17.8333H10.2333C10.4 17.8333 10.55 17.7333 10.5833 17.5667L10.9 15.9C11.5167 15.6833 12.0833 15.3667 12.6 14.9667L14.1833 15.4667C14.3333 15.5167 14.5167 15.4667 14.6 15.3167L16.2667 12.6833C16.35 12.5333 16.3 12.35 16.1667 12.2333ZM10 13C8.35 13 7 11.65 7 10C7 8.35 8.35 7 10 7C11.65 7 13 8.35 13 10C13 11.65 11.65 13 10 13Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="Logo" />
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navLinks.map((link) => (
              <li 
                key={link.path}
                className={isActive(link.path) ? 'active' : ''}
                onMouseEnter={() => setHoveredLink(link.path)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                <Link to={link.path}>
                  <div className="nav-icon">
                    {link.icon}
                  </div>
                  {hoveredLink === link.path && (
                    <div className="nav-tooltip">
                      {link.title}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="sidebar-bottom">
        <div className="user-menu-container">
          <div 
            className="user-avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f3f3fb',
              cursor: 'pointer'
            }}
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="#edeaff" />
                <circle cx="40" cy="32" r="14" fill="#7c5dfa" />
                <path d="M20 62c0-10.5 13-16 20-16s20 5.5 20 16" fill="#d6d3fa" />
                <circle cx="40" cy="32" r="10" fill="#edeaff" />
                <path d="M30 60c0-5.5 6.5-8 10-8s10 2.5 10 8" fill="#edeaff" />
              </svg>
            )}
          </div>
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <button className="user-menu-item" onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.3333 11.3333L14 8.66667M14 8.66667L11.3333 6M14 8.66667H6M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V4.66667C2 4.31305 2.14048 3.97391 2.39052 3.72386C2.64057 3.47381 2.97971 3.33333 3.33333 3.33333H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;