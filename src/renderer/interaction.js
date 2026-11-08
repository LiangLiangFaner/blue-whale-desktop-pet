/* 以角色绘制坐标判断触摸部位；调用方先确认该点位于非透明角色像素内。 */
(function(root,factory){const value=factory();if(typeof module==='object')module.exports=value;else root.PetInteraction=value;})(globalThis,function(){
 'use strict';
 const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
 function regionForPoint(x,y){
  if(ellipse(x,y,300,225,175,135))return 'head';
  if(ellipse(x,y,300,420,110,75))return 'belly';
  return 'body';
 }
 return {regionForPoint};
});
