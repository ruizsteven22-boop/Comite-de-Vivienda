import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, BoardRole, CommitteeConfig } from './types';
import { Icons } from './constants';
import Dashboard from './components/Dashboard';
import MemberManagement from './components/MemberManagement';
import Treasury from './components/Treasury';
import BoardManagement from './components/BoardManagement';
import Attendance from './components/Attendance';
import AssemblyManagement from './components/AssemblyManagement';
import SupportManagement from './components/SupportManagement';
import SettingsManagement from './components/SettingsManagement';
import Login from './components/Login';

const INITIAL_USERS: User[] = [
  { id: '1', username: 'soporte', password: 'soporte.password', role: 'SUPPORT', name: 'Soporte Técnico' },
  { id: '2', username: 'admin', password: 'admin.password', role: 'ADMINISTRATOR', name: 'Administrador' },
  { id: '3', username: 'presi', password: 'te2024', role: BoardRole.PRESIDENT, name: 'Presidente' },
  { id: '4', username: 'teso', password: 'te2024', role: BoardRole.TREASURER, name: 'Tesorero' },
  { id: '5', username: 'secre', password: 'te2024', role: BoardRole.SECRETARY, name: 'Secretario' }
];

const INITIAL_CONFIG: CommitteeConfig = {
  legalName: 'Comité de Vivienda Tierra Esperanza',
  tradeName: 'Tierra Esperanza',
  rut: '76.123.456-7',
  email: 'contacto@tierraesperanza.cl',
  phone: '+56 9 1234 5678',
  municipalRes: 'Res. Exenta N° 456/2023',
  legalRes: 'Pers. Jurídica N° 7890-S'
};

const EMPTY_PERSON = { name: '', rut: '', phone: '' };

const INITIAL_BOARD: BoardPosition[] = [
  { role: BoardRole.PRESIDENT, primary: { name: 'Juan Pérez', rut: '12.345.678-9', phone: '+56912345678' }, substitute: { ...EMPTY_PERSON } },
  { role: BoardRole.SECRETARY, primary: { name: 'María López', rut: '15.678.901-2', phone: '+56987654321' }, substitute: { ...EMPTY_PERSON } },
  { role: BoardRole.TREASURER, primary: { name: 'Carlos Ruiz', rut: '18.901.234-5', phone: '+56955566677' }, substitute: { ...EMPTY_PERSON } }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'members' | 'treasury' | 'board' | 'attendance' | 'assemblies' | 'support' | 'settings'>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States with safer LocalStorage loading
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('te_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch { return INITIAL_USERS; }
  });

  const [config, setConfig] = useState<CommitteeConfig>(() => {
    try {
      const saved = localStorage.getItem('te_config');
      return saved ? JSON.parse(saved) : INITIAL_CONFIG;
    } catch { return INITIAL_CONFIG; }
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('te_members');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('te_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [board, setBoard] = useState<BoardPosition[]>(() => {
    try {
      const saved = localStorage.getItem('te_board');
      return saved ? JSON.parse(saved) : INITIAL_BOARD;
    } catch { return INITIAL_BOARD; }
  });

  const [boardPeriod, setBoardPeriod] = useState<string>(() => localStorage.getItem('te_board_period') || '2025 - 2027');

  const [assemblies, setAssemblies] = useState<Assembly[]>(() => {
    try {
      const saved = localStorage.getItem('te_assemblies');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('te_session');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } 
      catch { localStorage.removeItem('te_session'); }
    }
    setIsInitialized(true);
  }, []);

  // Persistence Sync
  useEffect(() => { if (isInitialized) {
    localStorage.setItem('te_users', JSON.stringify(users));
    localStorage.setItem('te_config', JSON.stringify(config));
    localStorage.setItem('te_members', JSON.stringify(members));
    localStorage.setItem('te_transactions', JSON.stringify(transactions));
    localStorage.setItem('te_board', JSON.stringify(board));
    localStorage.setItem('te_board_period', boardPeriod);
    localStorage.setItem('te_assemblies', JSON.stringify(assemblies));
  }}, [users, config, members, transactions, board, boardPeriod, assemblies, isInitialized]);

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

  if (!isInitialized) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <Login users={users} onLogin={handleLogin} />;

  const isSupport = currentUser.role === 'SUPPORT' || currentUser.role === 'ADMINISTRATOR';

  const menuItems = [
    { id: 'dashboard', icon: <Icons.Dashboard />, label: 'Inicio', roles: ['ANY'] },
    { id: 'members', icon: <Icons.Users />, label: 'Socios', roles: ['ANY'] },
    { id: 'treasury', icon: <Icons.Wallet />, label: 'Tesorería', roles: [BoardRole.TREASURER, BoardRole.PRESIDENT, 'SUPPORT', 'ADMINISTRATOR'] },
    { id: 'board', icon: <Icons.Shield />, label: 'Directiva', roles: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'] },
    { id: 'assemblies', icon: <Icons.Calendar />, label: 'Asambleas', roles: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'] },
    { id: 'attendance', icon: <Icons.Clipboard />, label: 'Asistencia', roles: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'] },
  ];

  if (isSupport) {
    menuItems.push({ id: 'settings', icon: <Icons.Briefcase />, label: 'Configuración', roles: ['SUPPORT', 'ADMINISTRATOR'] });
    menuItems.push({ id: 'support', icon: <Icons.Settings />, label: 'Usuarios', roles: ['SUPPORT', 'ADMINISTRATOR'] });
  }

  const tradeParts = config.tradeName.split(' ');

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Navigation Sidebar */}
      <aside className={`sidebar-glass fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="p-8">
            <h1 className="flex items-center text-2xl font-black italic tracking-tighter text-white">
              <span className="text-emerald-500 mr-2">🌳</span>
              {tradeParts[0]} <span className="text-emerald-400 ml-1">{tradeParts.slice(1).join(' ')}</span>
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Sistema de Gestión</p>
          </div>

          <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
            {menuItems.map(item => {
              const hasAccess = item.roles.includes('ANY') || item.roles.includes(currentUser.role as any) || isSupport;
              if (!hasAccess) return null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }}
                  className={`group flex w-full items-center rounded-2xl px-6 py-4 text-sm font-bold transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className={`mr-4 transition-colors ${view === item.id ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-6 bg-slate-950/50 mt-auto border-t border-white/5">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white shadow-md">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-black text-white">{currentUser.name}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-xl bg-rose-500/10 py-3 text-xs font-black uppercase tracking-widest text-rose-400 transition-all hover:bg-rose-500 hover:text-white"
            >
              <span className="mr-2"><Icons.Logout /></span> Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 md:hidden">
          <div className="font-black italic text-slate-900 tracking-tight">{config.tradeName}</div>
          <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg bg-slate-100 p-2 text-slate-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M12 12h8M4 18h16" /></svg>
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
          <div className="mx-auto max-w-7xl page-transition">
            {view === 'dashboard' && <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser} config={config} />}
            {view === 'members' && <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} transactions={transactions} board={board} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} currentUser={currentUser} config={config} />}
            {view === 'treasury' && <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={handleViewMember} currentUser={currentUser} />}
            {view === 'board' && <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} currentUser={currentUser} config={config} />}
            {view === 'assemblies' && <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} currentUser={currentUser} config={config} />}
            {view === 'attendance' && <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} currentUser={currentUser} config={config} />}
            {view === 'support' && isSupport && <SupportManagement users={users} setUsers={setUsers} />}
            {view === 'settings' && isSupport && <SettingsManagement config={config} setConfig={setConfig} />}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"></div>
      )}
    </div>
  );
};

export default App;