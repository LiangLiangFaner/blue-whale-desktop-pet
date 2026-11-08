'use strict';
/** 在同一支撑面安静休息 3–5 分钟才坐下；普通待机小动作不清空休息时间。 */
class PerchController {
 constructor(minDelay=180000,maxDelay=minDelay+120000,random=Math.random){
  this.minDelay=minDelay;this.maxDelay=maxDelay;this.random=random;this.delay=minDelay;this.key=null;this.since=0;this.fired=false;
 }
 update(now,support,eligible){
  if(!support){this.reset();return false;}
  const key=String(support.handle);
  if(key!==this.key){this.key=key;this.since=now;this.fired=false;this.delay=this.minDelay+this.random()*(this.maxDelay-this.minDelay);return false;}
  if(!eligible||this.fired||now-this.since<this.delay)return false;
  this.fired=true;return true;
 }
 reset(){this.key=null;this.since=0;this.fired=false;}
}
module.exports={PerchController};
