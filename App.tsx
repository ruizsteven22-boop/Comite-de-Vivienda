
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
  
  // Persistencia de datos simple
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
    // Redirigir según rol si es necesario
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

  // Lógica de Control de Acceso (ACL)
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
      case 'support': return false; // Solo soporte/admin
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <aside className={`w-full md:w-64 flex-shrink-0 text-white flex flex-col ${
        currentUser.role === 'SUPPORT' ? 'bg-indigo-900' : 'bg-emerald-800'
      }`}>
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase">Tierra Esperanza</h1>
          <p className="text-emerald-200 text-[10px] mt-1 uppercase tracking-[0.2em] font-black opacity-60">Gestión de Comité</p>
        </div>
        
        <nav className="mt-6 px-4 space-y-2 flex-1">
          {canAccess('dashboard') && (
            <button 
              onClick={() => { setView('dashboard'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'dashboard' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5'}`}
            >
              <Icons.Dashboard />
              <span className="font-bold text-sm">Resumen</span>
            </button>
          )}
          
          {canAccess('members') && (
            <button 
              onClick={() => { setView('members'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'members' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5'}`}
            >
              <Icons.Users />
              <span className="font-bold text-sm">Socios</span>
            </button>
          )}
          
          {canAccess('treasury') && (
            <button 
              onClick={() => { setView('treasury'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'treasury' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5'}`}
            >
              <Icons.Wallet />
              <span className="font-bold text-sm">Tesorería</span>
            </button>
          )}
          
          {canAccess('board') && (
            <button 
              onClick={() => { setView('board'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'board' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5'}`}
            >
              <Icons.Shield />
              <span className="font-bold text-sm">Directiva</span>
            </button>
          )}

          {canAccess('assemblies') && (
            <button 
              onClick={() => { setView('assemblies'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'assemblies' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5'}`}
            >
              <Icons.Calendar />
              <span className="font-bold text-sm">Asambleas</span>
            </button>
          )}

          {canAccess('attendance') && (
            <button 
              onClick={() => { setView('attendance'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'attendance' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5'}`}
            >
              <Icons.Clipboard />
              <span className="font-bold text-sm">Asistencia</span>
            </button>
          )}
        </nav>

        {(currentUser.role === 'SUPPORT' || currentUser.role === 'ADMINISTRATOR') && (
          <div className="px-4 mb-4">
             <button 
              onClick={() => { setView('support'); setViewingMemberId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition ${view === 'support' ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-white/40 hover:bg-white/5'}`}
            >
              <Icons.Settings />
              <span className="font-bold text-sm">Soporte y Seguridad</span>
            </button>
          </div>
        )}

        <div className="p-6 border-t border-white/10 bg-black/10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-white shadow-inner ring-1 ring-white/20">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate">{currentUser.name}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-xs font-black transition uppercase tracking-widest"
          >
            <Icons.Logout />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-12">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
