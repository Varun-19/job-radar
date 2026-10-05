'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

const primary=[['Today','/'],['Opportunities','/opportunities'],['Applications','/applications'],['Recruiters','/recruiters']];
const review=[['Analysis review','/analysis']];
const setup=[['Sources & scans','/discovery'],['Search profiles','/profiles'],['Résumé & evidence','/evidence'],['Target companies','/companies'],['Connections','/connections']];
export function WorkspaceNavigation(){
 const path=usePathname();
 const links=(items:string[][])=>items.map(([label,href])=><Link key={href} href={href} aria-current={path===href?'page':undefined}>{label}</Link>);
 return <nav aria-label="Main navigation"><div className="nav-group">{links(primary)}</div><div className="nav-group"><p className="nav-label">REVIEW</p>{links(review)}</div><details className="nav-setup" key={setup.some(([,href])=>href===path)?'setup':'search'} open={setup.some(([,href])=>href===path)}><summary>Search setup</summary><div className="nav-group">{links(setup)}</div></details></nav>;
}
