import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import crypto from "crypto";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    jwtid: crypto.randomUUID()
  });
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};