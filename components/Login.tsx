
import React, { useState } from 'react';
import { User } from '../types';

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
    
    // Buscar usuario en la lista dinámica
    const foundUser = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Credenciales incorrectas o cuenta no autorizada por Soporte.');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45L20.1 19H3.9L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Tierra Esperanza</h1>
          <p className="text-emerald-100 mt-2 font-medium tracking-widest text-xs uppercase">Gestión de Vivienda Comunitaria</p>
        </div>
        
        <div className="p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ID de Usuario</label>
              <input 
                type="text" 
                required
                className="w-full px-6 py-4 border-2 border-slate-100 rounded-3xl focus:border-emerald-500 outline-none transition bg-slate-50 font-bold"
                placeholder="Nombre de usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-6 py-4 border-2 border-slate-100 rounded-3xl focus:border-emerald-500 outline-none transition bg-slate-50 font-bold"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-black text-center bg-red-50 py-3 rounded-2xl border border-red-100 animate-pulse">{error}</p>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xl hover:bg-emerald-700 transition shadow-2xl shadow-emerald-200"
            >
              ACCEDER AL PANEL
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose">
            <p>Solo acceso autorizado por directiva</p>
            <p className="mt-1">Soporte Técnico: +56 9 7942 9123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
