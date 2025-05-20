import { z } from "zod";
import { OpenIaService } from "../../service/openia.js";
import { Template } from "../../utils/template.js";
import { acessarPropriedade } from "../../utils/helpers.js";

const promptSchema = z.object({
  codigo: z.string().optional(),
  conteudo: z.string(),
  descricao: z.string().optional(),
  nome: z.string().optional(),
  ordem: z.number(),
  tipo: z.string(),
  tipoConteudo: z.string().optional(),
});

const bodySchema = z.object({
  modelo: z.string().optional(),
  question: z.string().optional(),
  data: z.any().optional(),
  prompts: z.array(promptSchema),
});

export const cst = async (req, res, next) => {
  try {
    const { question, prompts, modelo, data } = bodySchema.parse(req.body);

    const concatenatedMessages = [];

    for (const prompt of prompts) {
      if (question && prompt?.codigo?.toUpperCase() === "CONTEXTO_DE_CHAT") {
        continue;
      }

      if (prompt?.tipoConteudo && prompt?.tipoConteudo === "arquivo") {
        let arquivos = acessarPropriedade({ data }, prompt?.conteudo);

        if (!Array.isArray(arquivos)) {
          arquivos = [arquivos];
        }

        const fileMessage = {
          role: "user",
          content: [],
        };

        for (const arquivo of arquivos) {
          if (typeof arquivo === "object" && "buffer" in arquivo) {
            if (arquivo?.mimetype.includes("image")) {
              const buffer = new Buffer(arquivo.buffer.data);

              fileMessage.content.push({
                type: "image_url",
                image_url: {
                  url: `data:${arquivo.mimetype};base64,${buffer.toString(
                    "base64"
                  )}`,
                },
              });

              concatenatedMessages.push(fileMessage);
            }

            if (arquivo?.mimetype.includes("pdf")) {
              const buffer = new Buffer(arquivo.buffer.data);

              fileMessage.content.push({
                type: "file",
                file: {
                  filename: arquivo.nomeOriginal,
                  file_data: `data:${arquivo.mimetype};base64,${buffer.toString(
                    "base64"
                  )}`,
                },
              });

              concatenatedMessages.push(fileMessage);
            }
          }
        }
      }

      if (prompt?.tipoConteudo && prompt?.tipoConteudo === "texto") {
        const textMessage = {
          role: prompt?.tipo,
          content: prompt?.conteudo,
        };

        concatenatedMessages.push(textMessage);
      }

      if (prompt?.tipoConteudo && prompt?.tipoConteudo === "objetoJson") {
        data?.arquivos && delete data.arquivos;
        data?.arquivo && delete data.arquivo;
        data?.documentosFiscais && delete data.documentosFiscais;
        data?.documentosCadastrais && delete data.documentosCadastrais;

        const template = Template.build({
          data: { data },
          template: prompt?.conteudo,
        });

        const message = {
          role: prompt?.tipo,
          content: template,
        };

        concatenatedMessages.push(message);
      }
    }

    if (question) {
      concatenatedMessages.push({
        role: "user",
        content: question,
      });
    }

    const response = await OpenIaService.openSession({
      messages: concatenatedMessages,
      model: modelo,
    });

    return res.status(200).json({
      message: "ok",
      data: {
        response,
        body: data,
        prompt: concatenatedMessages,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
