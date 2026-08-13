import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

// Converts the Gemini-generated Markdown CV/cover-letter content into a real,
// single-column .docx file — no tables, no text boxes, no headers/footers, no
// graphics, matching ATS best practices (DOCX parses far more reliably than PDF,
// and a raw .txt attachment reads as unprofessional to a human recruiter).
function parseInlineRuns(line: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else {
      runs.push(new TextRun(part));
    }
  }
  return runs.length > 0 ? runs : [new TextRun('')];
}

export async function markdownToDocxBuffer(markdown: string, docTitle?: string): Promise<Buffer> {
  const lines = markdown.split('\n');
  const children: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === '') {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.slice(4).replace(/\*\*/g, ''), heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.slice(3).replace(/\*\*/g, ''), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    } else if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: line.slice(2).replace(/\*\*/g, ''), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 } }));
    } else if (/^[-*]\s+/.test(line)) {
      children.push(new Paragraph({ children: parseInlineRuns(line.replace(/^[-*]\s+/, '')), bullet: { level: 0 }, spacing: { after: 60 } }));
    } else if (/^\d+\.\s+/.test(line)) {
      children.push(new Paragraph({ children: parseInlineRuns(line.replace(/^\d+\.\s+/, '')), numbering: { reference: 'numbered-list', level: 0 }, spacing: { after: 60 } }));
    } else {
      children.push(new Paragraph({ children: parseInlineRuns(line), spacing: { after: 100 } }));
    }
  }

  const doc = new Document({
    numbering: {
      config: [{ reference: 'numbered-list', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] }]
    },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children
    }],
    title: docTitle
  });

  return Packer.toBuffer(doc);
}
