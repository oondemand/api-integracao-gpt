import express from "express";
import { env } from "../config/env";

const statusRouter = express.Router();

statusRouter.get("/status", async (req, res) => {
  res.json({ status: "ok", message: env.SERVICE_VERSION });
});

export { statusRouter };
