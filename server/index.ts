import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import * as jsonDB from "./db";
import { INITIAL_DATA } from "./db";
import * as mysqlDB from "./mysql_db";

// Seleccionar motor de base de datos
const useMySQL = process.env.USE_MYSQL === 'true';
let db: any = useMySQL ? mysqlDB : jsonDB;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Start listening immediately to satisfy the platform's health check
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Booting on port ${PORT}...`);
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // 2. Initialize database
  console.log("[Server] Initializing database...");
  db.initDB().then(() => {
    console.log(`[Server] Database initialized using ${useMySQL ? "MySQL" : "JSON"}`);
  }).catch(async (error: any) => {
    if (useMySQL) {
      console.error(`[Server] MySQL initialization failed: ${error.message}. Falling back to JSON.`);
      db = jsonDB;
      try {
        await db.initDB();
        console.log("[Server] Fallback JSON database initialized");
      } catch (e) {
        console.error("[Server] Fallback database failed:", e);
      }
    } else {
      console.error("[Server] Database initialization failed:", error);
    }
  });

  // 3. API Routes (Defined before Vite to ensure they take precedence)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      database: db === mysqlDB ? "MySQL" : "JSON"
    });
  });

  app.get("/api/config", async (req, res) => {
    try {
      const data = await db.readDB();
      res.json(data.config || INITIAL_DATA.config);
    } catch (error) {
      res.status(500).json({ error: "Failed to read config" });
    }
  });

  app.get("/api/data", async (req, res) => {
    try {
      const data = await db.readDB();
      const sanitizedUsers = data.users.map((u: any) => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json({ ...data, users: sanitizedUsers });
    } catch (error) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/login", async (req, res) => {
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

  app.post("/api/data", async (req, res) => {
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
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.all("/api/(.*)", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.path}` });
  });

  // 4. Vite / Static Assets
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Starting Vite middleware...");
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then(vite => {
      app.use(vite.middlewares);
      console.log("[Server] Vite ready");
    }).catch(err => {
      console.error("[Server] Vite failed to start", err);
    });
  } else {
    app.use(express.static("dist"));
    app.get("(.*)", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Server Error]:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Process-level error handlers
  process.on('uncaughtException', (err) => {
    console.error('[Fatal] Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer();
