import { z } from "zod";
import { OpenIaService } from "../../service/openia.js";
import { Template } from "../../utils/template.js";

const promptSchema = z.object({
  codigo: z.string().optional(),
  conteudo: z.string(),
  descricao: z.string().optional(),
  nome: z.string().optional(),
  ordem: z.number(),
  tipo: z.string(),
});

const bodySchema = z.object({
  modelo: z.string().optional(),
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
    const { question, templateEjs, omieVar, systemVar, prompts, modelo } =
      bodySchema.parse(req.body);

    const concatenatedMessages = [];

    for (const prompt of prompts) {
      if (req.files && prompt.codigo.toUpperCase() === "CONTEXTO_DE_IMAGEM") {
        continue;
      }

      const template = Template.build({
        data: {
          ...JSON.parse(omieVar),
          ...JSON.parse(systemVar),
          template: templateEjs,
          conteudo: templateEjs,
          omie: JSON.parse(omieVar),
          sistema: JSON.parse(systemVar),
        },
        template: prompt?.conteudo,
      });

      prompt.conteudo = template;
      concatenatedMessages.push(prompt);
    }

    const orderedAndRefactoredMessages = concatenatedMessages
      .sort((a, b) => a.ordem - b.ordem)
      .map((e) => {
        return { role: e.tipo, content: e.conteudo };
      });

    if (req.files) {
      const imgContext = prompts.find(
        (e) => e?.codigo === "CONTEXTO_DE_IMAGEM"
      )?.conteudo;

      for (const file of req.files) {
        if (file.mimetype.includes("image")) {
          const imageMessage = {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.mimetype};base64,${file.buffer.toString(
                    "base64"
                  )}`,
                },
              },
              { type: "text", text: imgContext || question || "" },
            ],
          };

          orderedAndRefactoredMessages.push(imageMessage);
          continue;
        } else {
          const fileMessage = {
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: file.originalname,
                  file_data: `data:${
                    file.mimetype
                  };base64,${file.buffer.toString("base64")}`,
                },
              },
              { type: "text", text: question || "" },
            ],
          };

          orderedAndRefactoredMessages.push(fileMessage);
        }
      }
    }

    if (question) {
      orderedAndRefactoredMessages.push({
        role: "user",
        content: question,
      });
    }

    const response = await OpenIaService.openSession({
      messages: orderedAndRefactoredMessages,
      model: modelo,
    });

    return res.status(200).json({
      message: "ok",
      data: {
        response,
        body: {
          template: templateEjs,
          conteudo: templateEjs,
          omie: JSON.parse(omieVar),
          sistema: JSON.parse(systemVar),
        },
        prompt: orderedAndRefactoredMessages,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
