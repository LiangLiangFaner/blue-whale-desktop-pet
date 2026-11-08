'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {PerchController}=require('../src/main/perch.cjs');
test('perch waits several quiet minutes, fires once, and resets on real activity',()=>{
 const perch=new PerchController(180000,300000,()=>.5),floor={handle:'floor'},edge={handle:'window'};
 assert.equal(perch.update(1000,floor,true),false);
 assert.equal(perch.delay,240000,'rest delay is randomly chosen between three and five minutes');
 assert.equal(perch.update(120000,floor,false),false,'ordinary idle gestures do not restart quiet time');
 assert.equal(perch.update(240999,floor,true),false);
 assert.equal(perch.update(241000,floor,true),true);
 assert.equal(perch.update(400000,floor,true),false,'one rest period cannot repeatedly sit');
 perch.reset();
 assert.equal(perch.update(401000,floor,true),false,'touching or walking restarts quiet time');
 assert.equal(perch.update(640999,edge,true),false,'support change also restarts quiet time');
 assert.equal(perch.update(881000,edge,true),true);
});
test('perch can be accelerated by an isolated integration test',()=>{
 const perch=new PerchController(1000,1000,()=>0),floor={handle:'floor'};
 assert.equal(perch.update(0,floor,true),false);
 assert.equal(perch.update(999,floor,true),false);
 assert.equal(perch.update(1000,floor,true),true);
});
