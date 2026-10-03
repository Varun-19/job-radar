import { PDFParse } from 'pdf-parse';
import { InvalidMutation } from '@jobradar/services';
export async function extractResume(filename:string,base64:string) {
 const bytes=Buffer.from(base64,'base64');
 if(!bytes.length || bytes.length>4*1024*1024)throw new InvalidMutation('Choose a résumé under 4 MB.');
 let text:string;let mediaType:'application/pdf'|'text/plain';
 if(filename.toLowerCase().endsWith('.pdf')) {
  if(bytes.subarray(0,5).toString()!=='%PDF-')throw new InvalidMutation('This file is not a PDF.');
  mediaType='application/pdf';const parser=new PDFParse({data:bytes});
  try{const result=await parser.getText();text=result.pages.map(page=>page.text).join('\n\n');}catch{throw new InvalidMutation('Unable to read this PDF. Try a text-based PDF or paste the résumé text.');}finally{await parser.destroy();}
 }else if(/\.(txt|md)$/i.test(filename)){mediaType='text/plain';text=bytes.toString('utf8');}
 else throw new InvalidMutation('Supported files: PDF, TXT, and Markdown.');
 if(!text.trim())throw new InvalidMutation('No text found. Scanned PDFs need OCR; paste the résumé text instead.');
 if(text.length>100000)throw new InvalidMutation('Extracted text exceeds 100,000 characters.');
 return {text,mediaType,originalBase64:bytes.toString('base64')};
}
