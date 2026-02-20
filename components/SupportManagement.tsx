
import React, { useState, useRef } from 'react';
import { User, SystemRole, BoardRole } from '../types';

interface SupportManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const SupportManagement: React.FC<SupportManagementProps> = ({ users, setUsers }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const roles: SystemRole[] = ['SUPPORT', 'ADMINISTRATOR', BoardRole.PRESIDENT, BoardRole.SECRETARY, BoardRole.TREASURER];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.username || !selectedUser?.name || !selectedUser?.role) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    if (selectedUser.id) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser as User : u));
    } else {
      const newUser: User = {
        ...selectedUser,
        id: Date.now().toString(),
        password: selectedUser.password || 'te2024' // Password por defecto
      } as User;
      setUsers(prev => [...prev, newUser]);
    }
    setShowForm(false);
    setSelectedUser(null);
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      alert("Debe existir al menos un usuario de soporte en el sistema.");
      return;
    }
    if (confirm("¿Está seguro de revocar el acceso a este usuario?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Soporte Técnico y Accesos</h2>
          <p className="text-slate-500">Gestión centralizada de credenciales y roles del sistema</p>
        </div>
        <button 
          onClick={() => { setSelectedUser({ role: BoardRole.PRESIDENT }); setShowForm(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition shadow-xl flex items-center"
        >
          <span className="mr-2 text-xl">+</span> Asignar Nuevo Acceso
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative group overflow-hidden hover:border-emerald-200 transition">
            <div className={`absolute top-0 right-0 p-4 font-black text-[10px] tracking-widest uppercase rounded-bl-2xl ${
              user.role === 'SUPPORT' ? 'bg-indigo-600 text-white' : 
              user.role === 'ADMINISTRATOR' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {user.role}
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              {user.logoUrl ? (
                <img src={user.logoUrl} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-800">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                <p className="text-sm text-slate-400 font-medium">@{user.username}</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
               <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                 <span>Privilegios</span>
                 <span className="text-slate-800">{user.role === 'SUPPORT' || user.role === 'ADMINISTRATOR' ? 'Nivel Total' : 'Nivel Función'}</span>
               </div>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full ${user.role === 'SUPPORT' || user.role === 'ADMINISTRATOR' ? 'bg-emerald-500 w-full' : 'bg-amber-400 w-2/3'}`}></div>
               </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t border-slate-50">
              <button 
                onClick={() => { setSelectedUser(user); setShowForm(true); }}
                className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition"
              >Editar Cuenta</button>
              <button 
                onClick={() => deleteUser(user.id)}
                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-900 text-indigo-50 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        </div>
        <h4 className="text-xl font-black mb-4 flex items-center tracking-tight">Directrices de Seguridad de Soporte</h4>
        <div className="max-w-2xl space-y-4 text-indigo-200/80 leading-relaxed text-sm">
          <p>Solo el <strong>Administrador del Sistema</strong> y el <strong>Soporte Técnico</strong> pueden asignar nuevos roles de directiva. Al crear una cuenta, informe al socio que su contraseña inicial es por defecto y debe ser cambiada en su primer ingreso.</p>
          <p>Los roles de <strong>Presidente, Secretario y Tesorero</strong> están vinculados a las funciones operativas del comité y restringen automáticamente el acceso a módulos que no competen a su cargo.</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-indigo-600 p-8 text-white">
              <h3 className="text-2xl font-black">{selectedUser?.id ? 'Actualizar' : 'Crear'} Cuenta de Acceso</h3>
              <p className="text-indigo-100 text-sm mt-1">Defina el nivel de privilegio y credenciales.</p>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden group relative"
                >
                  {selectedUser?.logoUrl ? (
                    <>
                      <img src={selectedUser.logoUrl} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-[8px] font-black text-white uppercase tracking-widest">Cambiar</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-slate-300 mb-1 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center px-2">Foto</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setSelectedUser(prev => ({ ...prev, logoUrl: event.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                {selectedUser?.logoUrl && (
                  <button 
                    type="button"
                    onClick={() => setSelectedUser(prev => ({ ...prev, logoUrl: '' }))}
                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 hover:text-rose-700"
                  >
                    Eliminar Foto
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Completo del Usuario</label>
                  <input 
                    required
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-slate-50 transition"
                    value={selectedUser?.name || ''}
                    onChange={e => setSelectedUser({...selectedUser, name: e.target.value})}
                    placeholder="Ej: Juan Soto Pérez"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre de Usuario</label>
                    <input 
                      required
                      className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-slate-50 transition"
                      value={selectedUser?.username || ''}
                      onChange={e => setSelectedUser({...selectedUser, username: e.target.value.toLowerCase().trim()})}
                      placeholder="jsoto"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contraseña</label>
                    <input 
                      type="password"
                      className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-slate-50 transition"
                      value={selectedUser?.password || ''}
                      onChange={e => setSelectedUser({...selectedUser, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rol y Función Asignada</label>
                  <select 
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold bg-slate-50 transition"
                    value={selectedUser?.role || ''}
                    onChange={e => setSelectedUser({...selectedUser, role: e.target.value as SystemRole})}
                  >
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition">
                  {selectedUser?.id ? 'GUARDAR CAMBIOS' : 'CONFIRMAR ACCESO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportManagement;
