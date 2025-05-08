import { client } from "../config/openia.js";

const openSession = async ({ messages, model = "gpt-4o-mini" }) => {
  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages,
  });

  return stream?.choices[0].message?.content;
};

export const OpenIaService = {
  openSession,
};
