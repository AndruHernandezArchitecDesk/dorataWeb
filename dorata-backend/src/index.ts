import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { attachSocket } from "./lib/socket.js";
import staffRoutes from "./modules/staff/index.js";
import menuRoutes from "./modules/menu/index.js";
import tablesRoutes from "./modules/tables/index.js";
import ordersRoutes from "./modules/orders/index.js";
import kitchenRoutes from "./modules/kitchen/index.js";
import productsRoutes from "./modules/products/index.js";
import categoriesRoutes from "./modules/categories/index.js";
import mesaRoutes from "./modules/mesa/index.js";
import bannersRoutes from "./modules/banners/index.js";

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed =
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin === env.CORS_ORIGIN ||
        env.CORS_ORIGIN === "*";
      cb(null, allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Dorata API",
    status: "ok",
    health: "/health",
    docs: ["/api/menu?branchId=branch-main", "/api/banners?branchId=branch-main"],
    frontend: "Despliega dorata-frontend en Vercel y pon VITE_API_URL a esta URL",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/staff", staffRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/mesa", mesaRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/banners", bannersRoutes);

const server = createServer(app);

attachSocket(server);

const start = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");

    server.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
