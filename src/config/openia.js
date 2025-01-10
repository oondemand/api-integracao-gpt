import { env } from "./env.js";
import OpenAI from "openai";

export const client = new OpenAI({
  apiKey: env.OPEN_IA_SECRET_KEY,
});
