export function acessarPropriedade(obj, caminho) {
  const partes = caminho.split(".");

  return partes.reduce((objetoAtual, parte) => {
    return objetoAtual?.[parte];
  }, obj);
}
