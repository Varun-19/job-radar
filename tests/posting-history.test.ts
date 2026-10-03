import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameSource, postingContentChanged } from '@jobradar/domain';
test('posting identity includes provider, board, and posting ID',()=>{
 const source={provider:'greenhouse',board:'fixture',postingId:'123'};
 assert.equal(sameSource(source,{...source}),true);
 assert.equal(sameSource(undefined,source),false);
 assert.equal(sameSource(source,{...source,board:'other'}),false);
 assert.equal(sameSource(source,{...source,postingId:'124'}),false);
});
test('content changes require review; timestamps alone do not',()=>{
 const content={company:'Fixture',title:'Staff Web Engineer',location:'India',description:'Build a platform',url:'https://example.com/123'};
 assert.equal(postingContentChanged(content,{...content}),false);
 for(const field of ['company','title','location','description','url'] as const)assert.equal(postingContentChanged(content,{...content,[field]:'changed'}),true);
});
