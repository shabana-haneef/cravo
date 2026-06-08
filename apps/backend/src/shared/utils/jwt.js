import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

export const generateAccessToken = (
  payload
) => {
  return jwt.sign(
    payload,
    env.accessSecret,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (
  payload
) => {
  return jwt.sign(
    payload,
    env.refreshSecret,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyToken = (
  token,
  secret
) => {
  return jwt.verify(
    token,
    secret
  );
};