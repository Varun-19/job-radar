// Historical universe supplied by the user. Current preferences remain unclassified.
export const companies = [
'Google','LinkedIn','Rubrik','Adobe','Intuit','Atlassian','Microsoft','ServiceNow / Moveworks','Nutanix','Salesforce','Palo Alto Networks','Datadog','Adyen','Zillow','Harvey',
'Uber','Stripe','Databricks','Cloudflare','Confluent','Snowflake','Okta','GitHub','GitLab','MongoDB','Elastic','Redis','Rippling','Procore','Postman','Harness',
'Walmart Global Tech','SAP','Oracle / OCI','Cisco','IBM','Red Hat','Akamai','Zscaler','New Relic','Workday','HPE','Equinix',
'PhonePe','Razorpay','Zeta','Coinbase','PayPal','JPMorganChase','Goldman Sachs','Morgan Stanley','American Express','Mastercard','Commonwealth Bank','Barclays',
'NVIDIA','AMD','Arm','Qualcomm','Broadcom','Arista','Airbnb','Expedia','Booking','Freshworks','Zoho','Target','Lowe’s','Canva','Figma','Notion','Grammarly','Dropbox','Cloudinary',
'iManage','FurtherAI','Sarvam AI','Auxia','Prophecy','Tekion','Gainsight','Automation Anywhere','Epsilon','Gnani.ai','Enterpret','Acceldata','GreyOrange',
'OpenAI','Anthropic','Cohere','Mistral AI','Perplexity','Cursor','Cognition','Replit','Vercel','Supabase',
'GE Vernova','GE HealthCare','Schneider Electric','Wabtec','NetApp','Nextiva','Diligent','Pearson','Sabre','Thoughtworks','Oleria','Noon','Skillz/FIRY','Coupang','Aerospike','ChargePoint','Instawork',
'UnitedHealth Group','Caterpillar','Asha Health','YOptima','Altimate AI','Supa'
].sort((a,b) => a.localeCompare(b));
export const tiers = ['strategic-target','target','watch','opportunistic','excluded','unclassified'] as const;
export const tierLabels = { 'strategic-target': 'Strategic target', target: 'Target', watch: 'Watch', opportunistic: 'Opportunistic', excluded: 'Excluded', unclassified: 'Unclassified' };
// Only explicit historical aliases are shared; similar company names are not merged.
export function companyKey(company:string){const value=company.trim().toLowerCase();return ({'servicenow / moveworks':'servicenow',moveworks:'servicenow','oracle / oci':'oracle','sarvam':'sarvam ai'} as Record<string,string>)[value]??value;}
export function companyTier(preferences:Record<string,typeof tiers[number]>|undefined,company:string):typeof tiers[number]{const exact=preferences?.[company.trim().toLowerCase()];if(exact&&exact!=='unclassified')return exact;const key=companyKey(company);return Object.entries(preferences??{}).find(([name,tier])=>companyKey(name)===key&&tier!=='unclassified')?.[1]??exact??'unclassified';}
