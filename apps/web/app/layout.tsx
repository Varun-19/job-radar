import type { Metadata } from 'next';
import Link from 'next/link';
import {WorkspaceNavigation} from '../components/workspace-navigation';
import './globals.css';
export const metadata: Metadata = { title: 'JobRadar', description: 'Your job and recruiter discovery workspace' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><div className="shell"><aside><Link href="/" className="brand">◉ JobRadar</Link><p className="caption">YOUR SEARCH</p><WorkspaceNavigation/><div className="aside-note">Personal workspace</div></aside><main>{children}</main></div></body></html>; }
