
import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, BoardRole, CommitteeConfig, SystemRole, Language, Document, DocumentType, DocumentStatus } from './types';
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
import Secretariat from './components/Secretariat';
import Login from './components/Login';

const INITIAL_USERS: User[] = [
  { id: '1', username: 'soporte', password: 'soporte.password', role: 'SUPPORT', name: 'Soporte Técnico' },
  { id: '2', username: 'admin', password: 'Lio061624', role: 'ADMINISTRATOR', name: 'Administrador' },
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
  language: Language.ES,
  logoUrl: ''
};

const EMPTY_PERSON = { name: '', rut: '', phone: '' };

const INITIAL_BOARD: BoardPosition[] = [
  { role: BoardRole.PRESIDENT, primary: { name: 'Juan Pérez', rut: '12.345.678-9', phone: '+56912345678' }, substitute: { ...EMPTY_PERSON } },
  { role: BoardRole.SECRETARY, primary: { name: 'María López', rut: '15.678.901-2', phone: '+56987654321' }, substitute: { ...EMPTY_PERSON } },
  { role: BoardRole.TREASURER, primary: { name: 'Carlos Ruiz', rut: '18.901.234-5', phone: '+56955566677' }, substitute: { ...EMPTY_PERSON } }
];

// Se inicializa como vacío para que el reseteo a cero sea efectivo
const INITIAL_DOCUMENTS: Document[] = [];

type ViewId = 'dashboard' | 'members' | 'treasury' | 'board' | 'attendance' | 'assemblies' | 'secretariat' | 'support' | 'settings';

const PERMISSIONS: Record<ViewId, (SystemRole | 'ANY')[]> = {
  dashboard: ['ANY'],
  members: ['ANY'],
  treasury: [BoardRole.TREASURER, BoardRole.PRESIDENT, 'SUPPORT', 'ADMINISTRATOR'],
  board: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  assemblies: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  attendance: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  secretariat: [BoardRole.PRESIDENT, BoardRole.SECRETARY, 'SUPPORT', 'ADMINISTRATOR'],
  support: ['SUPPORT', 'ADMINISTRATOR'],
  settings: ['SUPPORT', 'ADMINISTRATOR']
};

const safeJsonParse = (key: string, fallback: any) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    if (!isValidJson(data)) {
      localStorage.removeItem(key);
      return fallback;
    }
    return JSON.parse(data);
  } catch (e) {
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
  const [documents, setDocuments] = useState<Document[]>(() => safeJsonParse('te_documents', INITIAL_DOCUMENTS));

  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const t = getTranslation(config.language);

  useEffect(() => {
    const savedUser = safeJsonParse('te_session', null);
    if (savedUser) setCurrentUser(savedUser);
    
    // Migración: Asegurar que el usuario admin tenga la contraseña solicitada si aún tiene la antigua
    setUsers((prev: User[]) => prev.map((u: User) => {
      if (u.username === 'admin' && u.password === 'admin.password') {
        return { ...u, password: 'Lio061624' };
      }
      return u;
    }));
    
    setIsInitialized(true);
  }, []);

  useEffect(() => { if (isInitialized) {
    localStorage.setItem('te_users', JSON.stringify(users));
    localStorage.setItem('te_config', JSON.stringify(config));
    localStorage.setItem('te_members', JSON.stringify(members));
    localStorage.setItem('te_transactions', JSON.stringify(transactions));
    localStorage.setItem('te_board', JSON.stringify(board));
    localStorage.setItem('te_assemblies', JSON.stringify(assemblies));
    localStorage.setItem('te_documents', JSON.stringify(documents));
    localStorage.setItem('te_board_period', boardPeriod);
  }}, [users, config, members, transactions, board, boardPeriod, assemblies, documents, isInitialized]);

  const handleResetSystem = () => {
    if (confirm("⚠️ ¡ADVERTENCIA CRÍTICA!\n\nEsta acción borrará permanentemente TODOS los datos registrados localmente (Socios, Finanzas, Actas, Documentos de Secretaría y Configuración Personalizada).\n\n¿Está absolutamente seguro de continuar?")) {
      // Limpiamos todo el localStorage para evitar persistencia de datos corruptos
      localStorage.clear();
      // Recargamos la aplicación para forzar el estado inicial
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      users,
      config,
      members,
      transactions,
      board,
      boardPeriod,
      assemblies,
      documents,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `respaldo_te_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackup = (data: any) => {
    if (!data || typeof data !== 'object') {
      alert("El archivo de respaldo no es válido.");
      return;
    }

    try {
      if (data.users) setUsers(data.users);
      if (data.config) setConfig(data.config);
      if (data.members) setMembers(data.members);
      if (data.transactions) setTransactions(data.transactions);
      if (data.board) setBoard(data.board);
      if (data.boardPeriod) setBoardPeriod(data.boardPeriod);
      if (data.assemblies) setAssemblies(data.assemblies);
      if (data.documents) setDocuments(data.documents);
      
      alert("Sistema restaurado con éxito desde el archivo de respaldo.");
    } catch (error) {
      console.error("Error al importar respaldo:", error);
      alert("Ocurrió un error al procesar el archivo de respaldo.");
    }
  };

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

  const renderCurrentView = () => {
    if (!hasPermission(view)) return <div className="text-center p-20 font-bold">Acceso Denegado</div>;

    switch (view) {
      case 'dashboard': return <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser!} config={config} />;
      case 'members': return <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} transactions={transactions} board={board} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} currentUser={currentUser!} config={config} />;
      case 'treasury': return <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={(id) => { setViewingMemberId(id); setView('members'); }} currentUser={currentUser!} config={config} board={board} />;
      case 'board': return <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} currentUser={currentUser!} config={config} />;
      case 'assemblies': return <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} currentUser={currentUser!} config={config} />;
      case 'attendance': return <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} currentUser={currentUser!} config={config} />;
      case 'secretariat': return <Secretariat documents={documents} setDocuments={setDocuments} config={config} board={board} currentUser={currentUser!} />;
      case 'support': return <SupportManagement users={users} setUsers={setUsers} />;
      case 'settings': return <SettingsManagement config={config} setConfig={setConfig} onExportBackup={handleExportBackup} onImportBackup={handleImportBackup} onResetSystem={handleResetSystem} />;
      default: return <Dashboard members={members} transactions={transactions} assemblies={assemblies} currentUser={currentUser!} config={config} />;
    }
  };

  if (!isInitialized) return null;
  if (!currentUser) return <Login users={users} onLogin={handleLogin} config={config} />;

  const menuItems = [
    { id: 'dashboard' as const, icon: <Icons.Dashboard />, label: t.nav.dashboard },
    { id: 'members' as const, icon: <Icons.Users />, label: t.nav.members },
    { id: 'treasury' as const, icon: <Icons.Wallet />, label: t.nav.treasury },
    { id: 'board' as const, icon: <Icons.Shield />, label: t.nav.board },
    { id: 'assemblies' as const, icon: <Icons.Calendar />, label: t.nav.assemblies },
    { id: 'attendance' as const, icon: <Icons.Clipboard />, label: t.nav.attendance },
    { id: 'secretariat' as const, icon: <Icons.DocumentText />, label: 'Secretaría' },
    { id: 'settings' as const, icon: <Icons.Briefcase />, label: t.nav.settings },
    { id: 'support' as const, icon: <Icons.Settings />, label: t.nav.support },
  ];

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <aside className={`sidebar-glass fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="p-10 flex flex-col items-center gap-4">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-2xl bg-white/10 p-2" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
                🌳
              </div>
            )}
            <h1 className="text-xl font-black italic text-white tracking-tighter text-center">{config.tradeName}</h1>
          </div>
          <nav className="flex-1 space-y-2 px-6 overflow-y-auto">
            {menuItems.map(item => hasPermission(item.id) && (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                className={`group flex w-full items-center rounded-3xl px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <span className="mr-4">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="px-8 py-6 border-t border-white/5">
            <div className="flex items-center gap-4 mb-6 px-2">
              {currentUser.logoUrl ? (
                <img src={currentUser.logoUrl} alt={currentUser.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black text-white">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate uppercase tracking-wider">{currentUser.name}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-2xl bg-rose-500/10 py-4 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 hover:text-white transition-all">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md px-10 md:hidden">
          <div className="font-black italic text-slate-900 text-xl">{config.tradeName}</div>
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
    </div>
  );
};

export default App;
