import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
export const metadata: Metadata = { title: 'JobRadar', description: 'Your job and recruiter discovery workspace' };
const navigation = [['Today','/'], ['Opportunities','/opportunities'], ['Discovery inbox','/discovery'], ['Analysis review','/analysis'], ['Applications','/applications'], ['Recruiter hunt','/recruiters'], ['Search profiles','/profiles'], ['Evidence & résumés','/evidence'], ['Company universe','/companies'], ['Connections','/connections']];
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><div className="shell"><aside><Link href="/" className="brand">◉ JobRadar</Link><p className="caption">YOUR SEARCH WORKSPACE</p><nav aria-label="Main navigation">{navigation.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav><div className="aside-note">Personal workspace<br/><span>Local workspace</span></div></aside><main>{children}</main></div></body></html>; }
