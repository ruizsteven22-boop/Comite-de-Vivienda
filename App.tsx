
import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, BoardRole, CommitteeConfig, SystemRole, Language } from './types';
import { Icons } from './constants';
import { getTranslation } from './services/i18nService';
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
  legalRes: 'Pers. Jurídica N° 7890-S',
  language: Language.ES
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

/**
 * safeJsonParse robusto contra errores de WordPress.
 * Evita el error "Unexpected token <" al leer datos corruptos del servidor o storage.
 */
const safeJsonParse = (key: string, fallback: any) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    
    const trimmed = data.trim();
    // Si los datos guardados parecen HTML (comienzan con <), son una respuesta de error del servidor
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
      console.warn(`[Tierra Esperanza] Datos corruptos (HTML) detectados en ${key}. Restaurando valores iniciales.`);
      localStorage.removeItem(key);
      return fallback;
    }
    
    return JSON.parse(trimmed);
  } catch (e) {
    console.error(`[Tierra Esperanza] Error fatal al parsear ${key}:`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewId>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [users, setUsers] = useState<User[]>(() => safeJsonParse('te_users', INITIAL_USERS));
  const [config, setConfig] = useState<CommitteeConfig>(() => safeJsonParse('te_config', INITIAL_CONFIG));
  const [members, setMembers] = useState<Member[]>(() => safeJsonParse('te_members', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeJsonParse('te_transactions', []));
  const [board, setBoard] = useState<BoardPosition[]>(() => safeJsonParse('te_board', INITIAL_BOARD));
  const [boardPeriod, setBoardPeriod] = useState<string>(() => localStorage.getItem('te_board_period') || '2025 - 2027');
  const [assemblies, setAssemblies] = useState<Assembly[]>(() => safeJsonParse('te_assemblies', []));

  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const t = getTranslation(config.language);

  useEffect(() => {
    const savedUser = localStorage.getItem('te_session');
    if (savedUser) {
      const parsed = safeJsonParse('te_session', null);
      if (parsed) setCurrentUser(parsed);
      else localStorage.removeItem('te_session');
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => { if (isInitialized) {
    try {
      localStorage.setItem('te_users', JSON.stringify(users));
      localStorage.setItem('te_config', JSON.stringify(config));
      localStorage.setItem('te_members', JSON.stringify(members));
      localStorage.setItem('te_transactions', JSON.stringify(transactions));
      localStorage.setItem('te_board', JSON.stringify(board));
      localStorage.setItem('te_board_period', boardPeriod);
      localStorage.setItem('te_assemblies', JSON.stringify(assemblies));
    } catch (e) {
      console.error("Error al persistir datos:", e);
    }
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
    if (confirm("⚠️ ¿RESTABLECER TODO A CERO?")) {
      localStorage.clear();
      window.location.reload();
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

  if (!isInitialized) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <Login users={users} onLogin={handleLogin} />;

  const menuItems = [
    { id: 'dashboard' as const, icon: <Icons.Dashboard />, label: t.nav.dashboard },
    { id: 'members' as const, icon: <Icons.Users />, label: t.nav.members },
    { id: 'treasury' as const, icon: <Icons.Wallet />, label: t.nav.treasury },
    { id: 'board' as const, icon: <Icons.Shield />, label: t.nav.board },
    { id: 'assemblies' as const, icon: <Icons.Calendar />, label: t.nav.assemblies },
    { id: 'attendance' as const, icon: <Icons.Clipboard />, label: t.nav.attendance },
    { id: 'settings' as const, icon: <Icons.Briefcase />, label: t.nav.settings },
    { id: 'support' as const, icon: <Icons.Settings />, label: t.nav.support },
  ];

  const tradeParts = config.tradeName.split(' ');

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <aside className={`sidebar-glass fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="p-8">
            <h1 className="flex items-center text-2xl font-black italic tracking-tighter text-white">
              <span className="text-emerald-500 mr-2">🌳</span>
              {tradeParts[0]} <span className="text-emerald-400 ml-1">{tradeParts.slice(1).join(' ')}</span>
            </h1>
          </div>
          <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
            {menuItems.map(item => hasPermission(item.id) && (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                className={`group flex w-full items-center rounded-2xl px-6 py-4 text-sm font-bold transition-all ${view === item.id ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="mr-4">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-6 bg-slate-950/50 border-t border-white/5">
            <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-xl bg-rose-500/10 py-3 text-xs font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
              <span className="mr-2"><Icons.Logout /></span> {t.nav.logout}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 md:hidden">
          <div className="font-black italic text-slate-900 tracking-tight">{config.tradeName}</div>
          <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg bg-slate-100 p-2 text-slate-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M12 12h8M4 18h16" /></svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
          <div className="mx-auto max-w-7xl page-transition">
            {view === 'dashboard' && <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser} config={config} />}
            {view === 'members' && <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} transactions={transactions} board={board} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} currentUser={currentUser} config={config} />}
            {view === 'treasury' && <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={handleViewMember} currentUser={currentUser} />}
            {view === 'board' && <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} currentUser={currentUser} config={config} />}
            {view === 'assemblies' && <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} currentUser={currentUser} config={config} />}
            {view === 'attendance' && <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} currentUser={currentUser} config={config} />}
            {view === 'support' && <SupportManagement users={users} setUsers={setUsers} />}
            {view === 'settings' && <SettingsManagement config={config} setConfig={setConfig} onExportBackup={() => {}} onResetSystem={handleResetSystem} />}
          </div>
        </main>
      </div>
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"></div>}
    </div>
  );
};

export default App;
