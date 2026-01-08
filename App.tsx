
import React, { useState, useEffect } from 'react';
import { Member, Transaction, BoardPosition, Assembly, User, MemberStatus, TransactionType, BoardRole, AssemblyType, AssemblyStatus, PaymentMethod } from './types';
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
  { id: '3', username: 'presi', password: 'te2024', role: BoardRole.PRESIDENT, name: 'Carlos Valdivia' },
  { id: '4', username: 'teso', password: 'te2024', role: BoardRole.TREASURER, name: 'Raúl Sánchez' },
  { id: '5', username: 'secre', password: 'te2024', role: BoardRole.SECRETARY, name: 'Marta Lagos' }
];

const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    rut: '12.345.678-9',
    name: 'Juan Pérez González',
    joinDate: '2023-01-15',
    status: MemberStatus.ACTIVE,
    email: 'juan.perez@email.com',
    address: 'Calle Esperanza 123, Block B, Depto 102',
    phone: '+56912345678',
    photoUrl: 'https://picsum.photos/seed/juan/200/200',
    familyMembers: [
      { id: 'f1', name: 'María Soto', rut: '18.765.432-1', relationship: 'Cónyuge' },
      { id: 'f2', name: 'Pedro Pérez', rut: '24.555.666-k', relationship: 'Hijo' }
    ]
  },
  {
    id: '2',
    rut: '15.222.333-4',
    name: 'Ana María Rojas',
    joinDate: '2023-02-10',
    status: MemberStatus.ACTIVE,
    email: 'ana.rojas@email.com',
    address: 'Av. Las Parcelas 456',
    phone: '+56987654321',
    photoUrl: 'https://picsum.photos/seed/ana/200/200',
    familyMembers: []
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'T1', date: '2024-05-01', amount: 15000, type: TransactionType.INCOME, paymentMethod: PaymentMethod.TRANSFER, description: 'Cuota Mensual Mayo', memberId: '1' },
  { id: 'T2', date: '2024-05-02', amount: 5000, type: TransactionType.EXPENSE, paymentMethod: PaymentMethod.CASH, description: 'Artículos de limpieza sede' },
  { id: 'T3', date: '2024-05-05', amount: 15000, type: TransactionType.INCOME, paymentMethod: PaymentMethod.TRANSFER, description: 'Cuota Mensual Mayo', memberId: '2' }
];

const MOCK_BOARD: BoardPosition[] = [
  {
    role: BoardRole.PRESIDENT,
    primary: { name: 'Carlos Valdivia', rut: '10.111.222-3', phone: '+56911111111' },
    substitute: { name: 'Elena Torres', rut: '11.222.333-4', phone: '+56922222222' }
  },
  {
    role: BoardRole.SECRETARY,
    primary: { name: 'Marta Lagos', rut: '12.333.444-5', phone: '+56933333333' },
    substitute: { name: 'Diego Ríos', rut: '13.444.555-6', phone: '+56944444444' }
  },
  {
    role: BoardRole.TREASURER,
    primary: { name: 'Raúl Sánchez', rut: '14.555.666-7', phone: '+56955555555' },
    substitute: { name: 'Sonia Parra', rut: '15.666.777-8', phone: '+56966666666' }
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'members' | 'treasury' | 'board' | 'attendance' | 'assemblies' | 'support'>('dashboard');
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('te_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [board, setBoard] = useState<BoardPosition[]>(MOCK_BOARD);
  const [boardPeriod, setBoardPeriod] = useState<string>('2024 - 2026');
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  
  const [assemblies, setAssemblies] = useState<Assembly[]>(() => {
    const saved = localStorage.getItem('te_assemblies');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'A1', 
        date: '2024-05-20', 
        summonsTime: '19:30',
        location: 'Sede Comunitaria Tierra Esperanza',
        description: 'Asamblea Mensual - Avances Proyecto', 
        attendees: [], 
        type: AssemblyType.ORDINARY, 
        status: AssemblyStatus.SCHEDULED 
      }
    ];
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('te_session');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem('te_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('te_assemblies', JSON.stringify(assemblies));
  }, [assemblies]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('te_session', JSON.stringify(user));
    if (user.role === BoardRole.TREASURER) setView('treasury');
    else setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('te_session');
  };

  const handleViewMember = (id: string) => {
    if (canAccess('members')) {
      setViewingMemberId(id);
      setView('members');
    }
  };

  const canAccess = (viewName: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPPORT' || currentUser.role === 'ADMINISTRATOR') return true;

    switch (viewName) {
      case 'dashboard': return true;
      case 'members': return currentUser.role !== BoardRole.TREASURER;
      case 'treasury': return currentUser.role === BoardRole.TREASURER;
      case 'board': return currentUser.role !== BoardRole.TREASURER;
      case 'assemblies': return currentUser.role !== BoardRole.TREASURER;
      case 'attendance': return currentUser.role !== BoardRole.TREASURER;
      case 'support': return false;
      default: return false;
    }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard members={members} transactions={transactions} assemblies={assemblies} />;
      case 'members': return <MemberManagement members={members} setMembers={setMembers} assemblies={assemblies} viewingMemberId={viewingMemberId} onClearViewingMember={() => setViewingMemberId(null)} />;
      case 'treasury': return <Treasury transactions={transactions} setTransactions={setTransactions} members={members} onViewMember={handleViewMember} />;
      case 'board': return <BoardManagement board={board} setBoard={setBoard} boardPeriod={boardPeriod} setBoardPeriod={setBoardPeriod} members={members} />;
      case 'assemblies': return <AssemblyManagement assemblies={assemblies} setAssemblies={setAssemblies} members={members} board={board} />;
      case 'attendance': return <Attendance members={members} assemblies={assemblies} setAssemblies={setAssemblies} board={board} />;
      case 'support': return <SupportManagement users={users} setUsers={setUsers} />;
      default: return <Dashboard members={members} transactions={transactions} assemblies={assemblies} />;
    }
  };

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  const isSupport = currentUser.role === 'SUPPORT' || currentUser.role === 'ADMINISTRATOR';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F1F5F9]">
      {/* Sidebar con Contraste Mejorado */}
      <aside className={`w-full md:w-72 flex-shrink-0 text-white flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden relative z-50 ${
        isSupport 
        ? 'bg-gradient-to-br from-[#1e1b4b] via-[#1e1b4b] to-[#312e81]' 
        : 'bg-gradient-to-br from-[#064e3b] via-[#064e3b] to-[#0f766e]'
      }`}>
        {/* Glow Decorativo más tenue para no lavar el texto */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/10 blur-[100px] rounded-full"></div>
        
        <div className="p-10 relative">
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase">
            Tierra<br/>
            <span className={isSupport ? 'text-indigo-300' : 'text-emerald-400'}>Esperanza</span>
          </h1>
          <div className={`h-1 w-12 mt-4 rounded-full ${isSupport ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
        </div>
        
        <nav className="mt-4 px-6 space-y-2 flex-1 relative">
          {[
            { id: 'dashboard', icon: <Icons.Dashboard />, label: 'Panel Principal' },
            { id: 'members', icon: <Icons.Users />, label: 'Comunidad' },
            { id: 'treasury', icon: <Icons.Wallet />, label: 'Finanzas' },
            { id: 'board', icon: <Icons.Shield />, label: 'Directiva' },
            { id: 'assemblies', icon: <Icons.Calendar />, label: 'Eventos' },
            { id: 'attendance', icon: <Icons.Clipboard />, label: 'Asistencia' },
          ].map((item) => (
            canAccess(item.id) && (
              <button 
                key={item.id}
                onClick={() => { setView(item.id as any); setViewingMemberId(null); }}
                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  view === item.id 
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-md ring-1 ring-white/30' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {view === item.id && (
                  <div className={`absolute left-0 top-0 h-full w-1.5 ${isSupport ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                )}
                <span className={`transition-transform duration-500 ${view === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className={`text-sm tracking-wide font-bold`}>{item.label}</span>
              </button>
            )
          ))}
        </nav>

        {isSupport && (
          <div className="px-6 mb-4 relative">
             <button 
              onClick={() => { setView('support'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                view === 'support' ? 'bg-indigo-400/30 text-white ring-1 ring-white/40 shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icons.Settings />
              <span className="font-bold text-sm">Configuración</span>
            </button>
          </div>
        )}

        <div className="p-8 border-t border-white/10 bg-black/20 backdrop-blur-lg">
          <div className="flex items-center space-x-4 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl relative group ${
              isSupport ? 'bg-indigo-600 border border-indigo-400' : 'bg-emerald-600 border border-emerald-400'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate text-white">{currentUser.name}</p>
              <p className={`text-[10px] uppercase tracking-widest font-black truncate text-white/60`}>{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border border-red-500/30"
          >
            <Icons.Logout />
            <span>Desconectar</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
