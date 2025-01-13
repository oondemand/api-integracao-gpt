import { client } from "../config/openia.js";

const openSession = async ({ messages }) => {
  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages,
  });

  return stream?.choices[0].message?.content;
};

export const OpenIaService = {
  openSession,
};
