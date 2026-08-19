const { ObjectId } = require('mongodb');

function oid(id) {
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function matchInstituicaoId(id) {
  if (!id) return null;
  const objId = oid(id);
  if (!objId) return id;
  return { $in: [id, objId] };
}

const matchId = matchInstituicaoId;

function lookupInstituicao(field, as) {
  return {
    $lookup: {
      from: 'instituicoes',
      let: { iid: '$' + field },
      pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, { $toString: '$$iid' }] } } }],
      as
    }
  };
}

module.exports = { oid, matchInstituicaoId, matchId, lookupInstituicao };