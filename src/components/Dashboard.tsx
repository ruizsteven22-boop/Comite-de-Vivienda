
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Member, Transaction, Assembly, TransactionType, User, BoardRole, CommitteeConfig } from '../types';
import { getFinancialSummary } from '../services/geminiService';
import { getTranslation } from '../services/i18nService';

// Lazy load recharts components
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));

interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  assemblies: Assembly[];
  currentUser: User;
  config: CommitteeConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ members, transactions, assemblies, currentUser, config }) => {
  const [aiSummary, setAiSummary] = useState<string>('Analizando registros contables...');
  const [currentTime, setCurrentTime] = useState(new Date());

  const t = getTranslation(config.language);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isTesoOrAdmin = currentUser.role === BoardRole.TREASURER || 
                        currentUser.role === 'SUPPORT' || 
                        currentUser.role === 'ADMINISTRATOR' ||
                        currentUser.role === BoardRole.PRESIDENT;

  // Calculate monthly cash flow data for the last 6 months
  const cashFlowData = useMemo(() => {
    if (!isTesoOrAdmin) return [];

    const now = new Date();
    interface MonthData {
      label: string;
      month: number;
      year: number;
      income: number;
      expense: number;
    }
    const months: MonthData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('es-CL', { month: 'short' }).toUpperCase(),
        month: d.getMonth(),
        year: d.getFullYear(),
        income: 0,
        expense: 0
      });
    }

    transactions.forEach((tx: any) => {
      const txDate = new Date(tx.date);
      const monthIdx = months.findIndex(m => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
      if (monthIdx !== -1) {
        if (tx.type === TransactionType.INCOME) months[monthIdx].income += tx.amount;
        else months[monthIdx].expense += tx.amount;
      }
    });

    return months;
  }, [transactions, isTesoOrAdmin]);

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isTesoOrAdmin) {
        setAiSummary(`Buen día ${currentUser.name}. El sistema está operativo y el censo de socios se mantiene actualizado.`);
        return;
      }
      if (transactions.length > 0) {
        const summary = await getFinancialSummary(transactions);
        setAiSummary(summary || 'El reporte no se pudo generar. Revise el balance manual.');
      } else {
        setAiSummary('Inicie operaciones financieras para ver el análisis de inteligencia artificial sobre el flujo de caja.');
      }
    };
    fetchSummary();
  }, [transactions, currentUser, isTesoOrAdmin]);

  const nextAssembly = assemblies
    .filter(a => a.status === 'Programada' || a.status === 'En Curso')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-6">
          {config.logoUrl && (
            <img src={config.logoUrl} alt={`${config.tradeName} Logo`} className="w-24 h-24 object-contain rounded-3xl bg-white shadow-xl p-3 border border-slate-100" />
          )}
          <div className="space-y-2">
            <h2 className="text-6xl font-black tracking-tighter text-slate-900 leading-tight flex items-center gap-4">
              {t.dashboard.welcome}, <br className="hidden sm:block md:hidden" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">{currentUser.name.split(' ')[0]}</span>
              {currentUser.logoUrl && (
                <img src={currentUser.logoUrl} alt={`Avatar de ${currentUser.name}`} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg" />
              )}
            </h2>
            <div className="flex items-center space-x-3">
               <span className="h-1.5 w-12 bg-indigo-600 rounded-full"></span>
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">{t.dashboard.subtitle}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex h-16 items-center rounded-3xl bg-white p-2 pr-8 shadow-sm border border-slate-100">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mr-4 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Fecha Actual</span>
              <span className="font-black text-slate-800 text-sm">{currentTime.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
          <div className="flex h-16 items-center rounded-3xl bg-slate-900 p-2 pr-8 shadow-2xl shadow-indigo-200">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mr-4 text-indigo-300">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Hora Sistema</span>
              <span className="font-black text-white text-sm tabular-nums">{currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Censo Social', val: members.length, sub: 'Socios Inscritos', color: 'bg-indigo-600', light: 'bg-indigo-50', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { label: 'Saldo de Caja', val: isTesoOrAdmin ? `$${balance.toLocaleString('es-CL')}` : '---', sub: 'Fondos Disponibles', color: 'bg-emerald-600', light: 'bg-emerald-50', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Ingresos', val: isTesoOrAdmin ? `$${totalIncome.toLocaleString('es-CL')}` : '---', sub: 'Histórico Total', color: 'bg-blue-600', light: 'bg-blue-50', icon: 'M7 11l5-5m0 0l5 5m-5-5v12' },
          { label: 'Participación', val: assemblies.length, sub: 'Asambleas Citadas', color: 'bg-fuchsia-600', light: 'bg-fuchsia-50', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        ].map((kpi) => (
          <div key={kpi.label} className="group relative overflow-hidden rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-2 duration-500">
            <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] ${kpi.light} transition-all group-hover:scale-110`}>
              <svg className={`h-8 w-8 ${kpi.color.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={kpi.icon} /></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{kpi.val}</p>
            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.sub}</p>
            <div className={`absolute bottom-0 left-0 h-1.5 w-0 ${kpi.color} transition-all duration-700 group-hover:w-full`}></div>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-8 rounded-[3.5rem] bg-white p-12 shadow-sm border border-slate-100 flex flex-col group">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Flujo de Caja Mensual</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center">
                 <span className="w-8 h-px bg-slate-200 mr-3"></span> Analítica Financiera Últimos 6 Meses
               </p>
            </div>
            <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-6 px-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ingresos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500 shadow-lg shadow-rose-200"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Egresos</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[450px] w-full">
            {isTesoOrAdmin ? (
              <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-300 font-bold">Cargando gráficos...</div>}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }}
                      tickFormatter={(val) => `$${val / 1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 20 }}
                      contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', padding: '24px' }}
                      itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[10, 10, 10, 10]} barSize={40} />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[10, 10, 10, 10]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 italic font-bold border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                Acceso restringido a visualización de flujos contables.
              </div>
            )}
          </div>
          
          <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between text-slate-400">
             <p className="text-[10px] font-bold uppercase tracking-widest italic">Datos actualizados en tiempo real según registros de tesorería</p>
             <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Reporte Detallado →</button>
          </div>
        </div>

        {/* AI & Assembly Section */}
        <div className="lg:col-span-4 space-y-10">
          {/* AI SUMMARY BOX */}
          <div className="rounded-[3.5rem] bg-slate-900 p-12 text-white shadow-2xl relative overflow-hidden group min-h-[320px] flex flex-col justify-between">
            <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
              <svg className="h-48 w-48 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-400 to-fuchsia-400 flex items-center justify-center animate-spin-slow">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Resumen Estratégico AI</p>
              </div>
              <div className="text-sm leading-relaxed text-indigo-50/80 font-medium italic relative z-10">
                "{aiSummary}"
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Powered by Gemini Engine</span>
               <div className="flex space-x-1">
                 <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse"></div>
                 <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                 <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse delay-150"></div>
               </div>
            </div>
          </div>

          {/* NEXT ASSEMBLY HERO CARD */}
          <div className="rounded-[3.5rem] bg-white p-12 shadow-sm border border-slate-100 relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 border-b border-slate-50 pb-4">Próxima Citación</p>
            
            {nextAssembly ? (
              <div className="space-y-10">
                <div className="flex items-start space-x-8">
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-200">
                    <span className="text-[10px] font-black uppercase opacity-60">{nextAssembly.date.split('-')[1]}</span>
                    <span className="text-4xl font-black leading-none">{nextAssembly.date.split('-')[2]}</span>
                  </div>
                  <div className="flex-1">
                    <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-4 ${
                      nextAssembly.type === 'Ordinaria' ? 'bg-indigo-50 text-indigo-700' : 'bg-fuchsia-50 text-fuchsia-700'
                    }`}>
                      Asamblea {nextAssembly.type}
                    </span>
                    <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{nextAssembly.description}</h4>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-slate-50">
                   <div className="flex items-center text-xs font-bold text-slate-500">
                      <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center mr-4 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      Hora: {nextAssembly.summonsTime} hrs.
                   </div>
                   <div className="flex items-center text-xs font-bold text-slate-500">
                      <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center mr-4 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      </div>
                      Ubicación: {nextAssembly.location || 'Sede Social'}
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border-4 border-dashed border-slate-50 rounded-[2.5rem] bg-slate-50/30">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No hay sesiones pendientes</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 italic opacity-60">Todas las asambleas están cerradas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
