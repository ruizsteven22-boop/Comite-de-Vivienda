import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import * as jsonDB from "./db";
import * as mysqlDB from "./mysql_db";

console.log("Starting Express server...");

// Seleccionar motor de base de datos
const useMySQL = process.env.USE_MYSQL === 'true';
const db = useMySQL ? mysqlDB : jsonDB;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Logging middleware - MUST BE FIRST
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // Initialize database
  await db.initDB();

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Server is running",
      database: useMySQL ? "MySQL" : "JSON"
    });
  });

  // API Routes
  app.get(["/api/data", "/api/data/"], async (req, res) => {
    console.log("Handling GET /api/data");
    try {
      const data = await db.readDB();
      const sanitizedUsers = data.users.map((u: any) => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json({ ...data, users: sanitizedUsers });
    } catch (error) {
      console.error("Read error:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post(["/api/login", "/api/login/"], async (req, res) => {
    console.log("Handling POST /api/login", req.body?.username);
    const { username, password } = req.body;
    try {
      const data = await db.readDB();
      const user = data.users.find((u: any) => 
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

  app.post(["/api/data", "/api/data/"], async (req, res) => {
    console.log("Handling POST /api/data");
    try {
      const currentData = await db.readDB();
      const newData = req.body;
      
      if (newData.users) {
        newData.users = newData.users.map((u: any) => {
          const existingUser = currentData.users.find((eu: any) => eu.id === u.id);
          return {
            ...u,
            password: u.password || (existingUser ? existingUser.password : 'te2024')
          };
        });
      }

      await db.writeDB(newData);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Write error:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Catch-all for undefined API routes to prevent falling through to Vite/HTML
  app.all("/api/*", (req, res) => {
    console.log(`[404] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.url}` });
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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
