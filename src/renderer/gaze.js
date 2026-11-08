'use strict';
// 对原画做幅度受限的连续形变：眼睑边缘固定，眼内纹理随视线移动。
class PetGaze {
 constructor(){this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=1024;this.ready=false;this.canvas.addEventListener('webglcontextlost',()=>{this.ready=false;});}
 init(frames){
  const gl=this.canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true,failIfMajorPerformanceCaveat:true});if(!gl)return false;this.gl=gl;
  const compile=(kind,source)=>{const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
   in vec2 position;out vec2 uv;void main(){gl_Position=vec4(position,0.,1.);uv=vec2(position.x*.5+.5,.5-position.y*.5);}`);
  const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
   precision highp float;in vec2 uv;out vec4 pixel;uniform sampler2D sprite;uniform vec2 gaze;uniform float eyesOpen;
   float mask(vec2 p,vec2 center,vec2 radius,float inner){return 1.-smoothstep(inner,1.,length((p-center)/radius));}
   void main(){vec2 p=uv-gaze*vec2(.005,.003)*mask(uv,vec2(.465,.34),vec2(.28,.25),.55);
    float eye=max(mask(p,vec2(.403,.446),vec2(.034,.025),.35),mask(p,vec2(.522,.446),vec2(.034,.025),.35));
    p-=gaze*vec2(.010,.005)*eye*eyesOpen;vec4 c=texture(sprite,p);pixel=vec4(c.rgb*c.a,c.a);}`);
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  this.gaze=gl.getUniformLocation(program,'gaze');this.eyesOpen=gl.getUniformLocation(program,'eyesOpen');gl.uniform1i(gl.getUniformLocation(program,'sprite'),0);
  this.textures=[0,1].map(frame=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const parameter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,parameter,gl.LINEAR);for(const parameter of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,parameter,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,frames[frame]);return texture;});
  this.ready=true;return true;
 }
 enabled(p){return this.ready&&p.atlas==='idle-front'&&(Math.abs(p.gazeX||0)+Math.abs(p.gazeY||0)>.001);}
 render(p){if(!this.enabled(p))return null;const gl=this.gl;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.bindTexture(gl.TEXTURE_2D,this.textures[p.blink>.35?1:0]);gl.uniform2f(this.gaze,p.gazeX,p.gazeY);gl.uniform1f(this.eyesOpen,p.blink>.35?0:1);gl.drawArrays(gl.TRIANGLES,0,6);return this.canvas;}
 mapPoint(p,x,y){
  if(!this.enabled(p))return {x,y};
  const mask=(x,y,cx,cy,rx,ry,inner)=>{const t=Math.max(0,Math.min(1,(Math.hypot((x-cx)/rx,(y-cy)/ry)-inner)/(1-inner)));return 1-t*t*(3-2*t);};
  const head=mask(x,y,.465,.34,.28,.25,.55);x-=p.gazeX*.005*head;y-=p.gazeY*.003*head;
  if(p.blink<=.35){const eye=Math.max(mask(x,y,.403,.446,.034,.025,.35),mask(x,y,.522,.446,.034,.025,.35));x-=p.gazeX*.010*eye;y-=p.gazeY*.005*eye;}
  return {x,y};
 }
}
globalThis.PetGaze=PetGaze;
