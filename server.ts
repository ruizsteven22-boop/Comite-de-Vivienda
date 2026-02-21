import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import cors from "cors";

const DATA_FILE = path.join(process.cwd(), "data.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // Initialize data file if it doesn't exist
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
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
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const parsedData = JSON.parse(data);
      // Sanitize users for the general data fetch (remove passwords)
      const sanitizedUsers = parsedData.users.map((u: any) => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json({ ...parsedData, users: sanitizedUsers });
    } catch (error) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const parsedData = JSON.parse(data);
      const user = parsedData.users.find((u: any) => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );
      
      if (user) {
        const { password, ...sanitizedUser } = user;
        res.json({ success: true, user: sanitizedUser });
      } else {
        res.status(401).json({ success: false, message: "Credenciales inválidas" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      // When saving data, we need to preserve passwords if they aren't provided in the payload
      // This is tricky because the client doesn't have passwords anymore.
      // We should probably have a separate endpoint for updating users or handle it carefully.
      
      const currentDataRaw = await fs.readFile(DATA_FILE, "utf-8");
      const currentData = JSON.parse(currentDataRaw);
      
      const newData = req.body;
      
      // Merge passwords back into users
      if (newData.users) {
        newData.users = newData.users.map((u: any) => {
          const existingUser = currentData.users.find((eu: any) => eu.id === u.id);
          return {
            ...u,
            password: u.password || (existingUser ? existingUser.password : 'te2024')
          };
        });
      }

      await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
