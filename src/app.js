import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";

import { authMiddleware } from "./middlewares/auth.js";
import { integracaoOpenIaRoute } from "./routes/integracaoOpenIa.js";
import { authRouter } from "./routes/auth.js";
import cookieParser from "cookie-parser";
import { z } from "zod";

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use(helmet());
if (env.NODE_ENV === "dev") app.use(morgan("dev"));

app.use("/", authRouter);

app.use(authMiddleware);
app.use("/integracao", integracaoOpenIaRoute);

app.use((error, req, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ errors: error.errors });
  }

  console.log(error);

  return res.status(500).send("Algo deu errado!");
});

export { app };
