const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const DISTANCIAS_PROVINCIAIS = {
  'Huambo': { 'Huambo': 0, 'Bengo': 350, 'Benguela': 180, 'Bie': 190, 'Cabinda': 550,
    'Cuando-Cubango': 500, 'Cuanza Norte': 320, 'Cuanza Sul': 350, 'Cunene': 520,
    'Icolo e Bengo': 360, 'Huila': 280, 'Luanda': 450, 'Lunda Norte': 900,
    'Lunda Sul': 850, 'Malanje': 420, 'Moxico': 700, 'Namibe': 400, 'Uige': 600, 'Zaire': 500 },
  'Bie': { 'Huambo': 190, 'Bie': 0, 'Benguela': 200, 'Luanda': 580, 'Huila': 200 },
  'Huila': { 'Huambo': 280, 'Bie': 200, 'Luanda': 620, 'Benguela': 350 },
  'Benguela': { 'Huambo': 180, 'Bie': 200, 'Luanda': 380, 'Huila': 350 },
  'Luanda': { 'Huambo': 450, 'Bie': 580, 'Benguela': 380, 'Huila': 620 }
};

const PRECO_POR_KM = 25;
const FATOR_ENCHENTE = 1.25;
const PERCENT_MAX_TAXA = 0.6;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calcularDistancia(provinciaOrigem, municipioOrigem, instituicao) {
    if (instituicao.latitude && instituicao.longitude) {
    const MUNICIPIOS_COORDS = {
      'Huambo': [-12.7642, 15.7367], 'Caála': [-12.85, 15.56], 'Bailundo': [-12.7833, 15.9333],
      'Catchinga': [-12.65, 15.85], 'Mundundo': [-12.7, 15.65],
      'Bie': [-12.1667, 15.7333], 'Benguela': [-12.55, 13.4], 'Luanda': [-8.8383, 13.2344],
      'Huila': [-14.9167, 14.9167], 'Namibe': [-15.2, 12.15], 'Cunene': [-16.75, 15.5],
      'Cuando-Cubango': [-17.5, 19.0], 'Malanje': [-9.5333, 16.3333], 'Uige': [-7.6, 15.0],
      'Zaire': [-6.5667, 13.1667], 'Cabinda': [-5.55, 12.2], 'Cuanza Norte': [-9.3, 14.8333],
      'Cuanza Sul': [-10.5, 14.5], 'Icolo e Bengo': [-9.25, 13.5], 'Lunda Norte': [-7.5, 20.0],
      'Lunda Sul': [-10.2833, 20.7167], 'Moxico': [-13.4167, 18.5], 'Bengo': [-9.0, 13.75]
    };
    const coords = MUNICIPIOS_COORDS[municipioOrigem] || MUNICIPIOS_COORDS[provinciaOrigem] || [-12.7642, 15.7367];
    const distHaversine = haversine(coords[0], coords[1], instituicao.latitude, instituicao.longitude);
    return Math.round(distHaversine * 1.4);
  }
  const provinciaInst = instituicao.provincia_nome || 'Huambo';
  if (provinciaOrigem === provinciaInst) return 50;
  const dist = DISTANCIAS_PROVINCIAIS[provinciaOrigem]?.[provinciaInst];
  return dist || 300;
}

function calcularCustoPassagem(distanciaKm) {
  return Math.round(distanciaKm * PRECO_POR_KM * 2);
}

function contarNaFila(instituicaoId) {
  const result = db.prepare(
    "SELECT COUNT(*) as total FROM solicitacoes WHERE instituicao_id = ? AND estado IN ('pendente', 'agendado')"
  ).get(instituicaoId);
  return result.total || 0;
}

router.get('/calcular', authenticateToken, (req, res) => {
  try {
    const { instituicao_id, provincia_origem, municipio_origem } = req.query;
    if (!instituicao_id) return res.status(400).json({ error: 'instituicao_id obrigatório' });

    const instituicao = db.prepare(`
      SELECT i.*, m.nome as municipio_nome, p.nome as provincia_nome
      FROM instituicoes i
      LEFT JOIN municipios m ON i.municipio_id = m.id
      LEFT JOIN provincias p ON m.provincia_id = p.id
      WHERE i.id = ?
    `).get(instituicao_id);

    if (!instituicao) return res.status(404).json({ error: 'Instituição não encontrada' });

    const provOrigem = provincia_origem || 'Huambo';
    const munOrigem = municipio_origem || instituicao.municipio_nome || 'Huambo';
    const distancia = calcularDistancia(provOrigem, munOrigem, instituicao);
    const custoPassagemIdaVolta = calcularCustoPassagem(distancia);
    const taxaMaxima = Math.round(custoPassagemIdaVolta * PERCENT_MAX_TAXA);

    const naFila = contarNaFila(instituicao_id);
    const fatorFila = naFila > 20 ? 1.2 : naFila > 10 ? 1.1 : 1.0;

    const mesAtual = new Date().getMonth() + 1;
    const isEnchente = mesAtual >= 10 || mesAtual <= 4;
    const fatorEnchente = isEnchente ? FATOR_ENCHENTE : 1.0;

    let taxaReserva = Math.round(taxaMaxima * fatorFila * fatorEnchente);
    taxaReserva = Math.min(taxaReserva, taxaMaxima);

    const provinciaInst = instituicao.provincia_nome || 'Huambo';
    let categoria;
    if (provOrigem === provinciaInst && munOrigem === (instituicao.municipio_nome || '')) {
      categoria = 'mesma_area';
    } else if (provOrigem === provinciaInst) {
      categoria = 'mesma_provincia';
    } else {
      categoria = 'outra_provincia';
    }

    res.json({
      distancia_km: Math.round(distancia),
      custo_passagem_ida_volta: custoPassagemIdaVolta,
      percentual_aplicado: PERCENT_MAX_TAXA * 100,
      taxa_maxima: taxaMaxima,
      taxa_reserva: taxaReserva,
      categoria,
      fila_atual: naFila,
      em_periodo_enchente: isEnchente,
      provincia_origem: provOrigem,
      provincia_destino: provinciaInst
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular taxa de reserva' });
  }
});

module.exports = router;
