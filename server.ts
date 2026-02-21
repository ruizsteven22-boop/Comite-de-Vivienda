import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { initDB, readDB, writeDB, INITIAL_DATA } from "./db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // Initialize database
  await initDB();

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      const data = await readDB();
      // Sanitize users for the general data fetch (remove passwords)
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
      const data = await readDB();
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
      const currentData = await readDB();
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

      await writeDB(newData);
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
