import { z } from "zod";
import { OpenIaService } from "../../service/openia.js";

const messageType = {
  SYSTEM: "system",
  USER: "user",
};

const MENSAGEM_DE_CONTEXTO_PADRAO = {
  role: messageType.SYSTEM,
  content: `Você é um desenvolvedor web especializado em templates ejs. 
  Sua função é editar ou criar um templates ejs com base no que foi pedido. 
  Você deve adicionar comentários (pt-br) apenas em cada seção do código como cabeçalhos, rodapés, tabela etc.
  Toda resposta devera seguir o padrão bloco de código mais um simples descrição do que foi feito.
  Não crie a estrutura HTML`,
};

const MENSAGEM_CONTEXTO_GERACAO_EJS = {
  role: messageType.SYSTEM,
  content: `Você deve criar o template ejs sem criar a estrutura padrão do html,  
  Use a estrutura do template ejs fornecido como exemplo, mas não faça igual.
  Você também deve adicionar os estilos css, deixando o design mais fiel possível a imagem.`,
};

const MENSAGEM_CONTEXTO_VARIAVEIS = {
  role: messageType.SYSTEM,
  content: `Voce recebera dois objetos de variais, use-as conforme necessário,`,
};

const bodySchema = z.object({
  question: z
    .string({ message: "A pergunta é um campo obrigatório!" })
    .min(5, { message: "A pergunta precisa ter no mínimo 5 caracteres." }),
  templateEjs: z.string({ message: "Template ejs é um campo obrigatório!" }),
  omieVar: z.string({ message: "Variáveis omie é um campo obrigatório!" }),
  systemVar: z.string({
    message: "Variáveis de sistema é um campo obrigatório!",
  }),
});

export const question = async (req, res, next) => {
  try {
    const { question, templateEjs, omieVar, systemVar } = bodySchema.parse(
      req.body
    );

    if (!req.file) {
      const messages = [
        MENSAGEM_DE_CONTEXTO_PADRAO,
        MENSAGEM_CONTEXTO_VARIAVEIS,
        { role: messageType.USER, content: templateEjs },
        { role: messageType.USER, content: omieVar },
        { role: messageType.USER, content: systemVar },
        { role: messageType.USER, content: question },
      ];

      const response = await OpenIaService.openSession({ messages });
      return res.status(200).json({ message: "ok", data: response });
    }

    const messages = [
      MENSAGEM_DE_CONTEXTO_PADRAO,
      MENSAGEM_CONTEXTO_GERACAO_EJS,
      MENSAGEM_CONTEXTO_VARIAVEIS,
      { role: messageType.USER, content: omieVar },
      { role: messageType.USER, content: systemVar },
      { role: messageType.USER, content: templateEjs },
      {
        role: messageType.USER,
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${req.file.buffer.toString(
                "base64"
              )}`,
            },
          },
          { type: "text", text: question },
        ],
      },
    ];

    const response = await OpenIaService.openSession({ messages });
    return res.status(200).json({ message: "ok", data: response });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
