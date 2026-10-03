'use client';
import { useEffect, useState } from 'react';
import { healthSchema } from '@jobradar/contracts';
export function ApiStatus() {
 const [status, setStatus] = useState('Checking backend…');
 useEffect(() => { const controller = new AbortController(); fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/health`, { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error('Unavailable'); healthSchema.parse(await r.json()); setStatus('Backend connected · persistence pending'); }).catch(() => { if (!controller.signal.aborted) setStatus('Backend unavailable · start the API'); }); return () => controller.abort(); }, []);
 return <span role="status" className="status">{status}</span>;
}
