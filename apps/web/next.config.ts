import type { NextConfig } from 'next';
const config: NextConfig = { transpilePackages: ['@jobradar/contracts', '@jobradar/domain'] };
export default config;
