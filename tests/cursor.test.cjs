'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Tracker,Follow}=require('../src/renderer/cursor.js');
const point=(x,y,time,enabled=true)=>({x,y,time,enabled,eyeX:0,eyeY:0});
test('cursor gaze uses screen direction and stays bounded across monitors',()=>{
 const tracker=new Tracker();let p=tracker.update(point(-300,-200,0));assert.ok(p.x<0&&p.y<0);assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1);
 p=tracker.update(point(10000,10000,40));assert.equal(p.rub,false);assert.ok(p.x>0&&p.y>0);
 p=tracker.update(point(10000,10000,6000));assert.equal(p.rub,false);
 assert.equal(tracker.update(point(10000,10000,11040)).active,false);
});
test('ordinary movement, one fast sweep and cursor teleports do not cause eye rubbing',()=>{
 for(const scenario of ['ordinary','sweep','teleport']){
  const tracker=new Tracker();for(let i=0;i<50;i++){
   const x=scenario==='ordinary'?i*5:scenario==='sweep'?i*50:(i%2)*2000;
   assert.equal(tracker.update(point(x,0,i*40)).rub,false,scenario);
  }
 }
});
test('sustained fast reversals trigger one rub, then resting and cooldown prevent repeats',()=>{
 const tracker=new Tracker();let triggers=0,first=0,resumed=false;
 for(let i=0;i<500;i++){
  const p=tracker.update(point(i%2*80,0,i*40));
  if(p.rub){triggers++;first=i*40;}
  if(triggers&&i*40>first+4600&&p.active)resumed=true;
 }
 assert.equal(triggers,1);assert.ok(first>=1000);assert.equal(resumed,true);
});
test('disabled or busy observation clears fatigue and invalid events cannot trigger reactions',()=>{
 const tracker=new Tracker();for(let i=0;i<100;i++)assert.equal(tracker.update(point(i%2*80,0,i*40,false)).rub,false);
 assert.deepEqual(tracker.update(point(NaN,0,4000)),{x:0,y:0,active:false,rub:false});
 assert.equal(tracker.update(point(0,0,4040)).rub,false);
});
test('eye rubbing can be disabled without disabling gaze',()=>{
 const tracker=new Tracker();let followed=false;
 for(let i=0;i<100;i++){
  const p=tracker.update({...point(i%2*80,0,i*40),rubEnabled:false});
  assert.equal(p.rub,false);if(p.active&&Math.abs(p.x)>.1)followed=true;
 }
 assert.equal(followed,true);
});
test('gaze eases toward targets independently of sampling rate, then returns to rest',()=>{
 const a=new Follow(),b=new Follow();for(let i=0;i<60;i++)a.update({active:true,x:1,y:-1},1/60);for(let i=0;i<30;i++)b.update({active:true,x:1,y:-1},1/30);
 assert.ok(Math.abs(a.x-b.x)<.002);assert.ok(a.x>.99&&a.y<-.99);
 const c=new Follow();assert.ok(c.update({active:true,x:1,y:0},1/60).x<.2);
 for(let i=0;i<90;i++)c.update(null,1/60);assert.equal(c.x,0);
});
