(function(root,factory){const value=factory();if(typeof module==='object')module.exports=value;else root.PetCursor=value;})(globalThis,function(){
 'use strict';
 class Tracker {
  constructor(){this.previous=null;this.fastSeconds=0;this.reversals=0;this.vector=null;this.cooldownUntil=0;this.restUntil=0;this.lastMove=0;}
  reset(){this.fastSeconds=0;this.reversals=0;this.vector=null;}
  update({x,y,time,eyeX,eyeY,enabled=true,rubEnabled=true}){
   if(![x,y,time,eyeX,eyeY].every(Number.isFinite)){this.previous=null;this.reset();return {x:0,y:0,active:false,rub:false};}
   const old=this.previous;this.previous={x,y,time};let rub=false;
   if(!enabled||(rubEnabled&&time<this.restUntil)){this.reset();return {x:0,y:0,active:false,rub};}
   if(old){
    const dt=(time-old.time)/1000,dx=x-old.x,dy=y-old.y,distance=Math.hypot(dx,dy);
    if(dt<=0||dt>.3||distance>600){this.reset();if(distance>2)this.lastMove=time;}
    else if(!rubEnabled){this.reset();if(distance>2)this.lastMove=time;}
    else{
     if(distance>2)this.lastMove=time;
     const speed=distance/dt;
     if(speed>=900){
      const v={x:dx/distance,y:dy/distance};
      if(this.vector&&v.x*this.vector.x+v.y*this.vector.y<-.25)this.reversals++;
      this.vector=v;this.fastSeconds+=Math.min(dt,.12);
     }else{this.fastSeconds=Math.max(0,this.fastSeconds-dt*2);if(this.fastSeconds===0)this.reset();}
     if(time<this.cooldownUntil)this.reset();
     if(this.fastSeconds>=1&&this.reversals>=2){rub=true;this.cooldownUntil=time+20000;this.restUntil=time+4500;this.reset();}
    }
   }else this.lastMove=time;
   const active=!rub&&time-this.lastMove<5000;
   return {x:active?Math.tanh((x-eyeX)/240):0,y:active?Math.tanh((y-eyeY)/200):0,active,rub};
  }
 }
 class Follow {
  constructor(){this.x=0;this.y=0;}
  update(target,dt){
   const weight=1-Math.exp(-Math.min(.1,Math.max(0,dt))*8);
   for(const axis of ['x','y']){const goal=target?.active?Math.max(-1,Math.min(1,Number(target[axis])||0)):0;this[axis]+=(goal-this[axis])*weight;if(Math.abs(goal-this[axis])<.001)this[axis]=goal;}
   return {x:this.x,y:this.y};
  }
 }
 return {Tracker,Follow};
});
