
import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, BoardRole, MemberStatus } from './types';
import { Icons } from './constants';
import Dashboard from './components/Dashboard';
import MemberManagement from './components/MemberManagement';
import Treasury from './components/Treasury';
import BoardManagement from './components/BoardManagement';
import Attendance from './components/Attendance';
import AssemblyManagement from './components/AssemblyManagement';
import SupportManagement from './components/SupportManagement';
import Login from './components/Login';

const INITIAL_USERS: User[] = [
  { id: '1', username: 'soporte', password: 'soporte.password', role: 'SUPPORT', name: 'Soporte Técnico' },
  { id: '2', username: 'admin', password: 'admin.password', role: 'ADMINISTRATOR', name: 'Administrador General' },
  { id: '3', username: 'presi', password: 'te2024', role: BoardRole.PRESIDENT, name: 'Presidente' },
  { id: '4', username: 'teso', password: 'te2024', role: BoardRole.TREASURER, name: 'Tesorero' },
  { id: '5', username: 'secre', password: 'te2024', role: BoardRole.SECRETARY, name: 'Secretario' }
];

const EMPTY_PERSON = { name: '', rut: '', phone: '' };

const INITIAL_BOARD: BoardPosition[] = [
  {
    role: BoardRole.PRESIDENT,
    primary: { name: 'Juan Pérez', rut: '12.345.678-9', phone: '+56912345678' },
    substitute: { ...EMPTY_PERSON }
  },
  {
    role: BoardRole.SECRETARY,
    primary: { name: 'María López', rut: '15.678.901-2', phone: '+56987654321' },
    substitute: { ...EMPTY_PERSON }
  },
  {
    role: BoardRole.TREASURER,
    primary: { name: 'Carlos Ruiz', rut: '18.901.234-5', phone: '+56955566677' },
    substitute: { ...EMPTY_PERSON }
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'members' | 'treasury' | 'board' | 'attendance' | 'assemblies' | 'support'>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('te_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('te_members');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('te_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [board, setBoard] = useState<BoardPosition[]>(() => {
    const saved = localStorage.getItem('te_board');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return INITIAL_BOARD;
        return parsed.map((p: any) => ({
          role: p.role || BoardRole.PRESIDENT,
          primary: p.primary || { ...EMPTY_PERSON },
          substitute: p.substitute || (Array.isArray(p.substitutes) ? p.substitutes[0] : { ...EMPTY_PERSON })
        }));
      } catch (e) {
        return INITIAL_BOARD;
      }
    }
    return INITIAL_BOARD;
  });

  const [boardPeriod, setBoardPeriod] = useState<string>(() => {
    return localStorage.getItem('te_board_period') || '2025 - 2027';
  });

  const [assemblies, setAssemblies] = useState<Assembly[]>(() => {
    const saved = localStorage.getItem('te_assemblies');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('te_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('te_session');
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => { if (isInitialized) localStorage.setItem('te_users', JSON.stringify(users)); }, [users, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('te_members', JSON.stringify(members)); }, [members, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('te_transactions', JSON.stringify(transactions)); }, [transactions, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('te_board', JSON.stringify(board)); }, [board, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('te_board_period', boardPeriod); }, [boardPeriod, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('te_assemblies', JSON.stringify(assemblies)); }, [assemblies, isInitialized]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('te_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('te_session');
    setIsSidebarOpen(false);
  };

  const handleViewMember = (id: string) => {
    setViewingMemberId(id);
    setView('members');
  };

  if (!isInitialized) return null;
  if (!currentUser) return <Login users={users} onLogin={handleLogin} />;

  const isSupport = currentUser.role === 'SUPPORT' || currentUser.role === 'ADMINISTRATOR';

  const canAccess = (viewName: string): boolean => {
    if (isSupport) return true;
    const role = currentUser.role;
    switch (viewName) {
      case 'dashboard': return true;
      case 'members': return true;
      case 'treasury': return role === BoardRole.TREASURER || role === BoardRole.PRESIDENT;
      case 'board': return role === BoardRole.PRESIDENT || role === BoardRole.SECRETARY;
      case 'assemblies': return role === BoardRole.PRESIDENT || role === BoardRole.SECRETARY;
      case 'attendance': return role === BoardRole.PRESIDENT || role === BoardRole.SECRETARY;
      default: return false;
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: <Icons.Dashboard />, label: 'Panel de Control' },
    { id: 'members', icon: <Icons.Users />, label: 'Gestión de Socios' },
    { id: 'treasury', icon: <Icons.Wallet />, label: 'Tesorería' },
    { id: 'board', icon: <Icons.Shield />, label: 'Directiva' },
    { id: 'assemblies', icon: <Icons.Calendar />, label: 'Asambleas' },
    { id: 'attendance', icon: <Icons.Clipboard />, label: 'Asistencia' },
  ];

  if (isSupport) {
    menuItems.push({ id: 'support', icon: <Icons.Settings />, label: 'Gestión de Accesos' });
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Responsive */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-72 md:w-80 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10">
          <h1 className="text-2xl font-black italic tracking-tighter">Tierra <span className="text-emerald-400">Esperanza</span></h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-2">Portal de Gestión</p>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map(item => canAccess(item.id) && (
            <button key={item.id} onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {item.icon}
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black">{currentUser.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate">{currentUser.name}</p>
              <p className="text-[9px] uppercase font-black text-emerald-400">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="md:hidden p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-[60]">
          <h2 className="font-black italic">Tierra Esperanza</h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-emerald-600 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </header>

        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser} />}
          {view === 'members' && <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} transactions={transactions} board={board} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} currentUser={currentUser} />}
          {view === 'treasury' && <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={handleViewMember} currentUser={currentUser} />}
          {view === 'board' && <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} currentUser={currentUser} />}
          {view === 'assemblies' && <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} currentUser={currentUser} />}
          {view === 'attendance' && <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} currentUser={currentUser} />}
          {view === 'support' && isSupport && <SupportManagement users={users} setUsers={setUsers} />}
        </div>
      </main>
    </div>
  );
};

export default App;
