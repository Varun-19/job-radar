import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedRequestHost,localHost } from '../apps/api/src/access';
import { createApp } from '../apps/api/src/app';
test('local release rejects remote hosts and foreign origins on private reads',async()=>{
 assert.equal(localHost('0.0.0.0'),false);assert.equal(allowedRequestHost('127.0.0.1:4000'),true);assert.equal(allowedRequestHost('attacker.example:4000'),false);
 const app=createApp();try{assert.equal((await app.inject({method:'GET',url:'/workspace',headers:{host:'attacker.example'}})).statusCode,403);assert.equal((await app.inject({method:'GET',url:'/workspace',headers:{origin:'https://attacker.example'}})).statusCode,403);}finally{await app.close();}
});
