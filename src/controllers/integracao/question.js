import { z } from "zod";
import { OpenIaService } from "../../service/openia.js";

const promptSchema = z.object({
  codigo: z.string(),
  conteudo: z.string(),
  descricao: z.string().optional(),
  nome: z.string(),
  ordem: z.number(),
  tipo: z.string(),
});

const bodySchema = z.object({
  question: z
    .string({ message: "A pergunta é um campo obrigatório!" })
    .optional(),
  templateEjs: z.string({ message: "Template ejs é um campo obrigatório!" }),
  omieVar: z.string({ message: "Variáveis omie é um campo obrigatório!" }),
  systemVar: z.string({
    message: "Variáveis de sistema é um campo obrigatório!",
  }),
  prompts: z.string().transform((val) => {
    try {
      const parsed = JSON.parse(val);
      return z.array(promptSchema).parse(parsed);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }),
});

export const question = async (req, res, next) => {
  try {
    const { question, templateEjs, omieVar, systemVar, prompts } =
      bodySchema.parse(req.body);

    const concatenatedMessages = prompts.map((prompt) => {
      if (prompt.codigo === "CONTEXTO_VARIAVEIS_OMIE" && omieVar) {
        prompt.conteudo = prompt.conteudo + omieVar;
      }

      if (prompt.codigo === "CONTEXTO_VARIAVEIS_TEMPLATE" && templateEjs) {
        prompt.conteudo = prompt.conteudo + templateEjs;
      }

      if (prompt.codigo === "CONTEXTO_VARIAVEIS_SISTEMA" && systemVar) {
        prompt.conteudo = prompt.conteudo + systemVar;
      }

      if (!req.file && prompt.codigo === "CONTEXTO_DE_CHAT") {
        prompt.conteudo = prompt.conteudo + question;
      }

      if (req.file && prompt.codigo === "CONTEXTO_DE_IMAGEM") {
        prompt.conteudo = [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${req.file.buffer.toString(
                "base64"
              )}`,
            },
          },
          { type: "text", text: question ? question : prompt.conteudo },
        ];
      }

      return prompt;
    });

    const orderedAndRefactoredMessages = concatenatedMessages
      .sort((a, b) => a.ordem - b.ordem)
      .map((e) => {
        return { role: e.tipo, content: e.conteudo };
      });

    if (!req.file) {
      if (!concatenatedMessages.some((e) => e.codigo === "CONTEXTO_DE_CHAT")) {
        orderedAndRefactoredMessages.push({
          role: "user",
          content: question || "",
        });
      }

      console.log("MENSAGENS ENVIADAS ->", orderedAndRefactoredMessages);

      const response = await OpenIaService.openSession({
        messages: orderedAndRefactoredMessages,
      });
      console.log("RESPONSE ->", response);

      return res.status(200).json({ message: "ok", data: response });
    }

    if (!concatenatedMessages.some((e) => e.codigo === "CONTEXTO_DE_IMAGEM")) {
      orderedAndRefactoredMessages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${req.file.buffer.toString(
                "base64"
              )}`,
            },
          },
          { type: "text", text: question || "" },
        ],
      });
    }

    console.log("MENSAGENS ENVIADAS ->", orderedAndRefactoredMessages);

    const response = await OpenIaService.openSession({
      messages: orderedAndRefactoredMessages,
    });

    console.log("RESPONSE ->", response);

    return res.status(200).json({ message: "ok", data: response });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
