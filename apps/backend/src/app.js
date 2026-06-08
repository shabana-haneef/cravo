import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { notFound } from "./shared/middleware/notFound.middleware.js";
import { errorHandler } from "./shared/middleware/error.middleware.js";

const app = express();

app.use(helmet());

app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Cravo API Running",
  });
});

app.use(notFound);

app.use(errorHandler);

export default app;