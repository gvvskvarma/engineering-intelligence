import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../utils/supabase";

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function requireUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing bearer token" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "invalid token" });
  }
  req.userId = data.user.id;
  next();
}
