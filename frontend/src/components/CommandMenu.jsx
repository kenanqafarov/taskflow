import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutDashboard, CheckCircle2, MessageSquare, Video, Settings, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommandMenu({ isOpen, onClose, setView }) {
  const { user, API_URL, token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Built-in navigation options
  const defaultActions = [
    { type: 'navigation', label: 'Go to Dashboard', target: 'dashboard', icon: LayoutDashboard },
    { type: 'navigation', label: 'Go to Kanban Board', target: 'boards', icon: CheckCircle2 },
    { type: 'navigation', label: 'Go to Chat Rooms', target: 'chat', icon: MessageSquare },
    { type: 'navigation', label: 'Go to Video Meetings', target: 'meetings', icon: Video },
    { type: 'navigation', label: 'Go to Notification Center', target: 'notifications', icon: Bell },
    { type: 'navigation', label: 'Go to Settings', target: 'settings', icon: Settings },
  ];

  // Fetch search items from backend (boards/tasks)
  useEffect(() => {
    if (!isOpen || query.trim() === '') {
      setResults(defaultActions);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // Fetch tasks & boards
        const headers = { 'Authorization': `Bearer ${token}` };
        const [boardsRes, tasksRes] = await Promise.all([
          fetch(`${API_URL}/api/boards`, { headers }),
          fetch(`${API_URL}/api/tasks`, { headers })
        ]);

        let matched = [];

        if (boardsRes.ok) {
          const boards = await boardsRes.json();
          const filtered = boards.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
          matched.push(...filtered.map(b => ({
            type: 'board',
            label: `Board: ${b.name}`,
            id: b.id,
            icon: CheckCircle2
          })));
        }

        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          const filtered = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
          matched.push(...filtered.map(t => ({
            type: 'task',
            label: `Task: ${t.title}`,
            id: t.id,
            boardId: t.board?.id,
            icon: CheckCircle2
          })));
        }

        // Add matching navigation actions
        const matchedActions = defaultActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
        
        setResults([...matched, ...matchedActions]);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  // Handle keys (Up/Down arrows, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (item) => {
    onClose();
    if (item.type === 'navigation') {
      setView(item.target);
    } else if (item.type === 'board') {
      // Set to boards view and store active board id
      localStorage.setItem('taskflow_active_board_id', item.id);
      setView('boards');
      // Dispatch custom event to trigger Board detail load if already in boards view
      window.dispatchEvent(new CustomEvent('load_board', { detail: { id: item.id } }));
    } else if (item.type === 'task') {
      localStorage.setItem('taskflow_active_board_id', item.boardId);
      setView('boards');
      window.dispatchEvent(new CustomEvent('load_board', { detail: { id: item.boardId, openTaskId: item.id } }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-menu-overlay" onClick={onClose}>
      <div className="command-menu glassmorphic" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="esc-hint">ESC</span>
        </div>

        <div className="command-results">
          {results.length === 0 ? (
            <div className="no-results">No results matching "{query}"</div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {idx === selectedIndex && <span className="action-hint">Enter</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
