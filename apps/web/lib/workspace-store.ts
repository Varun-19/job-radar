'use client';
import { useEffect, useState } from 'react';
import type { CompanyTier, OpportunityDraft } from '@jobradar/domain';
interface Workspace { profile: string; tiers: Record<string, Record<string, CompanyTier>>; jobs: OpportunityDraft[]; sorts?: Record<string, string> }
const initial: Workspace = { profile: 'staff', tiers: {}, jobs: [] };
const key = 'jobradar.workbench.v1';
export function useWorkspace() {
 const [data, setData] = useState<Workspace>(initial);
 const [ready, setReady] = useState(false);
 const [error, setError] = useState('');
 useEffect(() => { try { const raw = localStorage.getItem(key); if(raw) { const parsed = JSON.parse(raw); if(parsed && ['staff','sap'].includes(parsed.profile) && Array.isArray(parsed.jobs) && parsed.tiers && typeof parsed.tiers === 'object') setData(parsed); else setError('Saved workspace format is invalid. Changes will not be saved.'); } } catch { setError('Browser storage is unavailable or invalid. Changes will not be saved.'); } setReady(true); }, []);
 function update(change: (previous: Workspace) => Workspace) { const next = change(data); setData(next); try { if(!error) localStorage.setItem(key, JSON.stringify(next)); } catch { setError('Unable to save locally. Keep this tab open to retain changes.'); } }
 const tierOf = (company: string): CompanyTier => data.tiers[data.profile]?.[company.trim().toLowerCase()] ?? 'unclassified';
 const setTier = (company: string, tier: CompanyTier) => update(d => ({ ...d, tiers: { ...d.tiers, [d.profile]: { ...d.tiers[d.profile], [company.trim().toLowerCase()]: tier } } }));
 return { data, update, tierOf, setTier, ready, error };
}
