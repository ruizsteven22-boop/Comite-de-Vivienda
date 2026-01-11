
import React, { useState, useEffect } from 'react';
import { Member, Transaction, Assembly, TransactionType } from '../types';
import { getFinancialSummary } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  assemblies: Assembly[];
}

const Dashboard: React.FC<DashboardProps> = ({ members, transactions, assemblies }) => {
  const [aiSummary, setAiSummary] = useState<string>('Realizando análisis financiero avanzado...');

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const fetchSummary = async () => {
      if (transactions.length > 0) {
        const summary = await getFinancialSummary(transactions);
        setAiSummary(summary || 'No se pudo generar el resumen en este momento.');
      } else {
        setAiSummary('Sin movimientos financieros registrados para analizar.');
      }
    };
    fetchSummary();
  }, [transactions]);

  const chartData = [
    { name: 'Ingresos', value: totalIncome },
    { name: 'Egresos', value: totalExpense },
  ];

  const upcomingAssemblies = assemblies
    .filter(a => a.status === 'Programada' || a.status === 'En Curso')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
            Panel <span className="text-emerald-700">Tierra Esperanza</span>
          </h2>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Gestión de Vivienda • Control Maestro</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-4">
           <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronización</p>
              <p className="text-sm font-black text-slate-800">{new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs</p>
           </div>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Socios', val: members.length, sub: 'Inscritos totales', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-emerald-600' },
          { label: 'Caja Actual', val: `$${balance.toLocaleString('es-CL')}`, sub: 'Saldo neto', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-cyan-600' },
          { label: 'Recaudación', val: `$${totalIncome.toLocaleString('es-CL')}`, sub: 'Total histórico', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', color: 'bg-indigo-600' },
          { label: 'Asambleas', val: assemblies.length, sub: 'Total sesiones', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-rose-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-6 hover:shadow-lg transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl ${kpi.color} text-white flex items-center justify-center shadow-lg`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={kpi.icon} /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-800">{kpi.val}</p>
              <p className="text-[10px] text-slate-500 font-bold">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800">Flujo de Caja</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Resumen de ingresos vs egresos</p>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Entradas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Salidas</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }} 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight and Next Event */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Análisis Inteligente</p>
              </div>
              <div className="text-sm leading-relaxed text-slate-300 font-medium italic min-h-[120px]">
                "{aiSummary}"
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Próximos Eventos</h4>
             <div className="space-y-4">
                {upcomingAssemblies.length > 0 ? upcomingAssemblies.map(a => (
                  <div key={a.id} className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                     <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{a.date.split('-')[1]}</span>
                        <span className="text-lg font-black text-slate-800 leading-none">{a.date.split('-')[2]}</span>
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-black text-slate-800 line-clamp-1">{a.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{a.summonsTime} hrs • {a.type}</p>
                     </div>
                  </div>
                )) : (
                  <p className="text-center py-6 text-xs text-slate-400 italic">No hay asambleas programadas.</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
