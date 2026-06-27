import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, Archive, ArrowLeft, ArrowRight, Bell, CalendarDays, Camera, Check, CheckCircle2,
  ChevronDown, Circle, Clock3, Command, Copy, Ellipsis, ExternalLink, FileText, Filter,
  Gauge, Grid2X2, Hash, Headphones, Inbox, Kanban, LayoutDashboard,
  ListFilter, LogOut, Menu, MessageCircle, MessageSquare, Mic, MicOff, Moon, MoreHorizontal,
  Paperclip, PhoneOff, Plus, Radio, Search, Send, Settings, ShieldCheck, Sparkles,
  Sun, Tag, Target, Trash2, TrendingUp, UserPlus, Users, Video, VideoOff, WandSparkles,
  X, Zap
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const avatar = (name, hue = 150) => `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=${hue === 150 ? 'd1fae5' : hue === 260 ? 'ede9fe' : 'fee2e2'}`;

const USERS = [
  { id: 1, name: 'Alex Morgan', username: 'super_admin', role: 'SUPER_ADMIN', title: 'Workspace owner', status: 'Active', avatar: avatar('Alex', 150) },
  { id: 2, name: 'Maya Chen', username: 'maya.chen', role: 'ADMIN', title: 'Product designer', status: 'Active', avatar: avatar('Maya', 260) },
  { id: 3, name: 'Jordan Lee', username: 'jordan.lee', role: 'MEMBER', title: 'Frontend engineer', status: 'Active', avatar: avatar('Jordan', 20) },
  { id: 4, name: 'Nora Malik', username: 'nora.malik', role: 'MEMBER', title: 'Growth strategist', status: 'Active', avatar: avatar('Nora', 260) },
  { id: 5, name: 'Sam Rivera', username: 'sam.rivera', role: 'MEMBER', title: 'QA engineer', status: 'Away', avatar: avatar('Sam', 20) },
];

const INITIAL_TASKS = [
  { id: 1, title: 'Finalize Q3 launch narrative', description: 'Align product story, launch beats and channel owners.', status: 'todo', priority: 'HIGH', due: 'Today', project: 'Website 2.0', tags: ['Strategy'], assignees: [USERS[1], USERS[3]], comments: 8, files: 3, code: 'TF-128' },
  { id: 2, title: 'Build pricing comparison section', description: 'Implement responsive pricing matrix from latest Figma.', status: 'todo', priority: 'MEDIUM', due: 'Jun 29', project: 'Website 2.0', tags: ['Frontend'], assignees: [USERS[2]], comments: 4, files: 1, code: 'TF-131' },
  { id: 3, title: 'Audit onboarding friction', description: 'Review first session recordings and group findings.', status: 'progress', priority: 'CRITICAL', due: 'Tomorrow', project: 'Product Core', tags: ['Research'], assignees: [USERS[1], USERS[4]], comments: 12, files: 2, code: 'TF-122' },
  { id: 4, title: 'Add command palette actions', description: 'Connect quick actions to global workspace navigation.', status: 'progress', priority: 'MEDIUM', due: 'Jul 01', project: 'Product Core', tags: ['Product'], assignees: [USERS[2]], comments: 5, files: 0, code: 'TF-135' },
  { id: 5, title: 'Review lifecycle email copy', description: 'Final copy pass before automation handoff.', status: 'review', priority: 'HIGH', due: 'Jun 28', project: 'Growth Engine', tags: ['Marketing'], assignees: [USERS[3]], comments: 9, files: 4, code: 'TF-119' },
  { id: 6, title: 'Mobile dashboard QA', description: 'Regression pass across primary phone breakpoints.', status: 'review', priority: 'LOW', due: 'Jul 02', project: 'Website 2.0', tags: ['QA'], assignees: [USERS[4]], comments: 3, files: 1, code: 'TF-137' },
  { id: 7, title: 'Create brand motion kit', description: 'Reusable motion language for marketing surfaces.', status: 'done', priority: 'MEDIUM', due: 'Jun 25', project: 'Website 2.0', tags: ['Design'], assignees: [USERS[1]], comments: 7, files: 6, code: 'TF-110' },
];

const NAV = [
  ['/', LayoutDashboard, 'Overview'],
  ['/boards', Kanban, 'Projects'],
  ['/tasks', CheckCircle2, 'My tasks'],
  ['/chat', MessageSquare, 'Messages'],
  ['/meetings', Video, 'Meetings'],
  ['/notifications', Bell, 'Inbox'],
];

const safeJson = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };

function App() {
  const [session, setSession] = useState(() => safeJson(localStorage.getItem('taskflow_session'), null));
  const [theme, setTheme] = useState(() => localStorage.getItem('taskflow_theme') || 'dark');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [users, setUsers] = useState(USERS);
  const [notices, setNotices] = useState([
    { id: 1, text: 'Maya moved “Lifecycle email copy” to Review', time: '8 min', unread: true, icon: CheckCircle2 },
    { id: 2, text: 'Jordan mentioned you in #website-redesign', time: '24 min', unread: true, icon: MessageCircle },
    { id: 3, text: 'Daily product sync starts in 15 minutes', time: '45 min', unread: true, icon: Video },
  ]);
  const [toast, setToast] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('taskflow_theme', theme);
  }, [theme]);
  useEffect(() => {
    const handler = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCommandOpen(v => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const login = async ({ username, password }) => {
    let next;
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(1800)
      });
      if (!response.ok) throw new Error('offline');
      const data = await response.json();
      localStorage.setItem('taskflow_token', data.token);
      next = { name: data.name || 'Alex Morgan', username: data.username || username, role: data.role || 'SUPER_ADMIN', avatar: avatar(username) };
    } catch {
      if (!username || !password) throw new Error('Enter your username and password.');
      next = { name: username === 'super_admin' ? 'Alex Morgan' : username, username, role: username === 'super_admin' ? 'SUPER_ADMIN' : 'MEMBER', avatar: avatar(username) };
    }
    setSession(next);
    localStorage.setItem('taskflow_session', JSON.stringify(next));
  };

  if (!session) return <Login onLogin={login} theme={theme} setTheme={setTheme} />;

  return (
    <BrowserRouter>
      <Shell session={session} theme={theme} setTheme={setTheme} notices={notices} commandOpen={commandOpen} setCommandOpen={setCommandOpen}
        logout={() => { localStorage.removeItem('taskflow_session'); localStorage.removeItem('taskflow_token'); setSession(null); }}>
        <Routes>
          <Route path="/" element={<Dashboard session={session} tasks={tasks} notify={notify} />} />
          <Route path="/boards" element={<Boards tasks={tasks} />} />
          <Route path="/boards/:id" element={<Board tasks={tasks} setTasks={setTasks} notify={notify} />} />
          <Route path="/tasks" element={<MyTasks tasks={tasks} setTasks={setTasks} />} />
          <Route path="/chat" element={<Chat notify={notify} />} />
          <Route path="/meetings" element={<Meetings notify={notify} />} />
          <Route path="/meetings/:id" element={<MeetingRoom />} />
          <Route path="/notifications" element={<Notifications notices={notices} setNotices={setNotices} />} />
          <Route path="/admin/users" element={session.role === 'SUPER_ADMIN' ? <AdminUsers users={users} setUsers={setUsers} notify={notify} /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme} session={session} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><CheckCircle2 />{toast}</motion.div>}</AnimatePresence>
    </BrowserRouter>
  );
}

function Login({ onLogin, theme, setTheme }) {
  const [form, setForm] = useState({ username: 'super_admin', password: 'super1234!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  return <main className="login-page">
    <div className="login-noise" />
    <header className="login-nav"><Logo /><button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun /> : <Moon />}</button></header>
    <section className="login-copy">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow"><Sparkles /> Built for teams in motion</span>
        <h1>Turn your team's<br /><em>energy into impact.</em></h1>
        <p>One beautifully focused workspace to plan ambitious work, move faster together, and make progress visible.</p>
        <div className="proof">
          <div className="avatar-stack">{USERS.slice(1).map(u => <img key={u.id} src={u.avatar} />)}</div>
          <span><strong>4.9/5</strong><small>Loved by modern teams</small></span>
        </div>
      </motion.div>
      <div className="ambient-card a"><CheckCircle2 /><span>Launch system</span><b>84%</b></div>
      <div className="ambient-card b"><Radio /><span>Team is live</span><b>12 online</b></div>
    </section>
    <motion.form className="login-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} onSubmit={async e => {
      e.preventDefault(); setLoading(true); setError(''); try { await onLogin(form); } catch (err) { setError(err.message); } finally { setLoading(false); }
    }}>
      <div className="login-heading"><span>WELCOME BACK</span><h2>Sign in to TaskFlow</h2><p>Enter your details to open your workspace.</p></div>
      <label>Username<input aria-label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
      <label><span className="label-row">Password <button type="button">Forgot password?</button></span><input aria-label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-btn login-submit" disabled={loading}>{loading ? 'Opening workspace…' : 'Enter workspace'}<ArrowRight /></button>
      <div className="login-divider"><span>Demo access is ready</span></div>
      <p className="credentials"><ShieldCheck /> <span><b>super_admin</b> / super1234!</span></p>
    </motion.form>
  </main>;
}

function Logo() { return <div className="logo"><span><Zap /></span>taskflow<b>.</b></div>; }

function Shell({ session, children, theme, setTheme, notices, logout, commandOpen, setCommandOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const titles = { '/': ['Overview', 'A clear view of everything moving'], '/boards': ['Projects', 'Plan, prioritize and ship together'], '/tasks': ['My tasks', 'Your focused execution queue'], '/chat': ['Messages', 'Move work forward in real time'], '/meetings': ['Meetings', 'Stay aligned, without the calendar chaos'], '/notifications': ['Inbox', 'Updates that need your attention'], '/admin/users': ['People', 'Manage access, roles and workspace members'], '/settings': ['Settings', 'Make TaskFlow feel like yours'] };
  const current = location.pathname.startsWith('/boards/') ? ['Website 2.0', 'Board · Product & Design'] : location.pathname.startsWith('/meetings/') ? ['Product room', 'Live meeting'] : titles[location.pathname] || ['TaskFlow', 'Workspace'];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="side-top"><Logo /><button className="close-mobile" onClick={() => setMobileNav(false)}><X /></button></div>
      <button className="workspace-switch"><span className="workspace-icon">F</span><span><b>Fluxion Labs</b><small>Business workspace</small></span><ChevronDown /></button>
      <nav className="main-nav">
        <p>WORKSPACE</p>
        {NAV.map(([path, Icon, label]) => <button key={path} className={location.pathname === path || (path === '/boards' && location.pathname.startsWith('/boards/')) ? 'active' : ''} onClick={() => { navigate(path); setMobileNav(false); }}><Icon />{label}{label === 'Messages' && <i>5</i>}</button>)}
        {session.role === 'SUPER_ADMIN' && <><p>ADMIN</p><button className={location.pathname === '/admin/users' ? 'active' : ''} onClick={() => navigate('/admin/users')}><Users />People</button></>}
        <p>FAVORITES</p>
        <button onClick={() => navigate('/boards/website')}><span className="dot purple" />Website 2.0</button>
        <button onClick={() => navigate('/boards/website')}><span className="dot green" />Product Core</button>
      </nav>
      <div className="side-footer">
        <button className="upgrade"><WandSparkles /><span><b>Unlock your flow</b><small>Explore Pro features</small></span><ArrowRight /></button>
        <button className="profile-chip" onClick={() => navigate('/settings')}><img src={session.avatar} /><span><b>{session.name}</b><small>{session.role.replace('_', ' ').toLowerCase()}</small></span><Ellipsis /></button>
        <button className="logout-link" onClick={logout}><LogOut /> Sign out</button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu /></button>
        <div className="page-title"><h1>{current[0]}</h1><p>{current[1]}</p></div>
        <button className="search-trigger" onClick={() => setCommandOpen(true)}><Search /><span>Search anything...</span><kbd>⌘ K</kbd></button>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
          <button className="icon-btn notification-btn" onClick={() => navigate('/notifications')}><Bell /><i>{notices.filter(n => n.unread).length}</i></button>
          <img className="top-avatar" src={session.avatar} />
        </div>
      </header>
      <motion.div className="page" key={location.pathname} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}>{children}</motion.div>
    </main>
    <AnimatePresence>{commandOpen && <CommandMenu close={() => setCommandOpen(false)} navigate={navigate} />}</AnimatePresence>
  </div>;
}

function CommandMenu({ close, navigate }) {
  const actions = [
    ['Go to overview', '/', LayoutDashboard], ['Open Website 2.0', '/boards/website', Kanban],
    ['Message the team', '/chat', MessageSquare], ['Schedule a meeting', '/meetings', Video], ['Manage people', '/admin/users', Users]
  ];
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
    <motion.div className="command-menu" initial={{ scale: .96, y: -15 }} animate={{ scale: 1, y: 0 }} onMouseDown={e => e.stopPropagation()}>
      <div className="command-input"><Search /><input autoFocus placeholder="Search pages, tasks, or people…" /><kbd>ESC</kbd></div>
      <p>QUICK NAVIGATION</p>
      {actions.map(([label, path, Icon]) => <button key={label} onClick={() => { navigate(path); close(); }}><Icon /><span>{label}</span><ArrowRight /></button>)}
    </motion.div>
  </motion.div>;
}

function Dashboard({ session, tasks, notify }) {
  const navigate = useNavigate();
  const completed = tasks.filter(t => t.status === 'done').length;
  return <>
    <section className="welcome-row">
      <div><span className="eyebrow"><Sparkles /> FRIDAY, JUNE 27</span><h2>Good morning, {session.name.split(' ')[0]} <span>✦</span></h2><p>Your team shipped 12 tasks this week. Keep the rhythm going.</p></div>
      <div className="welcome-actions"><button className="secondary-btn" onClick={() => navigate('/meetings')}><Video /> Start a huddle</button><button className="primary-btn" onClick={() => notify('New task draft created')}><Plus /> Create task</button></div>
    </section>
    <section className="metric-grid">
      <Metric icon={Target} label="Tasks in motion" value={tasks.filter(t => t.status !== 'done').length} trend="+18%" tone="lime" note="vs. last week" />
      <Metric icon={CheckCircle2} label="Completed" value={completed + 23} trend="+12%" tone="violet" note="this month" />
      <Metric icon={Gauge} label="Team velocity" value="92%" trend="Excellent" tone="blue" note="on track" />
      <Metric icon={Clock3} label="Focus time" value="28h" trend="+4.2h" tone="orange" note="this week" />
    </section>
    <section className="dashboard-grid">
      <div className="card work-card">
        <CardHead title="My focus" subtitle="Tasks that need your attention" action="View all" onAction={() => navigate('/tasks')} />
        <div className="focus-list">{tasks.filter(t => t.status !== 'done').slice(0, 4).map(t => <FocusTask key={t.id} task={t} />)}</div>
      </div>
      <div className="card momentum-card">
        <CardHead title="Weekly momentum" subtitle="Completed tasks" action="This week" />
        <div className="chart-value"><strong>34</strong><span><TrendingUp /> 12.5%</span></div>
        <div className="bar-chart">{[38, 56, 43, 74, 88, 68, 92].map((h, i) => <div key={i}><motion.i initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * .06 }} className={i === 6 ? 'hot' : ''} /><span>{['M','T','W','T','F','S','S'][i]}</span></div>)}</div>
      </div>
      <div className="card projects-card">
        <CardHead title="Active projects" subtitle="Progress across your workspace" action="View projects" onAction={() => navigate('/boards')} />
        {[
          ['Website 2.0', 'Brand refresh & launch', 84, 'purple', USERS.slice(1, 4)],
          ['Product Core', 'Activation & retention', 67, 'green', USERS.slice(2, 5)],
          ['Growth Engine', 'Q3 experiments', 42, 'orange', USERS.slice(1, 3)]
        ].map(([name, desc, pct, tone, team]) => <button className="project-row" key={name} onClick={() => navigate('/boards/website')}>
          <span className={`project-symbol ${tone}`}><Grid2X2 /></span><span className="project-name"><b>{name}</b><small>{desc}</small></span>
          <span className="mini-avatars">{team.map(u => <img key={u.id} src={u.avatar} />)}</span><span className="progress-wrap"><i><em style={{ width: `${pct}%` }} /></i><b>{pct}%</b></span><ArrowRight />
        </button>)}
      </div>
      <div className="card activity-card">
        <CardHead title="Team pulse" subtitle="Live workspace activity" />
        {[
          [USERS[1], 'moved “Email copy” to Review', '8m'],
          [USERS[2], 'completed Mobile navigation QA', '26m'],
          [USERS[3], 'commented on Launch narrative', '42m'],
          [USERS[4], 'uploaded 3 files to Website 2.0', '1h'],
        ].map(([u, text, time]) => <div className="activity-row" key={text}><div className="avatar-online"><img src={u.avatar} /><i /></div><span><b>{u.name}</b><small>{text}</small></span><time>{time}</time></div>)}
      </div>
    </section>
  </>;
}

function Metric({ icon: Icon, label, value, trend, tone, note }) {
  return <motion.article className="metric-card" whileHover={{ y: -3 }}><div className={`metric-icon ${tone}`}><Icon /></div><div><p>{label}</p><strong>{value}</strong></div><span className={`metric-trend ${tone}`}>{trend}</span><small>{note}</small></motion.article>;
}
function CardHead({ title, subtitle, action, onAction }) { return <div className="card-head"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action}<ChevronDown /></button>}</div>; }
function Priority({ value }) { return <span className={`priority p-${value.toLowerCase()}`}><i />{value}</span>; }
function FocusTask({ task }) { return <div className="focus-task"><button className="task-check"><Circle /></button><span><b>{task.title}</b><small><span className="project-dot" />{task.project} · {task.code}</small></span><Priority value={task.priority} /><time className={task.due === 'Today' ? 'due' : ''}><CalendarDays />{task.due}</time><div className="mini-avatars">{task.assignees.map(u => <img key={u.id} src={u.avatar} />)}</div><button className="ghost-icon"><MoreHorizontal /></button></div>; }

function Boards() {
  const navigate = useNavigate();
  const projects = [
    ['Website 2.0', 'The new face of Fluxion, from story to ship.', 84, 'purple', 24],
    ['Product Core', 'Activation, navigation and core experience.', 67, 'green', 18],
    ['Growth Engine', 'Experiments that turn attention into momentum.', 42, 'orange', 31],
    ['Mobile App', 'A focused companion for work on the move.', 26, 'blue', 12],
  ];
  return <><div className="toolbar"><div className="filter-tabs"><button className="active">All projects <span>4</span></button><button>Favorites</button><button>Archived</button></div><button className="primary-btn"><Plus /> New project</button></div>
    <div className="board-grid">{projects.map(([name, desc, progress, tone, tasks]) => <motion.button whileHover={{ y: -5 }} className="board-card card" key={name} onClick={() => navigate('/boards/website')}>
      <div className={`board-cover ${tone}`}><span><Grid2X2 /></span><button><MoreHorizontal /></button></div><div className="board-body"><h3>{name}</h3><p>{desc}</p><div className="board-meta"><span>{tasks} tasks</span><span>{progress}% complete</span></div><div className="project-progress"><i style={{ width: `${progress}%` }} /></div><div className="board-foot"><div className="mini-avatars">{USERS.slice(1, 4).map(u => <img src={u.avatar} key={u.id} />)}<b>+3</b></div><time>Updated 2h ago</time></div></div>
    </motion.button>)}</div></>;
}

const COLUMNS = [['todo','TO DO','#a78bfa'],['progress','IN PROGRESS','#bef264'],['review','REVIEW','#60a5fa'],['done','DONE','#34d399']];
function Board({ tasks, setTasks, notify }) {
  const [selected, setSelected] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }));
  const move = ({ active, over }) => {
    if (!over) return;
    const status = COLUMNS.some(([id]) => id === over.id) ? over.id : tasks.find(t => t.id === Number(over.id))?.status;
    if (!status) return;
    setTasks(items => items.map(t => t.id === Number(active.id) ? { ...t, status } : t));
    notify('Task moved successfully');
  };
  return <>
    <div className="board-toolbar"><div className="board-tabs"><button className="active"><Kanban /> Board</button><button><ListFilter /> List</button><button><CalendarDays /> Timeline</button></div><div className="board-tools"><div className="mini-avatars">{USERS.slice(1,5).map(u => <img src={u.avatar} key={u.id} />)}<b>+5</b></div><button className="secondary-btn"><Filter /> Filter</button><button className="primary-btn"><Plus /> Add task</button></div></div>
    <DndContext sensors={sensors} onDragEnd={move}><div className="kanban-board">{COLUMNS.map(([id,label,color]) => <KanbanColumn key={id} id={id} label={label} color={color} tasks={tasks.filter(t => t.status === id)} onSelect={setSelected} />)}</div></DndContext>
    <AnimatePresence>{selected && <TaskModal task={selected} close={() => setSelected(null)} notify={notify} />}</AnimatePresence>
  </>;
}
function KanbanColumn({ id, label, color, tasks, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <section className={`kanban-column ${isOver ? 'over' : ''}`} ref={setNodeRef}><header><span style={{ '--col': color }}><i />{label}</span><b>{tasks.length}</b><button><MoreHorizontal /></button></header><div className="kanban-stack">{tasks.map(t => <TaskCard key={t.id} task={t} onSelect={onSelect} />)}<button className="add-card"><Plus /> Add task</button></div></section>;
}
function TaskCard({ task, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return <motion.article ref={setNodeRef} style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined} className={`task-card ${isDragging ? 'dragging' : ''}`} {...listeners} {...attributes} onClick={() => onSelect(task)} whileHover={{ y: -2 }}>
    <div className="task-top"><span className="task-code">{task.code}</span><Priority value={task.priority} /></div><h4>{task.title}</h4><p>{task.description}</p><div className="tag-row">{task.tags.map(tag => <span key={tag}><Tag />{tag}</span>)}</div><div className="task-foot"><div className="mini-avatars">{task.assignees.map(u => <img src={u.avatar} key={u.id} />)}</div><span className={task.due === 'Today' ? 'due' : ''}><CalendarDays />{task.due}</span><span><MessageCircle />{task.comments}</span><span><Paperclip />{task.files}</span></div>
  </motion.article>;
}
function TaskModal({ task, close, notify }) {
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}><motion.div className="task-modal" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-top"><span>{task.project} / {task.code}</span><div><button><ExternalLink /></button><button onClick={close}><X /></button></div></div>
    <Priority value={task.priority} /><h2>{task.title}</h2><p>{task.description}</p>
    <div className="task-fields"><div><span>Status</span><b><i className="status-dot" /> In progress</b></div><div><span>Assignees</span><b className="mini-avatars">{task.assignees.map(u => <img src={u.avatar} key={u.id} />)}</b></div><div><span>Due date</span><b><CalendarDays />{task.due}</b></div><div><span>Labels</span><b>{task.tags.join(', ')}</b></div></div>
    <div className="modal-section"><h3>Activity <span>{task.comments}</span></h3><div className="comment"><img src={USERS[1].avatar}/><div><b>Maya Chen <time>24 min ago</time></b><p>I tightened the final pass. This is ready for your review when you are.</p></div></div></div>
    <div className="comment-box"><img src={USERS[0].avatar}/><input placeholder="Leave a comment…" /><button onClick={() => notify('Comment added')}><Send /></button></div>
  </motion.div></motion.div>;
}

function MyTasks({ tasks, setTasks }) {
  return <div className="card table-card"><div className="toolbar"><div className="filter-tabs"><button className="active">Assigned to me</button><button>Created by me</button><button>Completed</button></div><button className="secondary-btn"><Filter /> Filter</button></div>
    <div className="task-table"><div className="table-head"><span>Task</span><span>Project</span><span>Priority</span><span>Due date</span><span>Owner</span></div>{tasks.map(t => <div className="table-row" key={t.id}><button onClick={() => setTasks(xs => xs.map(x => x.id === t.id ? {...x, status: x.status === 'done' ? 'todo' : 'done'} : x))}>{t.status === 'done' ? <CheckCircle2 /> : <Circle />}</button><span><b>{t.title}</b><small>{t.code}</small></span><span>{t.project}</span><Priority value={t.priority} /><time>{t.due}</time><div className="mini-avatars">{t.assignees.map(u => <img src={u.avatar} key={u.id} />)}</div></div>)}</div>
  </div>;
}

function Chat({ notify }) {
  const [messages, setMessages] = useState([
    { id: 1, user: USERS[1], text: 'The launch narrative is finally clicking. I left the updated arc in the task.', time: '10:24' },
    { id: 2, user: USERS[2], text: 'Nice. I can wire the new comparison block this afternoon ✦', time: '10:27' },
    { id: 3, user: USERS[0], text: 'Perfect. Let’s do a quick review before the daily sync.', time: '10:31', mine: true },
  ]);
  const [text, setText] = useState('');
  const send = () => { if (!text.trim()) return; setMessages([...messages, { id: Date.now(), user: USERS[0], text, time: 'Now', mine: true }]); setText(''); notify('Message sent'); };
  return <div className="chat-layout card"><aside className="chat-side"><div className="chat-side-title"><h3>Messages</h3><button><Plus /></button></div><div className="chat-search"><Search /><input placeholder="Search conversations" /></div><p>CHANNELS</p>{['company-wide','website-redesign','product-core','random'].map((x,i)=><button className={i===1?'active':''} key={x}><Hash />{x}{i===1&&<b>3</b>}</button>)}<p>DIRECT MESSAGES</p>{USERS.slice(1,5).map((u,i)=><button key={u.id}><span className="avatar-online"><img src={u.avatar}/><i /></span>{u.name}{i===0&&<b>2</b>}</button>)}</aside>
    <section className="chat-main"><header><div><span className="hash-icon"><Hash /></span><span><b>website-redesign</b><small>Launch planning and design reviews</small></span></div><div><button><Users /> 9</button><button><Video /></button><button><MoreHorizontal /></button></div></header><div className="message-stream"><div className="date-divider"><span>Today</span></div>{messages.map(m=><div className={`message ${m.mine?'mine':''}`} key={m.id}><img src={m.user.avatar}/><div><p><b>{m.user.name}</b><time>{m.time}</time></p><span>{m.text}</span></div></div>)}</div><div className="message-composer"><div><button><Paperclip /></button><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Message #website-redesign" /><button><Sparkles /></button><button className="send-btn" onClick={send}><Send /></button></div><small><b>↵</b> to send · <b>Shift ↵</b> for new line</small></div></section>
    <aside className="chat-details"><div className="channel-orb"><Hash /></div><h3>website-redesign</h3><p>Everything about our new website launch.</p><div className="detail-stat"><span><b>9</b><small>Members</small></span><span><b>148</b><small>Files</small></span></div><button className="secondary-btn"><Users /> View members</button><div className="shared"><p>SHARED FILES <button>View all</button></p>{[['Launch-system.fig','18 MB'],['Brand-voice.pdf','4.2 MB'],['Homepage-copy.doc','825 KB']].map(([n,s])=><div key={n}><FileText /><span><b>{n}</b><small>{s}</small></span><button><ExternalLink /></button></div>)}</div></aside>
  </div>;
}

function Meetings({ notify }) {
  const navigate = useNavigate();
  return <><section className="meeting-hero card"><div><span className="eyebrow"><Radio /> YOUR NEXT MEETING</span><h2>Daily product sync</h2><p>Today, 11:30 — 12:00 · 8 participants</p><div className="avatar-stack">{USERS.map(u=><img src={u.avatar} key={u.id}/>)}</div></div><div className="meeting-visual"><div className="pulse-ring"><Video /></div></div><button className="primary-btn" onClick={()=>navigate('/meetings/daily')}><Video /> Join room</button></section>
    <div className="meetings-grid"><section className="card"><CardHead title="Upcoming" subtitle="Your schedule this week" action="View calendar" />{[
      ['Sprint planning','Mon, 09:30','60 min','Product Core'],
      ['Website design review','Tue, 14:00','45 min','Website 2.0'],
      ['Growth experiment readout','Thu, 10:00','30 min','Growth Engine']
    ].map(([n,d,l,p],i)=><div className="meeting-row" key={n}><span className={`calendar-tile t${i}`}><b>{d.split(',')[0]}</b><small>{d.split(',')[1]}</small></span><span><b>{n}</b><small>{p} · {l}</small></span><div className="mini-avatars">{USERS.slice(i+1,i+4).map(u=><img src={u.avatar} key={u.id}/>)}</div><button><MoreHorizontal /></button></div>)}</section>
    <section className="card quick-meet"><span className="quick-icon"><Zap /></span><h3>Start an instant huddle</h3><p>Pull your team into a focused room in one click.</p><button className="primary-btn" onClick={()=>{notify('Instant room is ready'); navigate('/meetings/huddle')}}><Video /> Start huddle</button><button className="secondary-btn" onClick={()=>notify('Meeting link copied')}><Copy /> Copy invite link</button></section></div>
  </>;
}

function MeetingRoom() {
  const navigate = useNavigate();
  const [mic, setMic] = useState(true), [cam, setCam] = useState(true);
  return <div className="meeting-room"><header><button onClick={()=>navigate('/meetings')}><ArrowLeft /></button><div><b>Daily product sync</b><small><i /> Live · 18:42</small></div><span><Users /> 5 participants</span></header><div className="video-grid"><div className="video-tile featured"><img src={USERS[1].avatar}/><span>Maya Chen</span></div>{USERS.slice(2,5).map(u=><div className="video-tile" key={u.id}><img src={u.avatar}/><span>{u.name}</span></div>)}</div><div className="call-controls"><button className={!mic?'off':''} onClick={()=>setMic(!mic)}>{mic?<Mic/>:<MicOff/>}</button><button className={!cam?'off':''} onClick={()=>setCam(!cam)}>{cam?<Camera/>:<VideoOff/>}</button><button><ArrowRight /></button><button><MessageSquare /></button><button className="leave" onClick={()=>navigate('/meetings')}><PhoneOff /></button></div></div>;
}

function Notifications({ notices, setNotices }) {
  const all = [...notices, {id:4,text:'Sam completed “Mobile dashboard QA”',time:'2 hours',unread:false,icon:Check}, {id:5,text:'You were added to Product Core',time:'Yesterday',unread:false,icon:Users}];
  return <div className="card notification-page"><div className="toolbar"><div className="filter-tabs"><button className="active">All</button><button>Mentions</button><button>Assigned</button></div><button className="secondary-btn" onClick={()=>setNotices(xs=>xs.map(n=>({...n,unread:false})))}><Check /> Mark all read</button></div>{all.map(n=>{const Icon=n.icon;return <div className={`notification-row ${n.unread?'unread':''}`} key={n.id}><span><Icon /></span><div><b>{n.text}</b><small>{n.time} ago</small></div>{n.unread&&<i/>}<button><MoreHorizontal /></button></div>})}</div>;
}

function AdminUsers({ users, setUsers, notify }) {
  const [open, setOpen] = useState(false);
  const toggle = id => setUsers(xs=>xs.map(u=>u.id===id?{...u,status:u.status==='Active'?'Inactive':'Active'}:u));
  return <><div className="admin-summary"><Metric icon={Users} label="Total members" value={users.length} trend="+2" tone="lime" note="this month"/><Metric icon={ShieldCheck} label="Administrators" value="2" trend="Secure" tone="violet" note="workspace roles"/><Metric icon={Activity} label="Active today" value="4" trend="80%" tone="blue" note="of your team"/></div><div className="card users-card"><div className="toolbar"><div className="table-search"><Search/><input placeholder="Search people…"/></div><div><button className="secondary-btn"><Filter/> Filters</button><button className="primary-btn" onClick={()=>setOpen(true)}><UserPlus/> Add member</button></div></div><div className="users-table"><div className="users-head"><span>Member</span><span>Role</span><span>Status</span><span>Last active</span><span/></div>{users.map(u=><div className="user-table-row" key={u.id}><span><img src={u.avatar}/><span><b>{u.name}</b><small>@{u.username} · {u.title}</small></span></span><span className="role-pill">{u.role.replace('_',' ')}</span><button className={`status ${u.status.toLowerCase()}`} onClick={()=>toggle(u.id)}><i/>{u.status}</button><time>Just now</time><button><MoreHorizontal/></button></div>)}</div></div>
    <AnimatePresence>{open&&<motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={()=>setOpen(false)}><motion.form className="user-modal" initial={{scale:.96}} animate={{scale:1}} onMouseDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault(); setUsers([...users,{id:Date.now(),name:'New teammate',username:'new.member',role:'MEMBER',title:'Team member',status:'Active',avatar:avatar('new')}]);setOpen(false);notify('New member added')}}><div className="modal-top"><div><h2>Invite a teammate</h2><p>Give someone access to your TaskFlow workspace.</p></div><button type="button" onClick={()=>setOpen(false)}><X/></button></div><label>Full name<input placeholder="e.g. Taylor Reed"/></label><label>Username<input placeholder="taylor.reed"/></label><label>Role<select><option>MEMBER</option><option>ADMIN</option></select></label><button className="primary-btn">Create member</button></motion.form></motion.div>}</AnimatePresence>
  </>;
}

function SettingsPage({ theme, setTheme, session }) { return <div className="settings-grid"><aside className="card settings-nav"><button className="active"><Users/>Profile</button><button><Bell/>Notifications</button><button><ShieldCheck/>Security</button><button><Sparkles/>Appearance</button></aside><section className="card settings-card"><h2>Profile details</h2><p>This is how teammates see you across TaskFlow.</p><div className="profile-edit"><img src={session.avatar}/><button className="secondary-btn">Change photo</button></div><div className="form-grid"><label>Full name<input defaultValue={session.name}/></label><label>Username<input defaultValue={session.username}/></label><label>GitHub<input placeholder="github.com/username"/></label><label>LinkedIn<input placeholder="linkedin.com/in/username"/></label></div><hr/><h3>Appearance</h3><div className="theme-choice"><button className={theme==='dark'?'active':''} onClick={()=>setTheme('dark')}><Moon/>Dark</button><button className={theme==='light'?'active':''} onClick={()=>setTheme('light')}><Sun/>Light</button></div><button className="primary-btn">Save changes</button></section></div>; }
function NotFound(){const navigate=useNavigate();return <div className="not-found"><span>404</span><h2>This flow went off course.</h2><p>The page you’re looking for moved, or never existed.</p><button className="primary-btn" onClick={()=>navigate('/')}><ArrowLeft/>Back to overview</button></div>}

createRoot(document.getElementById('root')).render(<App />);
