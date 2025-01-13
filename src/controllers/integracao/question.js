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

    const findPrompt = ({ cod }) => {
      const prompt = prompts.find((e) => e.codigo === cod);
      return { role: prompt?.tipo, content: prompt?.conteudo };
    };

    const MENSAGEM_DE_CONTEXTO_INICIALIZACAO = findPrompt({
      cod: "MENSAGEM_DE_CONTEXTO_INICIALIZACAO",
    });

    const CONTEXTO_DE_GERACAO = findPrompt({
      cod: "CONTEXTO_DE_GERACAO",
    });

    const CONTEXTO_VARIAVEIS_OMIE = findPrompt({
      cod: "CONTEXTO_VARIAVEIS_OMIE",
    });

    const CONTEXTO_VARIAVEIS_TEMPLATE = findPrompt({
      cod: "CONTEXTO_VARIAVEIS_TEMPLATE",
    });

    const CONTEXTO_VARIAVEIS_SISTEMA = findPrompt({
      cod: "CONTEXTO_VARIAVEIS_SISTEMA",
    });

    const CONTEXTO_DE_IMAGEM = findPrompt({
      cod: "CONTEXTO_DE_IMAGEM",
    });

    const CONTEXTO_DE_CHAT = findPrompt({
      cod: "CONTEXTO_DE_CHAT",
    });

    const messages = [
      MENSAGEM_DE_CONTEXTO_INICIALIZACAO,
      CONTEXTO_DE_GERACAO,
      {
        role: CONTEXTO_VARIAVEIS_OMIE.role,
        content: CONTEXTO_VARIAVEIS_OMIE.content + omieVar,
      },
      {
        role: CONTEXTO_VARIAVEIS_TEMPLATE.role,
        content: CONTEXTO_VARIAVEIS_TEMPLATE.content + templateEjs,
      },
      {
        role: CONTEXTO_VARIAVEIS_SISTEMA.role,
        content: CONTEXTO_VARIAVEIS_SISTEMA.content + systemVar,
      },
    ];

    if (!req.file) {
      const chatMessage = {
        role: CONTEXTO_DE_CHAT.role,
        content: CONTEXTO_DE_CHAT.content + question,
      };

      messages.push(chatMessage);
      console.log("MESSAGES:", messages);

      const response = await OpenIaService.openSession({ messages });
      return res.status(200).json({ message: "ok", data: response });
    }

    const imageMessage = {
      role: CONTEXTO_DE_IMAGEM.role,
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${req.file.buffer.toString("base64")}`,
          },
        },
        { type: "text", text: CONTEXTO_DE_IMAGEM.content + question },
      ],
    };

    messages.push(imageMessage);
    console.log("MESSAGES:", messages);

    const response = await OpenIaService.openSession({ messages });
    return res.status(200).json({ message: "ok", data: response });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// 1. => MENSAGEM_DE_CONTEXTO_INICIALIZACAO =>
// 2. => CONTEXTO_DE_GERACAO =>

// 5. => CONTEXTO_VARIAVEIS_OMIE (CONCATENAR COM CONTEÚDO RECEBIDO)
// 6. => CONTEXTO_VARIAVEIS_TEMPLATE (CONCATENAR COM CONTEÚDO RECEBIDO)
// 7. => CONTEXTO_VARIAVEIS_SYSTEMAA (CONCATENAR COM CONTEÚDO RECEBIDO)

// 3. => CONTEXTO_DE_IMAGEM (SÓ QUANDO FOR IMAGEM, CONCATENAR COM TEXTO) =>
// 4. => CONTEXTO_DE_CHAT (CONCATENAR) =>
