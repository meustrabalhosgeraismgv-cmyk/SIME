const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// Garante que um utilizador com perfil 'encarregado' tem uma entidade
// 'encarregados' ligada. Se a conta não tiver entidade_id (contas antigas
// ou registos sem vínculo), cria a entidade encarregado e liga ao utilizador.
async function resolverEncarregado(usuario) {
  if (!usuario || usuario.perfil !== 'encarregado') return null;

  if (usuario.entidade_id && usuario.entidade_tipo === 'encarregado') {
    return usuario.entidade_id;
  }

  const db = getDB();

  const criterios = [];
  if (usuario.email) criterios.push({ email: usuario.email });
  if (usuario.nome) criterios.push({ nome_completo: usuario.nome });
  if (usuario.telefone) criterios.push({ telefone: usuario.telefone });

  let encarregado = null;
  if (criterios.length > 0) {
    encarregado = await db.collection('encarregados').findOne({ $or: criterios });
  }

  let encarregadoId = encarregado ? encarregado._id.toString() : null;

  if (!encarregadoId) {
    const biAuto = `AUTO-${usuario._id.toString()}`;
    const result = await db.collection('encarregados').insertOne({
      nome_completo: usuario.nome || usuario.username,
      telefone: usuario.telefone || null,
      bi: usuario.bi || biAuto,
      email: usuario.email || null,
      endereco: null,
      created_at: new Date()
    });
    encarregadoId = result.insertedId.toString();
  }

  await db.collection('usuarios').updateOne(
    { _id: new ObjectId(usuario._id) },
    { $set: { entidade_id: encarregadoId, entidade_tipo: 'encarregado' } }
  );

  return encarregadoId;
}

// A partir do token (req.user.id) obtém o id da entidade encarregado do
// utilizador, criando-a se necessário. Devolve null se não for encarregado.
async function getEncarregadoId(req) {
  const db = getDB();
  const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.user.id) });
  return resolverEncarregado(usuario);
}

module.exports = { resolverEncarregado, getEncarregadoId };