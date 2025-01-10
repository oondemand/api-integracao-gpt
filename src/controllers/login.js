import jwt from "jsonwebtoken";

export const login = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado. Token ausente." });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hora,
    });

    res.json({ message: "Token configurado com sucesso" });
  } catch (error) {
    console.log("Erro ao verificar o token:", error);
    return res.status(401).json({ error: "Token inválido." });
  }
};
