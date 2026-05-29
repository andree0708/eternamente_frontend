import { jsPDF } from 'jspdf';

interface ExportSummary {
  totalSessions: number;
  avgRiskScore: number;
  avgAccuracy: number | null;
}

interface ExportGameRow {
  gameType: string;
  name: string;
  sessions: number;
  avgRiskScore: number;
  avgAccuracy: number | null;
}

interface ExportData {
  patientName: string;
  summary: ExportSummary;
  games: ExportGameRow[];
}

function drawTable(doc: jsPDF, headers: string[], rows: string[][], startY: number, margin: number, pageW: number) {
  const colW = (pageW - margin * 2) / headers.length;
  let y = startY;
  const rowH = 8;

  // Header row
  doc.setFillColor(27, 77, 110);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => {
    doc.rect(margin + i * colW, y, colW, rowH, 'F');
    doc.text(h, margin + i * colW + 2, y + 6);
  });
  y += rowH;

  // Data rows
  doc.setTextColor(44, 44, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rows.forEach((row, ri) => {
    if (ri % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      row.forEach((_, i) => doc.rect(margin + i * colW, y, colW, rowH, 'F'));
    }
    row.forEach((cell, i) => {
      doc.text(cell, margin + i * colW + 2, y + 6);
    });
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y + rowH, pageW - margin, y + rowH);
    y += rowH;
  });

  return y + 4;
}

export function exportClinicalPdf(data: ExportData) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const margin = 20;
    const today = new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    // Header
    doc.setFillColor(27, 77, 110);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EternaMente', margin, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de evaluaci\u00f3n cognitiva', margin, 24);
    doc.text(`Fecha del reporte: ${today}`, margin, 30);

    let y = 50;

    // Patient data
    doc.setTextColor(44, 44, 44);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del paciente', margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${data.patientName}`, margin, y);
    y += 12;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // Summary table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de m\u00e9tricas', margin, y);
    y += 10;

    const riskPct = Math.round(data.summary.avgRiskScore * 100);
    const accPct = data.summary.avgAccuracy != null
      ? Math.round(data.summary.avgAccuracy * 100)
      : null;

    y = drawTable(doc,
      ['M\u00e9trica', 'Valor'],
      [
        ['Sesiones totales', String(data.summary.totalSessions)],
        ['Riesgo promedio', `${riskPct}%`],
        ['Precisi\u00f3n promedio', accPct != null ? `${accPct}%` : '---'],
      ],
      y, margin, pageW
    );

    // Per-game table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desglose por juego', margin, y);
    y += 8;

    const gameRows = data.games.map((g) => [
      g.name,
      String(g.sessions),
      `${Math.round(g.avgRiskScore * 100)}%`,
      g.avgAccuracy != null ? `${Math.round(g.avgAccuracy * 100)}%` : '---',
    ]);

    y = drawTable(doc,
      ['Juego', 'Sesiones', 'Riesgo', 'Precisi\u00f3n'],
      gameRows,
      y, margin, pageW
    );

    // Risk scale
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Escala de riesgo:', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(56, 161, 105);
    doc.text('Normal (< 40%)', margin, y);
    y += 5;
    doc.setTextColor(214, 158, 46);
    doc.text('Vigilancia (40% - 70%)', margin, y);
    y += 5;
    doc.setTextColor(229, 62, 62);
    doc.text('Alerta (> 70%)', margin, y);
    y += 12;

    // Disclaimer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    [
      'Este informe ha sido generado por EternaMente, una herramienta digital de apoyo a la evaluaci\u00f3n cognitiva.',
      'Los resultados mostrados son orientativos y no constituyen un diagn\u00f3stico m\u00e9dico.',
      'EternaMente es \u00fanicamente una aplicaci\u00f3n de apoyo y no reemplaza la evaluaci\u00f3n de un profesional de la salud.',
      'Se recomienda consultar con un especialista ante cualquier inquietud sobre los resultados.',
    ].forEach((line) => {
      doc.text(line, margin, y);
      y += 4.5;
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('EternaMente \u00b7 Plataforma de evaluaci\u00f3n cognitiva', pageW / 2, 285, { align: 'center' });
    doc.text('P\u00e1gina 1 de 1', pageW / 2, 289, { align: 'center' });

    doc.save('reporte_cognitivo.pdf');
  } catch (err) {
    console.error('Error al generar PDF:', err);
    alert('Error al generar el PDF. Revisa la consola para m\u00e1s detalles.');
  }
}
