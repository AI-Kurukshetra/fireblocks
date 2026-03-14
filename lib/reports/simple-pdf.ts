function escapePdfText(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function createSimplePdf(title: string, lines: string[]) {
  const contentLines = [title, '', ...lines]
  const textOperations = contentLines
    .map((line, index) => `1 0 0 1 48 ${760 - index * 18} Tm (${escapePdfText(line)}) Tj`)
    .join('\n')

  const stream = `BT
/F1 16 Tf
${textOperations}
ET`

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  for (const object of objects) {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  }

  const xrefOffset = pdf.length
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`

  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n 
`
  }

  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`

  return Buffer.from(pdf, 'utf8')
}
