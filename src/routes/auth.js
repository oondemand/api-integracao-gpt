import express from "express";
import { login } from "../controllers/login.js";

const authRouter = express.Router();

authRouter.post("/login", login);

export { authRouter };
