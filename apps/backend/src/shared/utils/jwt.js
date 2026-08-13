import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import crypto from "crypto";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    jwtid: crypto.randomUUID()
  });
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};