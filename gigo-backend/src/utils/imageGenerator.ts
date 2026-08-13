import sharp from 'sharp';

// Renders the Markdown CV/cover-letter/portfolio content as a real JPEG image —
// a visual snapshot for quick in-app preview/download, separate from the real
// .docx/.pdf files actually used to email employers. Pure-JS SVG->JPEG via sharp
// (prebuilt binary, no system ImageMagick/poppler/Chromium dependency needed).
const PAGE_WIDTH = 850;
const PAGE_HEIGHT = 1100;
const MARGIN = 50;
const LINE_HEIGHT = 20;
const MAX_CHARS_PER_LINE = 95;

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

export async function markdownToJpegBuffer(markdown: string): Promise<Buffer> {
  const lines = markdown.split('\n');
  const svgLines: string[] = [];
  let y = MARGIN;

  const addLine = (text: string, opts: { size?: number; weight?: string } = {}) => {
    const size = opts.size || 12;
    const weight = opts.weight || 'normal';
    svgLines.push(`<text x="${MARGIN}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="#1a1a2e">${escapeXml(text)}</text>`);
    y += LINE_HEIGHT * (size > 14 ? 1.4 : 1);
  };

  for (const rawLine of lines) {
    if (y > PAGE_HEIGHT - MARGIN) break; // single-page preview only
    const line = rawLine.trimEnd().replace(/\*\*/g, '');
    if (line.trim() === '') { y += LINE_HEIGHT * 0.5; continue; }

    if (line.startsWith('### ')) addLine(line.slice(4), { size: 14, weight: 'bold' });
    else if (line.startsWith('## ')) addLine(line.slice(3), { size: 16, weight: 'bold' });
    else if (line.startsWith('# ')) addLine(line.slice(2), { size: 20, weight: 'bold' });
    else if (/^[-*]\s+/.test(line)) {
      const wrapped = wrapText(`•  ${line.replace(/^[-*]\s+/, '')}`, MAX_CHARS_PER_LINE);
      wrapped.forEach(w => addLine(w));
    } else {
      wrapText(line, MAX_CHARS_PER_LINE).forEach(w => addLine(w));
    }
  }

  const svg = `<svg width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${svgLines.join('\n')}
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}
