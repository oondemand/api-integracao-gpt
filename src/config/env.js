import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "prod"]).default("dev"),
  OPEN_IA_SECRET_KEY: z.string(),
  CLIENT_TOKEN: z.string().default("token-dev"),
  PORT: z.string().default("3000"),
  JWT_SECRET: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("🟥 [ERRO]: Variavies ambiente", _env.error.format());
  throw new Error("Variavies ambiente não encontradas");
}

export const env = _env.data;
