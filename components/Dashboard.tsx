
import React, { useState, useEffect } from 'react';
import { Member, Transaction, Assembly, TransactionType, User, BoardRole, CommitteeConfig } from '../types';
import { getFinancialSummary } from '../services/geminiService';
import { getTranslation } from '../services/i18nService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
        setAiSummary(`Buen día ${currentUser.name}. El sistema está operativo y al día.`);
        return;
      }
      if (transactions.length > 0) {
        const summary = await getFinancialSummary(transactions);
        setAiSummary(summary || 'El reporte no se pudo generar. Revise el balance manual.');
      } else {
        setAiSummary('Inicie operaciones financieras para ver el análisis de inteligencia artificial.');
      }
    };
    fetchSummary();
  }, [transactions, currentUser, isTesoOrAdmin]);

  const chartData = [
    { name: 'Ingresos', value: totalIncome },
    { name: 'Egresos', value: totalExpense },
  ];

  const nextAssembly = assemblies
    .filter(a => a.status === 'Programada' || a.status === 'En Curso')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="page-transition">
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">
            {t.dashboard.welcome}, <br className="md:hidden" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">{currentUser.name.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex h-14 items-center rounded-[1.5rem] bg-white/70 backdrop-blur-md px-8 font-black text-slate-700 shadow-sm border border-white/50 text-sm uppercase tracking-widest">
            {currentTime.toLocaleDateString(config.language === 'es' ? 'es-CL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="flex h-14 items-center rounded-[1.5rem] bg-slate-900 px-8 font-black text-white shadow-xl shadow-slate-200 text-sm tracking-widest tabular-nums">
            <span className="text-violet-400 animate-pulse mr-3 text-lg">●</span>
            {currentTime.toLocaleTimeString(config.language === 'es' ? 'es-CL' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.dashboard.kpiMembers, val: members.length, sub: 'Socios Activos', color: 'from-violet-500 to-indigo-600', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7' },
          { label: t.dashboard.kpiCash, val: isTesoOrAdmin ? `$${balance.toLocaleString('es-CL')}` : 'Acceso Restringido', sub: 'Saldo Disponible', color: 'from-emerald-500 to-teal-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2' },
          { label: t.dashboard.kpiIncome, val: isTesoOrAdmin ? `$${totalIncome.toLocaleString('es-CL')}` : '***', sub: 'Recaudación Total', color: 'from-blue-500 to-cyan-600', icon: 'M7 12l3-3 3 3 4-4' },
          { label: t.dashboard.kpiSessions, val: assemblies.length, sub: 'Asambleas Totales', color: 'from-fuchsia-500 to-purple-600', icon: 'M8 7V3m8 4V3m-9 8h10' },
        ].map((kpi, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-xl p-8 shadow-sm border border-white/50 transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${kpi.color} opacity-[0.08] transition-transform group-hover:scale-150`}></div>
            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.color} text-white shadow-lg`}>
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={kpi.icon} /></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{kpi.val}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[3rem] bg-white/80 backdrop-blur-xl p-10 shadow-sm border border-white/50 flex flex-col">
          <div className="mb-10 flex items-center justify-between">
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Análisis de Flujos</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativa de Tesorería Anual</p>
            </div>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recaudado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-200"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Gastado</span>
              </div>
            </div>
          </div>
          <div className="h-96 w-full">
            {isTesoOrAdmin ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8', textTransform: 'uppercase' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                  />
                  <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={80}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 italic font-bold">Sin privilegios de visualización contable.</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[3rem] bg-gradient-to-br from-violet-900 to-indigo-950 p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-300 mb-8 border-b border-white/10 pb-4">{t.dashboard.aiSummary}</p>
            <div className="text-sm leading-relaxed text-slate-200 font-medium min-h-[140px] italic">
              "{aiSummary}"
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">IA Powered by Gemini</span>
               <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></div>
            </div>
          </div>

          <div className="rounded-[3rem] bg-white/80 backdrop-blur-xl p-10 shadow-sm border border-white/50">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">{t.dashboard.nextAssembly}</p>
            {nextAssembly ? (
              <div className="flex items-center space-x-6">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-[1.5rem] bg-violet-50 text-violet-700 border-2 border-violet-100 shadow-inner">
                  <span className="text-[10px] font-black uppercase">{nextAssembly.date.split('-')[1]}</span>
                  <span className="text-3xl font-black leading-none">{nextAssembly.date.split('-')[2]}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-slate-900 text-lg truncate">{nextAssembly.description}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{nextAssembly.summonsTime} HRS • {nextAssembly.location || 'SEDE'}</p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-300 italic font-bold text-xs">No hay asambleas agendadas.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
