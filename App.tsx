
import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, BoardRole, CommitteeConfig, SystemRole, Language } from './types';
import { Icons } from './constants';
import { getTranslation } from './services/i18nService';
import { isValidJson } from './services/apiService';
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
 * Función de parseo ultra-segura. 
 * Si detecta que los datos guardados son HTML (error común por redirecciones),
 * limpia la clave y devuelve el fallback para evitar el error "Unexpected token <".
 */
const safeJsonParse = (key: string, fallback: any) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    
    if (!isValidJson(data)) {
      console.error(`[Tierra Esperanza] Error crítico: La clave '${key}' contiene HTML o datos inválidos. Limpiando almacenamiento.`);
      localStorage.removeItem(key); // Limpieza automática del error
      return fallback;
    }
    
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parseando ${key}:`, e);
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
    const savedUser = safeJsonParse('te_session', null);
    if (savedUser) setCurrentUser(savedUser);
    setIsInitialized(true);
  }, []);

  useEffect(() => { if (isInitialized) {
    // Al guardar, también verificamos que no estemos guardando basura
    const stateToSave = [
      { k: 'te_users', v: users },
      { k: 'te_config', v: config },
      { k: 'te_members', v: members },
      { k: 'te_transactions', v: transactions },
      { k: 'te_board', v: board },
      { k: 'te_assemblies', v: assemblies }
    ];

    stateToSave.forEach(({k, v}) => {
      localStorage.setItem(k, JSON.stringify(v));
    });
    localStorage.setItem('te_board_period', boardPeriod);
  }}, [users, config, members, transactions, board, boardPeriod, assemblies, isInitialized]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('te_session', JSON.stringify(user));
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('te_session');
    setIsSidebarOpen(false);
    setView('dashboard');
  };

  const hasPermission = (viewId: ViewId): boolean => {
    if (!currentUser) return false;
    const allowedRoles = PERMISSIONS[viewId];
    return allowedRoles.includes('ANY') || allowedRoles.includes(currentUser.role);
  };

  const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-8 shadow-inner border border-rose-100">
        <Icons.Shield />
      </div>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Acceso Restringido</h3>
      <p className="text-slate-500 max-w-md font-medium leading-relaxed">
        Lo sentimos, tu rol actual (<span className="text-rose-600 font-black uppercase tracking-widest text-[10px]">{currentUser?.role}</span>) no tiene los permisos necesarios para gestionar esta sección.
      </p>
      <button 
        onClick={() => setView('dashboard')}
        className="mt-10 px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl active:scale-95"
      >
        Volver al Inicio
      </button>
    </div>
  );

  const renderCurrentView = () => {
    if (!hasPermission(view)) return <AccessDenied />;

    switch (view) {
      case 'dashboard': return <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser!} config={config} />;
      case 'members': return <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} transactions={transactions} board={board} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} currentUser={currentUser!} config={config} />;
      case 'treasury': return <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={(id) => { setViewingMemberId(id); setView('members'); }} currentUser={currentUser!} />;
      case 'board': return <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} currentUser={currentUser!} config={config} />;
      case 'assemblies': return <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} currentUser={currentUser!} config={config} />;
      case 'attendance': return <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} currentUser={currentUser!} config={config} />;
      case 'support': return <SupportManagement users={users} setUsers={setUsers} />;
      case 'settings': return <SettingsManagement config={config} setConfig={setConfig} onExportBackup={() => {}} onResetSystem={() => {}} />;
      default: return <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser!} config={config} />;
    }
  };

  if (!isInitialized) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex h-screen overflow-hidden mesh-bg">
      <aside className={`sidebar-glass fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="p-10">
            <h1 className="flex items-center text-2xl font-black italic tracking-tighter text-white">
              <span className="text-teal-400 mr-2 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]">🌳</span>
              {tradeParts[0]} <span className="text-indigo-400 ml-1 font-black">{tradeParts.slice(1).join(' ')}</span>
            </h1>
            <div className="mt-8 p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center space-x-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400/20 to-indigo-400/20 flex items-center justify-center text-teal-400 border border-white/5">
                  <Icons.Dashboard />
               </div>
               <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest leading-none">Mi Perfil</p>
                  <p className="text-white text-xs font-bold mt-1.5 truncate uppercase opacity-80">{currentUser.role.replace('_', ' ')}</p>
               </div>
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-6 overflow-y-auto mt-2">
            {menuItems.map(item => hasPermission(item.id) && (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                className={`group flex w-full items-center rounded-[1.5rem] px-6 py-4.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${view === item.id ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(20,184,166,0.3)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className={`mr-4 transition-transform group-hover:scale-110 ${view === item.id ? 'text-white' : 'text-slate-500 group-hover:text-teal-400'}`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-8 bg-slate-950/30 border-t border-white/5">
            <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-2xl bg-rose-500/10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
              <span className="mr-3"><Icons.Logout /></span> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md px-10 md:hidden">
          <div className="font-black italic text-slate-900 tracking-tight text-xl">{config.tradeName}</div>
          <button onClick={() => setIsSidebarOpen(true)} className="rounded-2xl bg-white p-3 text-slate-600 shadow-sm border border-slate-100">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M12 12h8M4 18h16" /></svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 md:p-14 lg:p-20">
          <div className="mx-auto max-w-7xl page-transition">
            {renderCurrentView()}
          </div>
        </main>
      </div>
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"></div>}
    </div>
  );
};

export default App;
