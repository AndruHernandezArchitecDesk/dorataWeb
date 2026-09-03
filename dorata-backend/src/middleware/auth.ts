import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";

export interface AuthRequest extends Request {
  staff?: {
    staffId?: string;
    tableId?: string;
    branchId: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (payload.role === "CLIENTE_MESA") {
      req.staff = {
        tableId: payload.tableId,
        branchId: payload.branchId,
        role: payload.role,
      };
    } else {
      req.staff = {
        staffId: payload.staffId,
        branchId: payload.branchId,
        role: payload.role,
      };
    }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(...allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.staff || !allowed.includes(req.staff.role)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}
