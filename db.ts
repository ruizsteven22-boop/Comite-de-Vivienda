import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

export const INITIAL_DATA = {
  users: [
    { id: '1', username: 'soporte', password: 'soporte.password', role: 'SUPPORT', name: 'Soporte Técnico' },
    { id: '2', username: 'admin', password: 'Lio061624', role: 'ADMINISTRATOR', name: 'Administrador' },
    { id: '3', username: 'presi', password: 'te2024', role: 'PRESIDENT', name: 'Presidente' },
    { id: '4', username: 'teso', password: 'te2024', role: 'TREASURER', name: 'Tesorero' },
    { id: '5', username: 'secre', password: 'te2024', role: 'SECRETARY', name: 'Secretario' }
  ],
  config: {
    legalName: 'Comité de Vivienda Tierra Esperanza',
    tradeName: 'Tierra Esperanza',
    rut: '76.123.456-7',
    email: 'contacto@tierraesperanza.cl',
    phone: '+56 9 1234 5678',
    municipalRes: 'Res. Exenta N° 456/2023',
    legalRes: 'Pers. Jurídica N° 7890-S',
    language: 'es',
    logoUrl: ''
  },
  members: [],
  transactions: [],
  board: [
    { role: 'Presidente', primary: { name: 'Juan Pérez', rut: '12.345.678-9', phone: '+56912345678' }, substitute: { name: '', rut: '', phone: '' } },
    { role: 'Secretario', primary: { name: 'María López', rut: '15.678.901-2', phone: '+56987654321' }, substitute: { name: '', rut: '', phone: '' } },
    { role: 'Tesorero', primary: { name: 'Carlos Ruiz', rut: '18.901.234-5', phone: '+56955566677' }, substitute: { name: '', rut: '', phone: '' } }
  ],
  boardPeriod: '2025 - 2027',
  assemblies: [],
  documents: []
};

export async function initDB() {
  try {
    await fs.access(DATA_FILE);
    
    // Migration: Ensure admin has correct password if it's still default
    const data = await readDB();
    let changed = false;
    data.users = data.users.map((u: any) => {
      if (u.username === 'admin' && u.password === 'admin.password') {
        u.password = 'Lio061624';
        changed = true;
      }
      return u;
    });
    if (changed) {
      await writeDB(data);
    }
  } catch {
    await writeDB(INITIAL_DATA);
  }
}

export async function readDB() {
  const data = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

export async function writeDB(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}
