import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PDF_CORES = {
  PRIMARIA: [13, 71, 161],
  PRIMARIA_CLARA: [59, 130, 246],
  ESCURA: [30, 58, 138],
  CINZA_CLARO: [245, 247, 250],
  TEXTO: [55, 65, 81],
  BORDA: [209, 213, 219],
  VERDE: [16, 185, 129],
  VERMELHO: [220, 38, 38],
  AMARELO: [245, 158, 11]
};

let logoCache = null;

export async function carregarLogo() {
  if (logoCache !== null) return logoCache;
  try {
    const base = import.meta.env.VITE_API_URL || '';
    const urls = [
      `${base}/Logotipo.png`,
      `/Logotipo.png`,
      `${window.location.origin}/Logotipo.png`
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const blob = await res.blob();
        logoCache = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (logoCache) return logoCache;
      } catch (e) {
        /* tenta o próximo */
      }
    }
    logoCache = null;
  } catch (e) {
    logoCache = null;
  }
  return logoCache;
}

export function criarPdf(orientation = 'portrait') {
  return new jsPDF({ orientation, unit: 'mm', format: 'a4' });
}

export function formatNumero(v, decimais = 0) {
  if (v == null || isNaN(Number(v))) return decimais ? '0,00' : '0';
  return Number(v).toLocaleString('pt-PT', { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

export function formatData(iso) {
  try {
    return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso || '';
  }
}

export function cabecalhoPagina(doc, opts = {}) {
  const { titulo, subtitulo, logo } = opts;
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  doc.setFillColor(...PDF_CORES.PRIMARIA);
  doc.rect(0, 0, pw, 16, 'F');
  doc.setFillColor(...PDF_CORES.PRIMARIA_CLARA);
  doc.rect(0, 16, pw, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIME - Educa Mais+ Angola', 12, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Integrado de Monitorização Escolar • República de Angola', 12, 13.5);

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', pw - 30, 2, 18, 12);
    } catch (e) {
      /* ignora logo inválido */
    }
  }

  doc.setTextColor(...PDF_CORES.TEXTO);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo || 'Relatório', 12, 30);
  if (subtitulo) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text(subtitulo, 12, 35);
  }
  return { pw, ph, y: 40 };
}

export function rodapePaginas(doc) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PDF_CORES.BORDA);
    doc.setLineWidth(0.3);
    doc.line(12, ph - 12, pw - 12, ph - 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 140);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${formatData(new Date().toISOString())}`, 12, ph - 6);
  }
}

export function secaoPDF(doc, numero, titulo, { pw, ph, m = 12 } = {}) {
  const yStart = doc.y || 40;
  if (yStart + 20 > ph - 15) {
    doc.addPage();
    doc.y = 22;
  }
  doc.y += 4;
  doc.setFillColor(...PDF_CORES.PRIMARIA);
  doc.rect(m - 3, doc.y - 4.5, 3, 9, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_CORES.PRIMARIA);
  doc.text(numero ? `${numero}. ${titulo}` : titulo, m, doc.y);
  doc.y += 5;
  doc.setDrawColor(...PDF_CORES.PRIMARIA);
  doc.setLineWidth(0.3);
  doc.line(m, doc.y, (pw || doc.internal.pageSize.getWidth()) - m, doc.y);
  doc.y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_CORES.TEXTO);
}

export function tabelaPDF(doc, head, body, opts = {}) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = opts.margin || 12;
  if ((doc.y || 40) + 30 > ph - 15) {
    doc.addPage();
    doc.y = 22;
  }
  autoTable(doc, {
    startY: doc.y,
    head: [head],
    body,
    theme: 'striped',
    headStyles: { fillColor: opts.headColor || PDF_CORES.PRIMARIA, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: PDF_CORES.TEXTO },
    alternateRowStyles: { fillColor: PDF_CORES.CINZA_CLARO },
    margin: { left: m, right: m },
    styles: { cellPadding: 2.5 },
    ...opts.tableOptions
  });
  doc.y = (doc.lastAutoTable?.finalY || doc.y) + 8;
}
