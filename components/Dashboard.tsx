import React, { useState, useEffect } from 'react';
import { Member, Transaction, Assembly, TransactionType, User, BoardRole, CommitteeConfig } from '../types';
import { getFinancialSummary } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  assemblies: Assembly[];
  currentUser: User;
  config: CommitteeConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ members, transactions, assemblies, currentUser, config }) => {
  const [aiSummary, setAiSummary] = useState<string>('Cargando análisis...');

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
        setAiSummary(`Hola ${currentUser.name}. El sistema está listo.`);
        return;
      }
      if (transactions.length > 0) {
        const summary = await getFinancialSummary(transactions);
        setAiSummary(summary || 'Análisis no disponible.');
      } else {
        setAiSummary('Inicie transacciones para ver el análisis de IA.');
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Hola, <span className="text-emerald-600">{currentUser.name.split(' ')[0]}</span></h2>
          <p className="text-slate-500 font-medium">Panel general de {config.tradeName}</p>
        </div>
        <div className="flex h-12 items-center rounded-2xl bg-white px-6 font-black text-slate-700 card-shadow border border-slate-100">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Socios', val: members.length, sub: 'Miembros activos', color: 'bg-emerald-600', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7' },
          { label: 'Caja', val: isTesoOrAdmin ? `$${balance.toLocaleString('es-CL')}` : 'Restringido', sub: 'Saldo neto', color: 'bg-indigo-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2' },
          { label: 'Ingresos', val: isTesoOrAdmin ? `$${totalIncome.toLocaleString('es-CL')}` : '***', sub: 'Total histórico', color: 'bg-cyan-600', icon: 'M7 12l3-3 3 3 4-4' },
          { label: 'Asambleas', val: assemblies.length, sub: 'Sesiones totales', color: 'bg-rose-600', icon: 'M8 7V3m8 4V3m-9 8h10' },
        ].map((kpi, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2rem] bg-white p-8 card-shadow border border-slate-50 transition-all hover:scale-[1.02]">
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${kpi.color} opacity-[0.03] transition-transform group-hover:scale-150`}></div>
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${kpi.color} text-white shadow-lg`}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={kpi.icon} /></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
            <p className="text-3xl font-black text-slate-900">{kpi.val}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className="lg:col-span-2 rounded-[2.5rem] bg-white p-10 card-shadow border border-slate-100">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800">Flujo Financiero</h3>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Egresos</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            {isTesoOrAdmin ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={80}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 italic">No tienes permiso para ver este gráfico.</div>
            )}
          </div>
        </div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-6">AI Insight</p>
            <div className="text-sm leading-relaxed text-slate-300 italic min-h-[100px]">
              "{aiSummary}"
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 card-shadow border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Próxima Asamblea</p>
            {nextAssembly ? (
              <div className="flex items-center space-x-5">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <span className="text-xs font-black">{nextAssembly.date.split('-')[1]}</span>
                  <span className="text-2xl font-black leading-none">{nextAssembly.date.split('-')[2]}</span>
                </div>
                <div>
                  <p className="font-black text-slate-800 line-clamp-1">{nextAssembly.description}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{nextAssembly.summonsTime} hrs • {nextAssembly.location}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400 text-center py-4">Sin asambleas programadas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;