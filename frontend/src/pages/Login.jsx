import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { login, theme, toggleTheme } = useAuth();
  const [username, setUsername] = useState('super_admin');
  const [password, setPassword] = useState('super1234!');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
  };

  return (
    <main className={`login-screen ${theme}`}>
      <div className="login-art">
        <div className="brand-mark">
          <Sparkles size={26} /> TaskFlow
        </div>
        <h1>Plan, chat, meet, and ship from one command center.</h1>
        <p>
          A premium project collaboration suite styled with high-fidelity Web3 aesthetics.
          Kanban boards, real-time channels, video calls, notifications, and granular administration controls.
        </p>
        <div className="orbit">
          <span>Kanban</span>
          <span>Chat</span>
          <span>Meet</span>
          <span>Push</span>
        </div>
      </div>

      <form className="login-panel glassmorphic" onSubmit={handleSubmit}>
        <button 
          type="button" 
          className="icon-button theme-toggle" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to access your platform dashboard</p>

        <label>
          Username
          <input 
            type="text"
            required
            placeholder="Enter username or email"
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
        </label>

        <label>
          Password
          <input 
            type="password" 
            required
            placeholder="••••••••"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </label>

        <label className="check">
          <input 
            type="checkbox" 
            checked={rememberMe} 
            onChange={e => setRememberMe(e.target.checked)} 
          /> 
          <span>Remember me on this device</span>
        </label>

        <button className="primary-button" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign in to TaskFlow'}
        </button>

        <div className="hint-box">
          <strong>Seed Accounts:</strong>
          <ul>
            <li><code>super_admin</code> / <code>super1234!</code> (Super Admin)</li>
            <li><code>admin</code> / <code>admin1234!</code> (Admin)</li>
            <li><code>member</code> / <code>member1234!</code> (Member)</li>
          </ul>
        </div>
      </form>
    </main>
  );
}
