import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (title: string, columns: string[], data: any[][]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [columns],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] }, // Tailwind blue-900
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};
