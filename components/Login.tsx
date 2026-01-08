import React, { useState } from 'react';
import { User } from '../types';
// Fix: Import Icons from constants to allow access to Icons.Users
import { Icons } from '../constants';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Acceso denegado. Verifica tus credenciales.');
    }
  };

  return (
    <div className="min-h-screen bg-[#042f2e] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-700 relative z-10 border border-slate-200">
        <div className="bg-gradient-to-br from-[#065f46] to-[#1e1b4b] p-16 text-white text-center relative overflow-hidden">
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none italic">Tierra<br/><span className="text-emerald-400">Esperanza</span></h1>
          <p className="text-emerald-100 mt-6 font-black tracking-[0.4em] text-[10px] uppercase opacity-80">Gestión de Vivienda Comunitaria</p>
        </div>
        
        <div className="p-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-emerald-800 transition-colors">Usuario del Sistema</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    className="w-full px-8 py-5 border-2 border-slate-200 rounded-[2rem] focus:border-emerald-600 outline-none transition-all bg-slate-50 font-black text-slate-800 placeholder:text-slate-400 shadow-inner group-focus-within:bg-white"
                    placeholder="Ej: soporte"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icons.Users />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-emerald-800 transition-colors">Contraseña Segura</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    className="w-full px-8 py-5 border-2 border-slate-200 rounded-[2rem] focus:border-emerald-600 outline-none transition-all bg-slate-50 font-black text-slate-800 placeholder:text-slate-400 shadow-inner group-focus-within:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-100 border-2 border-rose-200 text-rose-800 px-6 py-4 rounded-2xl text-[11px] font-black text-center uppercase tracking-wider">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-emerald-700 to-indigo-800 text-white rounded-[2rem] font-black text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              ACCEDER AL PANEL
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;