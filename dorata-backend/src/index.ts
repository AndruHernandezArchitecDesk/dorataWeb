import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";
import { attachSocket } from "./lib/socket";
import staffRoutes from "./modules/staff";
import menuRoutes from "./modules/menu";
import tablesRoutes from "./modules/tables";
import ordersRoutes from "./modules/orders";
import kitchenRoutes from "./modules/kitchen";
import productsRoutes from "./modules/products";
import categoriesRoutes from "./modules/categories";
import mesaRoutes from "./modules/mesa";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

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
