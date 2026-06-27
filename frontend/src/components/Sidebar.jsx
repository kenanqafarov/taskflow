import React from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  MessageSquare, 
  Video, 
  Bell, 
  Shield, 
  LogOut, 
  Zap,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentView, setView }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'boards', label: 'Boards', icon: CheckCircle2 },
    { id: 'chat', label: 'Chat Rooms', icon: MessageSquare },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // If SUPER_ADMIN, show Admin panel link
  if (user.role === 'SUPER_ADMIN') {
    items.splice(4, 0, { id: 'admin', label: 'User Admin', icon: Shield });
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <Zap /> TaskFlow
      </div>
      
      <nav>
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button 
              key={item.id} 
              className={currentView === item.id ? 'active' : ''} 
              onClick={() => setView(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
