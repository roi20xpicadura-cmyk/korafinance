import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TxRow {
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  origin: string;
}

interface ReportData {
  transactions: TxRow[];
  userName: string;
  period: string;
  currency: string;
}

export function generateMonthlyPDF({ transactions, userName, period, currency }: ReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  const fmtMoney = (v: number) =>
    `${currency} ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Brand palette — KoraFinance roxo
  const PURPLE: [number, number, number] = [124, 58, 237];      // #7C3AED
  const PURPLE_DARK: [number, number, number] = [91, 33, 182];   // #5B21B6
  const PURPLE_LIGHT: [number, number, number] = [237, 233, 254]; // #EDE9FE
  const SUCCESS: [number, number, number] = [22, 163, 74];
  const DANGER: [number, number, number] = [220, 38, 38];
  const INK: [number, number, number] = [31, 41, 55];
  const MUTED: [number, number, number] = [107, 114, 128];

  // ── Header com gradiente simulado (faixas) ──
  for (let i = 0; i < 44; i++) {
    const t = i / 44;
    const r = Math.round(PURPLE_DARK[0] + (PURPLE[0] - PURPLE_DARK[0]) * t);
    const g = Math.round(PURPLE_DARK[1] + (PURPLE[1] - PURPLE_DARK[1]) * t);
    const b = Math.round(PURPLE_DARK[2] + (PURPLE[2] - PURPLE_DARK[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageW, 1.05, 'F');
  }

  // Logo badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 11, 14, 14, 3, 3, 'F');
  doc.setTextColor(...PURPLE_DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('K', margin + 7, 20.5, { align: 'center' });

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(19);
  doc.setFont('helvetica', 'bold');
  doc.text('KoraFinance', margin + 18, 19);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório Financeiro · ${period}`, margin + 18, 26);
  doc.setFontSize(8);
  doc.setTextColor(220, 215, 255);
  doc.text(`${userName} · Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin + 18, 31);

  // Selo "Premium"
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageW - margin - 22, 16, 22, 6, 3, 3, 'F');
  doc.setTextColor(...PURPLE_DARK);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL', pageW - margin - 11, 20, { align: 'center' });

  // ── Summary ──
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  let y = 56;
  doc.setTextColor(...INK);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DO PERÍODO', margin, y);
  y += 6;

  const boxW = (pageW - margin * 2 - 8) / 3;
  const boxes = [
    { label: 'RECEITAS', value: fmtMoney(income), color: SUCCESS, accent: [220, 252, 231] as [number, number, number] },
    { label: 'DESPESAS', value: fmtMoney(expense), color: DANGER, accent: [254, 226, 226] as [number, number, number] },
    { label: 'SALDO LÍQUIDO', value: fmtMoney(balance), color: balance >= 0 ? PURPLE : DANGER, accent: balance >= 0 ? PURPLE_LIGHT : [254, 226, 226] as [number, number, number] },
  ];

  boxes.forEach((box, i) => {
    const x = margin + i * (boxW + 4);
    // Sombra leve (offset)
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(x + 0.4, y + 0.4, boxW, 26, 4, 4, 'F');
    // Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 230, 240);
    doc.roundedRect(x, y, boxW, 26, 4, 4, 'FD');
    // Faixa colorida na esquerda
    doc.setFillColor(...box.color);
    doc.roundedRect(x, y, 1.5, 26, 0.5, 0.5, 'F');
    // Label
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text(box.label, x + 6, y + 8);
    // Valor
    doc.setFontSize(13);
    doc.setTextColor(...box.color);
    doc.setFont('helvetica', 'bold');
    doc.text(box.value, x + 6, y + 18);
  });

  y += 34;

  // ── Category breakdown ──
  const catMap: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = { income: 0, expense: 0 };
    catMap[t.category][t.type as 'income' | 'expense'] += t.amount;
  });

  const catRows = Object.entries(catMap)
    .sort((a, b) => (b[1].expense + b[1].income) - (a[1].expense + a[1].income))
    .slice(0, 10);

  if (catRows.length > 0) {
    doc.setTextColor(...INK);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP CATEGORIAS', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Receitas', 'Despesas', 'Líquido']],
      body: catRows.map(([cat, v]) => [
        cat,
        fmtMoney(v.income),
        fmtMoney(v.expense),
        fmtMoney(v.income - v.expense),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3.5, textColor: INK, lineColor: [240, 240, 245], lineWidth: 0.1 },
      headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: 'bold', cellPadding: 4 },
      alternateRowStyles: { fillColor: [250, 248, 255] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Transaction table ──
  doc.setTextColor(...INK);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('LANÇAMENTOS', margin, y);
  y += 4;

  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
    body: sortedTx.map(t => [
      format(new Date(t.date + 'T12:00:00'), 'dd/MM/yyyy'),
      t.description.substring(0, 40),
      t.category,
      t.type === 'income' ? 'Receita' : 'Despesa',
      (t.type === 'income' ? '+' : '−') + ' ' + fmtMoney(t.amount),
    ]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 3, textColor: INK, lineColor: [240, 240, 245], lineWidth: 0.1 },
    headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: 'bold', cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [250, 248, 255] },
    columnStyles: {
      0: { cellWidth: 22 },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const row = sortedTx[data.row.index];
        if (row) {
          data.cell.styles.textColor = row.type === 'expense' ? DANGER : SUCCESS;
        }
      }
      if (data.section === 'body' && data.column.index === 3) {
        const row = sortedTx[data.row.index];
        if (row) {
          data.cell.styles.textColor = row.type === 'expense' ? DANGER : SUCCESS;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ── Footer on each page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Faixa decorativa roxa no rodapé
    doc.setFillColor(...PURPLE);
    doc.rect(0, pageH - 6, pageW, 6, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`KoraFinance · ${period}`, margin, pageH - 9);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 9, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text('korafinance.app · Sua vida financeira em um só lugar', pageW / 2, pageH - 2.2, { align: 'center' });
  }

  doc.save(`kora-relatorio-${period.replace(/\s/g, '-').toLowerCase()}.pdf`);
}
