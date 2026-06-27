import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('taskflow_token') || null);
  const [theme, setTheme] = useState(localStorage.getItem('taskflow_theme') || 'dark');
  const [notifications, setNotifications] = useState([]);
  const [wsClient, setWsClient] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notifier helper
  const showToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Toggle theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('taskflow_theme', nextTheme);
  };

  // Fetch current user details
  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        fetchNotifications(authToken, userData.id);
        connectWebSocket(userData.id);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      logout();
    }
  };

  // Fetch notifications
  const fetchNotifications = async (authToken, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark single notification as read
  const markNotificationRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readByUser: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications read
  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, readByUser: true })));
        showToast("Success", "All notifications marked as read", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Connect WebSocket
  const connectWebSocket = (userId) => {
    // Disconnect old if exists
    if (wsClient) {
      wsClient.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to WebSocket STOMP broker');
      
      // Subscribe to user notifications
      client.subscribe(`/topic/notifications/${userId}`, (message) => {
        const notification = JSON.parse(message.body);
        setNotifications(prev => [notification, ...prev]);
        showToast(notification.title, notification.body, 'info');
      });

      // Subscribe to global meetings channel
      client.subscribe('/topic/meetings', (message) => {
        const meeting = JSON.parse(message.body);
        showToast("New Meeting Room", `"${meeting.title}" has been started!`, 'success');
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();
    setWsClient(client);
  };

  // Login handler
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem('taskflow_token', data.token);
      setToken(data.token);
      await fetchCurrentUser(data.token);
      showToast("Signed In", `Welcome back to TaskFlow`, "success");
      return true;
    } catch (error) {
      showToast("Authentication Failed", error.message, "error");
      return false;
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('taskflow_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    if (wsClient) {
      wsClient.deactivate();
      setWsClient(null);
    }
    showToast("Signed Out", "You have successfully logged out", "info");
  };

  // Initial user fetch if token is available
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    }
  }, [token]);

  // Sync index.html body classes with theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const value = {
    user,
    token,
    theme,
    toggleTheme,
    login,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    wsClient,
    toasts,
    showToast,
    removeToast,
    API_URL
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
