
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
  const [aiSummary, setAiSummary] = useState<string>('Analizando actividad comunitaria...');

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getFinancialSummary(transactions);
      setAiSummary(summary || 'No se pudo generar el resumen.');
    };
    fetchSummary();
  }, [transactions]);

  const chartData = [
    { name: 'Ingresos', value: totalIncome },
    { name: 'Egresos', value: totalExpense },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
            Estado de <br/><span className="text-emerald-700 underline decoration-emerald-300 underline-offset-8">Tierra Esperanza</span>
          </h2>
          <p className="text-slate-600 mt-4 font-bold uppercase tracking-widest text-xs">Reporte Ejecutivo • {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-slate-200 flex items-center space-x-4">
           <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronización</p>
              <p className="text-sm font-bold text-slate-800">Sistema en Línea</p>
           </div>
        </div>
      </header>

      {/* KPI Cards con Contraste Reforzado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Socios', val: members.length, sub: 'Miembros activos', from: 'from-emerald-600', to: 'to-teal-700', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { label: 'Caja', val: `$${balance.toLocaleString('es-CL')}`, sub: 'Saldo Disponible', from: 'from-cyan-600', to: 'to-blue-700', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
          { label: 'Ingresos', val: `$${totalIncome.toLocaleString('es-CL')}`, sub: 'Acumulado', from: 'from-blue-600', to: 'to-indigo-700', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'Eventos', val: assemblies.length, sub: 'Registrados', from: 'from-amber-600', to: 'to-orange-700', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ].map((kpi, idx) => (
          <div key={idx} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.from} ${kpi.to} rounded-[2.5rem] blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-200 hover:border-emerald-500 transition-all duration-500 relative flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${kpi.from} ${kpi.to} text-white flex items-center justify-center mb-6 shadow-xl`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={kpi.icon} /></svg>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{kpi.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.val}</p>
              <p className="text-xs text-slate-600 mt-2 font-bold bg-slate-100 px-4 py-1.5 rounded-full">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-200 flex flex-col overflow-hidden relative">
          <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Análisis Financiero</h3>
              <p className="text-slate-600 text-sm font-bold mt-1">Comparativa de flujos</p>
            </div>
            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-full bg-emerald-600"></span><span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Entradas</span></div>
               <div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-full bg-rose-600"></span><span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Salidas</span></div>
            </div>
          </div>
          <div className="h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#475569' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#475569' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }} 
                  contentStyle={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={70}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#059669' : '#e11d48'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Box con Contraste de Texto Mejorado */}
        <div className="bg-gradient-to-br from-[#064e3b] to-[#1e1b4b] text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full mb-10 w-fit">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Insight Estratégico</span>
            </div>
            
            <div className="text-lg leading-relaxed space-y-6 font-semibold text-emerald-50 flex-1 tracking-tight">
              {aiSummary}
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/20 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Inteligencia de Datos</p>
                <p className="text-xs font-bold text-white/70">Análisis Progresivo</p>
              </div>
              <button className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-2xl transition-all border border-white/20">
                <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
