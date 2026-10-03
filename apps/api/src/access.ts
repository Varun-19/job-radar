export function localHost(host:string){return ['localhost','127.0.0.1','::1'].includes(host);}
export function allowedRequestHost(header:string|undefined){try{return localHost(new URL(`http://${header??''}`).hostname.replace(/^\[|\]$/g,''));}catch{return false;}}
