import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Building2, Users, PenTool, Settings, CircleUser, LogOut } from 'lucide-react';
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
    ...(user?.role === 'admin' ? [{ 
      path: '/', 
      title: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    }] : []),
    { 
      path: '/quotations', 
      title: 'Quotations',
      icon: <FileText className="w-5 h-5" />
    },
    { 
      path: '/clients', 
      title: 'Clients',
      icon: <Building2 className="w-5 h-5" />
    },
    ...(user?.role === 'admin' ? [{ 
      path: '/users', 
      title: 'Users',
      icon: <Users className="w-5 h-5" />
    }] : []),
    { 
      path: '/canvas', 
      title: 'Canvas Editor',
      icon: <PenTool className="w-5 h-5" />
    },
    { 
      path: '/settings', 
      title: 'Settings',
      icon: <Settings className="w-5 h-5" />
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
              <CircleUser className="w-10 h-10" style={{ color: '#7c5dfa' }} />
            )}
          </div>
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <button className="user-menu-item" onClick={logout}>
                <LogOut className="w-4 h-4" />
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