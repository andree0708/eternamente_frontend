import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExportSummary {
  totalSessions: number;
  avgRiskScore: number;
  avgAccuracy: number | null;
}

interface ExportGameRow {
  gameType: string;
  name: string;
  icon: string;
  sessions: number;
  avgRiskScore: number;
  avgAccuracy: number | null;
}

interface ExportTrendPoint {
  playedAt: string;
  riskScore: number;
  gameType: string;
}

interface ExportData {
  patientName: string;
  summary: ExportSummary;
  games: ExportGameRow[];
  trend: ExportTrendPoint[];
}

export function exportClinicalPdf(data: ExportData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const margin = 20;
  const bodyW = pageW - margin * 2;
  const today = new Date().toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  let y = margin;

  // --- Encabezado clínico ---
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

  y = 50;

  // --- Datos del paciente ---
  doc.setTextColor(44, 44, 44);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del paciente', margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${data.patientName}`, margin, y);
  y += 12;

  // --- Línea separadora ---
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Resumen de métricas ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de m\u00e9tricas', margin, y);
  y += 10;

  const riskPct = Math.round(data.summary.avgRiskScore * 100);
  const accPct = data.summary.avgAccuracy != null
    ? Math.round(data.summary.avgAccuracy * 100)
    : null;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const summaryRows = [
    ['Sesiones totales', String(data.summary.totalSessions)],
    ['Riesgo promedio', `${riskPct}%`],
    ['Precisi\u00f3n promedio', accPct != null ? `${accPct}%` : '---'],
  ];
  (doc as any).autoTable({
    startY: y,
    head: [['M\u00e9trica', 'Valor']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [27, 77, 110], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: margin, right: margin },
    tableWidth: bodyW,
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Desglose por juego ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose por juego', margin, y);
  y += 8;

  const gameRows = data.games.map((g) => [
    `${g.icon} ${g.name}`,
    String(g.sessions),
    `${Math.round(g.avgRiskScore * 100)}%`,
    g.avgAccuracy != null ? `${Math.round(g.avgAccuracy * 100)}%` : '---',
  ]);
  (doc as any).autoTable({
    startY: y,
    head: [['Juego', 'Sesiones', 'Riesgo', 'Precisi\u00f3n']],
    body: gameRows,
    theme: 'grid',
    headStyles: { fillColor: [27, 77, 110], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: margin, right: margin },
    tableWidth: bodyW,
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Escala de riesgo ---
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

  // --- Nota legal ---
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const disclaimer = [
    'Este informe ha sido generado por EternaMente, una herramienta digital de apoyo a la evaluaci\u00f3n cognitiva.',
    'Los resultados mostrados son orientativos y no constituyen un diagn\u00f3stico m\u00e9dico.',
    'EternaMente es \u00fanicamente una aplicaci\u00f3n de apoyo y no reemplaza la evaluaci\u00f3n de un profesional de la salud.',
    'Se recomienda consultar con un especialista ante cualquier inquietud sobre los resultados.',
  ];
  disclaimer.forEach((line) => {
    doc.text(line, margin, y);
    y += 4.5;
  });

  // --- Footer ---
  y = 285;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text('EternaMente \u00b7 Plataforma de evaluaci\u00f3n cognitiva \u00b7 eternamente.app', pageW / 2, y, {
    align: 'center',
  });
  doc.text(`P\u00e1gina 1 de 1`, pageW / 2, y + 4, { align: 'center' });

  doc.save('reporte_cognitivo.pdf');
}
