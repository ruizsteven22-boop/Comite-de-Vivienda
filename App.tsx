
import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, BoardRole, CommitteeConfig, SystemRole } from './types';
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

type ViewId = 'dashboard' | 'members' | 'treasury' | 'board' | 'attendance' | 'assemblies' | 'support' | 'settings';

const PERMISSIONS: Record<ViewId, (SystemRole | 'ANY')[]> = {
  dashboard: ['ANY'],
  members: ['ANY'],
  treasury: [BoardRole.TREASURER, BoardRole.PRESIDENT, 'SUPPORT', 'ADMINISTRATOR'],
  board: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  assemblies: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  attendance: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  support: ['SUPPORT', 'ADMINISTRATOR'],
  settings: ['SUPPORT', 'ADMINISTRATOR']
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewId>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  const handleResetSystem = () => {
    const confirm1 = confirm("⚠️ ¿ESTÁ SEGURO DE RESTABLECER TODO A CERO?\n\nEsta acción borrará permanentemente todos los socios, transacciones, asambleas y configuraciones personalizadas.");
    if (confirm1) {
      const confirm2 = confirm("🚨 ¡ÚLTIMA ADVERTENCIA!\n\nTodos los datos locales se perderán definitivamente. ¿Desea proceder?");
      if (confirm2) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleViewMember = (id: string) => {
    setViewingMemberId(id);
    setView('members');
  };

  const hasPermission = (viewId: ViewId): boolean => {
    if (!currentUser) return false;
    const allowedRoles = PERMISSIONS[viewId];
    return allowedRoles.includes('ANY') || allowedRoles.includes(currentUser.role);
  };

  const exportBackupData = () => {
    const backupData = {
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        config,
        members,
        transactions,
        board,
        boardPeriod,
        assemblies
      }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo_tierra_esperanza_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isInitialized) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <Login users={users} onLogin={handleLogin} />;

  const menuItems = [
    { id: 'dashboard' as const, icon: <Icons.Dashboard />, label: 'Inicio' },
    { id: 'members' as const, icon: <Icons.Users />, label: 'Socios' },
    { id: 'treasury' as const, icon: <Icons.Wallet />, label: 'Tesorería' },
    { id: 'board' as const, icon: <Icons.Shield />, label: 'Directiva' },
    { id: 'assemblies' as const, icon: <Icons.Calendar />, label: 'Asambleas' },
    { id: 'attendance' as const, icon: <Icons.Clipboard />, label: 'Asistencia' },
    { id: 'settings' as const, icon: <Icons.Briefcase />, label: 'Configuración' },
    { id: 'support' as const, icon: <Icons.Settings />, label: 'Usuarios' },
  ];

  const tradeParts = config.tradeName.split(' ');

  const RestrictedAccess = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mb-8 shadow-inner border-2 border-rose-100">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">Acceso Restringido</h3>
      <p className="text-slate-500 font-bold max-w-md mx-auto mt-4 leading-relaxed">
        Su rol actual de <span className="text-emerald-700 font-black">"{currentUser.role}"</span> no cuenta con los privilegios necesarios para visualizar este módulo.
      </p>
      <button 
        onClick={() => setView('dashboard')}
        className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl"
      >
        Volver al Inicio
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
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
              if (!hasPermission(item.id)) return null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                  className={`group flex w-full items-center rounded-2xl px-6 py-4 text-sm font-bold transition-all ${view === item.id ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-950/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-black text-white shadow-md">
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 md:hidden shadow-sm">
          <div className="font-black italic text-slate-900 tracking-tight">{config.tradeName}</div>
          <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg bg-slate-100 p-2 text-slate-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M12 12h8M4 18h16" /></svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
          <div className="mx-auto max-w-7xl page-transition">
            {!hasPermission(view) ? (
              <RestrictedAccess />
            ) : (
              <>
                {view === 'dashboard' && <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser} config={config} />}
                {view === 'members' && <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} transactions={transactions} board={board} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} currentUser={currentUser} config={config} />}
                {view === 'treasury' && <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={handleViewMember} currentUser={currentUser} />}
                {view === 'board' && <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} currentUser={currentUser} config={config} />}
                {view === 'assemblies' && <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} currentUser={currentUser} config={config} />}
                {view === 'attendance' && <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} currentUser={currentUser} config={config} />}
                {view === 'support' && <SupportManagement users={users} setUsers={setUsers} />}
                {view === 'settings' && <SettingsManagement config={config} setConfig={setConfig} onExportBackup={exportBackupData} onResetSystem={handleResetSystem} />}
              </>
            )}
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"></div>
      )}
    </div>
  );
};

export default App;
