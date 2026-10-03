import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractResume } from '../apps/api/src/resume-upload';
function pdf(text:string) {
 const content=text?`BT /F1 12 Tf 50 700 Td (${text}) Tj ET`:'';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
 let data='%PDF-1.4\n';const offsets=[0];objects.forEach((object,i)=>{offsets.push(Buffer.byteLength(data));data+=`${i+1} 0 obj\n${object}\nendobj\n`;});
 const start=Buffer.byteLength(data);data+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
 return Buffer.from(data).toString('base64');
}
test('extracts a local PDF without changing its original bytes',async()=>{const original=pdf('Staff frontend experience');const extracted=await extractResume('resume.pdf',original);assert.match(extracted.text,/Staff frontend experience/);assert.equal(extracted.originalBase64,original);});
test('rejects image-only/empty PDFs and invalid upload formats',async()=>{await assert.rejects(extractResume('resume.pdf',pdf('')),/No text found/);await assert.rejects(extractResume('resume.pdf',Buffer.from('not a PDF').toString('base64')),/not a PDF/);await assert.rejects(extractResume('resume.exe',Buffer.from('text').toString('base64')),/Supported files/);});
test('retains plain text content',async()=>{const text='  Platform experience\n';assert.equal((await extractResume('resume.txt',Buffer.from(text).toString('base64'))).text,text);});
