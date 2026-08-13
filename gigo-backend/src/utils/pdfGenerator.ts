import PDFDocument from 'pdfkit';

// Converts the same Gemini-generated Markdown content to PDF. DOCX parses more
// reliably through ATS software (4% failure vs 18% for PDF), but PDF remains the
// more commonly expected submission format for human reviewers — GiGO generates
// both and lets whichever format the employer's process favors do the work.
function stripBold(text: string): { text: string; boldRanges: Array<[number, number]> } {
  const boldRanges: Array<[number, number]> = [];
  let clean = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        const boldText = text.slice(i + 2, end);
        boldRanges.push([clean.length, clean.length + boldText.length]);
        clean += boldText;
        i = end + 2;
        continue;
      }
    }
    clean += text[i];
    i++;
  }
  return { text: clean, boldRanges };
}

export function markdownToPdfBuffer(markdown: string, docTitle?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: 'A4', info: docTitle ? { Title: docTitle } : undefined });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica');

    const writeLine = (raw: string, opts: { size?: number; bold?: boolean; bullet?: boolean; gapBefore?: number; gapAfter?: number } = {}) => {
      const { text } = stripBold(raw);
      if (opts.gapBefore) doc.moveDown(opts.gapBefore);
      doc.fontSize(opts.size || 10.5).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(opts.bullet ? `•  ${text}` : text, { indent: opts.bullet ? 12 : 0 });
      if (opts.gapAfter) doc.moveDown(opts.gapAfter);
    };

    const lines = markdown.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (line.trim() === '') {
        doc.moveDown(0.4);
        continue;
      }
      if (line.startsWith('### ')) writeLine(line.slice(4), { size: 12, bold: true, gapBefore: 0.3, gapAfter: 0.15 });
      else if (line.startsWith('## ')) writeLine(line.slice(3), { size: 14, bold: true, gapBefore: 0.4, gapAfter: 0.2 });
      else if (line.startsWith('# ')) writeLine(line.slice(2), { size: 18, bold: true, gapBefore: 0.4, gapAfter: 0.25 });
      else if (/^[-*]\s+/.test(line)) writeLine(line.replace(/^[-*]\s+/, ''), { bullet: true, gapAfter: 0.08 });
      else if (/^\d+\.\s+/.test(line)) writeLine(line, { gapAfter: 0.08 });
      else writeLine(line, { gapAfter: 0.15 });
    }

    doc.end();
  });
}
