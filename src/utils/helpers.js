export function acessarPropriedade(obj, caminho) {
  const partes = caminho.split(".");

  return partes.reduce((objetoAtual, parte) => {
    return objetoAtual?.[parte];
  }, obj);
}

export function removeBufferFromObjMap(obj, callback = (e) => e) {
  if (Buffer.isBuffer(obj)) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeBufferFromObjMap(item, callback))
      .filter((item) => item !== undefined);
  }

  if (obj !== null && typeof obj === "object") {
    const resultado = {};
    for (const chave in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, chave)) {
        const valor = removeBufferFromObjMap(obj[chave], callback);
        if (valor !== undefined) {
          resultado[chave] = valor;
        }
      }
    }
    return callback(resultado);
  }

  return callback(obj);
}
