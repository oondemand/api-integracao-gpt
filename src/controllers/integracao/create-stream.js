import { client } from "../../config/openia.js";
import { z } from "zod";

const streamSchema = z.object({
  question: z.string().min(5),
});

export const createStream = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { question } = streamSchema.parse(req.body);
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
      stream: true,
      // n: 1,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";

      console.log("Content", content);
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }
    res.write("data: [END]\n\n");
    res.end();
  } catch (error) {
    console.error("Erro ao interagir com a OpenAI:", error);
    res.write("data: [ERROR] Ocorreu um erro ao processar sua requisição\n\n");
    res.end();
  }
};
