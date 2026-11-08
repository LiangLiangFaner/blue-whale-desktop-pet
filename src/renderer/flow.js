'use strict';
// 双向运动场分别对齐前后原画；选择较近的一张单层显示，不做像素淡化。
class PetFlow {
 constructor(){this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=1024;this.ready=false;this.textures=new Map();this.canvas.addEventListener('webglcontextlost',()=>{this.ready=false;});}
 async init(frames){
  const gl=this.canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:true,failIfMajorPerformanceCaveat:true});
  if(!gl||!globalThis.PetFlowData)return false;this.gl=gl;
  const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
   in vec2 position;out vec2 uv;void main(){gl_Position=vec4(position,0.,1.);uv=vec2(position.x*.5+.5,.5-position.y*.5);}`);
  const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
   precision highp float;in vec2 uv;out vec4 pixel;
   uniform sampler2D sprite;uniform sampler2D spriteNext;uniform sampler2D vectors;uniform vec4 tile;uniform float amount;
   vec2 motion(vec2 p,float backward){vec2 q=clamp(p,vec2(.5/64.),vec2(1.-.5/64.));vec4 f=texture(vectors,tile.xy+q*tile.zw);return (mix(f.rg,f.ba,backward)*255.-128.)*.25/256.;}
   vec4 warped(sampler2D source,float progress,float backward){vec2 p=uv;for(int i=0;i<3;i++)p=uv-progress*motion(p,backward);
    if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.))))return vec4(0.);
    vec4 c=texture(source,p);return vec4(c.rgb*c.a,c.a);}
   void main(){
    if(amount<.5)pixel=warped(sprite,amount,0.);
    else pixel=warped(spriteNext,1.-amount,1.);}`);
  this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
  gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(this.program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(this.program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  this.uniform={};for(const name of ['sprite','spriteNext','vectors','tile','amount'])this.uniform[name]=gl.getUniformLocation(this.program,name);
  const field=new Image();await new Promise((resolve,reject)=>{field.onload=resolve;field.onerror=reject;field.src='../../assets/whale/motion-flow.png';});
  // 向量场不是颜色：关闭颜色空间转换及 alpha 预乘，防止后两个数值通道被改写。
  const bitmap=await createImageBitmap(field,{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  this.field=this.texture(bitmap);
  const surface=document.createElement('canvas');surface.width=bitmap.width;surface.height=bitmap.height;
  const pixels=surface.getContext('2d',{willReadFrequently:true});pixels.drawImage(bitmap,0,0);this.fieldBytes=pixels.getImageData(0,0,surface.width,surface.height).data;this.fieldWidth=surface.width;surface.width=surface.height=1;bitmap.close();field.src='';
  for(const key of Object.keys(PetFlowData.entries)){
   const [atlas,a,b]=key.split(':');for(const frame of [a,b])if(!this.textures.has(atlas+':'+frame))this.textures.set(atlas+':'+frame,this.texture(frames[atlas][frame]));
  }
  gl.uniform1i(this.uniform.sprite,0);gl.uniform1i(this.uniform.vectors,1);gl.uniform1i(this.uniform.spriteNext,2);this.ready=true;
  const [atlas,a,b]=Object.keys(PetFlowData.entries)[0].split(':');this.render({atlas,frame:Number(a),nextFrame:Number(b),frameMix:.25});gl.finish();return true;
 }
 mapPoint(p,x,y){
  const index=this.ready?PetFlowData.entries[`${p.atlas}:${p.frame}:${p.nextFrame}`]:undefined;if(index===undefined)return {x,y,frame:p.frame};
  const backward=p.frameMix>=.5,amount=backward?1-p.frameMix:p.frameMix,channel=backward?2:0;
  const read=(u,v,c)=>{const gx=Math.max(0,Math.min(63,u*64-.5)),gy=Math.max(0,Math.min(63,v*64-.5)),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
   const at=(dx,dy)=>this.fieldBytes[((Math.floor(index/PetFlowData.columns)*64+Math.min(63,iy+dy))*this.fieldWidth+index%PetFlowData.columns*64+Math.min(63,ix+dx))*4+channel+c];
   return ((at(0,0)*(1-fx)+at(1,0)*fx)*(1-fy)+(at(0,1)*(1-fx)+at(1,1)*fx)*fy-128)*.25/256;
  };
  let u=x,v=y;for(let i=0;i<3;i++){const dx=read(u,v,0),dy=read(u,v,1);u=x-amount*dx;v=y-amount*dy;}
  return {x:u,y:v,frame:backward?p.nextFrame:p.frame};
 }
 texture(image){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);return t;}
 render(p){
  // 关键帧附近直接显示原画，避免轻微形变也让整角色经过一次重采样。
  if(!this.ready||!Number.isFinite(p.frameMix)||p.frameMix<=.02||p.frameMix>=.98)return null;
  const index=PetFlowData.entries[`${p.atlas}:${p.frame}:${p.nextFrame}`];if(index===undefined)return null;
  const gl=this.gl,t=Math.min(1,p.frameMix);gl.viewport(0,0,this.canvas.width,this.canvas.height);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures.get(p.atlas+':'+p.frame));gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.field);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.textures.get(p.atlas+':'+p.nextFrame));
  gl.uniform4f(this.uniform.tile,index%PetFlowData.columns/PetFlowData.columns,Math.floor(index/PetFlowData.columns)/PetFlowData.rows,1/PetFlowData.columns,1/PetFlowData.rows);
  gl.uniform1f(this.uniform.amount,t);gl.drawArrays(gl.TRIANGLES,0,6);
  return this.canvas;
 }
}
globalThis.PetFlow=PetFlow;
