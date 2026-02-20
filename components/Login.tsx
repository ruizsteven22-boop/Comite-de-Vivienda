
import React, { useState } from 'react';
import { User, CommitteeConfig } from '../types';
import { Icons } from '../constants';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  config: CommitteeConfig;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, config }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Orbes Decorativos */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-teal-400/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-400/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="bg-white/80 backdrop-blur-2xl w-full max-w-lg rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-in zoom-in-95 duration-700 relative z-10 border border-white/50">
        <div className="bg-gradient-to-br from-teal-500 via-indigo-600 to-purple-600 p-16 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-3xl bg-white/20 p-3 mb-6 shadow-2xl" />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-4xl mb-6 shadow-2xl backdrop-blur-md">
                🌳
              </div>
            )}
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-tight italic drop-shadow-sm">
              {config.tradeName}
            </h1>
            <p className="text-white/70 mt-4 font-black tracking-[0.4em] text-[10px] uppercase">Comunidad Digital</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]"></div>
        </div>
        
        <div className="p-14">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-teal-600 transition-colors">Usuario</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition-all bg-slate-50/50 font-black text-slate-800 placeholder:text-slate-300 group-focus-within:bg-white"
                    placeholder="Tu usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                    <Icons.Users />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-indigo-600 transition-colors">Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-500 outline-none transition-all bg-slate-50/50 font-black text-slate-800 placeholder:text-slate-300 group-focus-within:bg-white pr-16"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.225 0 2.39.223 3.465.625M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364.364l-1.414-1.414M15 12l-1.414-1.414M9 12l-1.414-1.414M3.636 11.636l1.414-1.414M12 12l1.414 1.414M12 12l-1.414-1.414" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border-2 border-rose-100 text-rose-500 px-6 py-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-wider animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Iniciar Sesión
            </button>
          </form>
          <div className="mt-10 text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">© 2024 Tierra Esperanza • V1.4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
