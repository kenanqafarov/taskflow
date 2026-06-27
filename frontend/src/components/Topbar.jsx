import React, { useState } from 'react';
import { Search, Command, Sun, Moon, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ setView, onSearchClick }) {
  const { user, theme, toggleTheme, notifications, markNotificationRead } = useAuth();
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  if (!user) return null;

  const unreadNotifications = notifications.filter(n => !n.readByUser);
  const displayNotifications = notifications.slice(0, 5); // show last 5

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    setShowBellDropdown(false);
    setView('notifications');
  };

  const getInitials = () => {
    if (user.name) return user.name.slice(0, 2).toUpperCase();
    return user.username.slice(0, 2).toUpperCase();
  };

  return (
    <header className="topbar">
      <div className="search" onClick={onSearchClick}>
        <Search size={18} />
        <input placeholder="Search tasks, boards, people (Ctrl+K)" readOnly />
      </div>

      <button className="command" onClick={onSearchClick} aria-label="Open command menu">
        <Command size={16} />K
      </button>

      <button 
        className="icon-button theme-toggle" 
        onClick={toggleTheme}
        aria-label="Toggle visual theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="bell-container">
        <button 
          className={`icon-button bell-btn ${unreadNotifications.length > 0 ? 'pulse' : ''}`}
          onClick={() => setShowBellDropdown(!showBellDropdown)}
          aria-label="View alerts"
        >
          <Bell size={18} />
          {unreadNotifications.length > 0 && (
            <span className="badge">{unreadNotifications.length}</span>
          )}
        </button>

        {showBellDropdown && (
          <div className="bell-dropdown glassmorphic">
            <div className="dropdown-header">
              <h3>Recent Notifications</h3>
              <button onClick={() => setView('notifications')}>View all</button>
            </div>
            <div className="dropdown-body">
              {displayNotifications.length === 0 ? (
                <div className="empty-state">No new alerts</div>
              ) : (
                displayNotifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`dropdown-item ${!n.readByUser ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="item-title">
                      <Sparkles size={14} />
                      <strong>{n.title}</strong>
                    </div>
                    <p>{n.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="user-profile" onClick={() => setView('profile')}>
        {user.profilePicture ? (
          <img src={user.profilePicture} alt="Profile" className="user-avatar" />
        ) : (
          <div className="avatar">{getInitials()}</div>
        )}
        <div className="profile-meta">
          <span className="username">{user.username}</span>
          <span className="role">{user.role.replace('ROLE_', '').replace('_', ' ')}</span>
        </div>
      </div>
    </header>
  );
}
