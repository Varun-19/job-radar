import {PDFParse} from 'pdf-parse';
import {resumeReview} from '@jobradar/domain';
export async function documentDiagnostics(mediaType:string,base64:string,text:string){
 const checks=resumeReview(text).checks;
 if(mediaType!=='application/pdf')return {format:'text',pages:[],checks,limitations:'Text files have no PDF layout to inspect. Employer parser compatibility remains unverified.'};
 const parser=new PDFParse({data:Buffer.from(base64,'base64')});
 try{
  const info=await parser.getInfo({parsePageInfo:true});
  if(info.total>30)throw new Error('Document diagnostics supports résumés up to 30 pages.');
  const extracted=await parser.getText();
  const pages=extracted.pages.map(p=>({number:p.num,characters:p.text.trim().length,width:info.pages.find(i=>i.pageNumber===p.num)?.width??null,height:info.pages.find(i=>i.pageNumber===p.num)?.height??null,linkCount:info.pages.find(i=>i.pageNumber===p.num)?.links.length??0}));
  return {format:'pdf',pages,checks:[...checks,{name:'Text on every page',status:pages.every(p=>p.characters>=50)?'pass':'review',detail:pages.every(p=>p.characters>=50)?'Every page contains extractable text. Verify reading order against the original PDF.':'At least one page has very little extractable text; inspect for scanned images or omitted content.'},{name:'Page format',status:pages.every(p=>p.width&&p.height&&p.width>=590&&p.width<=620&&p.height>=780&&p.height<=850)?'pass':'review',detail:'Common A4/Letter dimensions are approximately 595×842 / 612×792 points. Smaller or unusual pages should be reviewed for font size and print readability.'}],limitations:'These are structural observations, not an employer ATS score. Text extraction does not prove correct column order, OCR completeness or visual layout compatibility.'};
 }finally{await parser.destroy();}
}
