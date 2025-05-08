import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import multer from "multer";

import { authMiddleware } from "./middlewares/auth.js";
import { integracaoOpenIaRoute } from "./routes/integracaoOpenIa.js";
import { statusRouter } from "./routes/status.js";
import cookieParser from "cookie-parser";
import { z } from "zod";

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use(helmet());
if (env.NODE_ENV === "dev") app.use(morgan("dev"));

app.use("/", statusRouter);

app.use(authMiddleware);
app.use("/integracao", integracaoOpenIaRoute);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ errors: error.errors });
  }

  if (error instanceof z.ZodError) {
    return res.status(400).json({ errors: error.errors });
  }

  return res.status(500).send("Algum erro inesperado ocorreu!");
});

export { app };
