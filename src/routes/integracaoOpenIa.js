import express from "express";
import { IntegracaoController } from "../controllers/integracao/index.js";
import multer from "multer";

const integracaoOpenIaRoute = express.Router();

const storage = multer.memoryStorage({});

const fileFilter = (req, file, cb) => {
  return cb(null, true); // aceitando todos os tipos
  const VALID_TYPES = ["image/png", "image/jpg", "image/jpeg"];
  if (VALID_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 mb
});

integracaoOpenIaRoute.post("/create-stream", IntegracaoController.createStream);
integracaoOpenIaRoute.post(
  "/question",
  upload.array("file"),
  IntegracaoController.question
);

export { integracaoOpenIaRoute };
