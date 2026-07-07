/* whimsy.js — the paint desk, one program. As close to real MS Paint as the
   desk allows: every tool live, undo/redo, stickers, the tinted emoji trail.
   Sections open INSIDE the canvas frame as text + a day-colour constellation;
   a project opens as a paper sheet with page turns; the drawing is auto-saved
   and comes back untouched. Direction locked with Div in chat, Jul 6-8. */
(function(){
 var root=document.documentElement;
 function mode(){return root.getAttribute('data-mode')||'day';}
 function isHome(){
  var bn=decodeURIComponent(location.pathname).split('/').pop();
  if(bn&&bn.indexOf('.')<0)bn+='.html';
  return bn===''||bn==='index.html';
 }
 var TINT='sepia(.48) saturate(1.25) hue-rotate(-9deg) brightness(.96)';
 var MOBQ='(max-width:940px),(max-height:520px) and (pointer:coarse)';
 function trailOn(){try{return localStorage.getItem('dvTrail')!=='off';}catch(e){return true;}}

 /* ---------- the trail: always alive in whimsy, faster with the mouse ---------- */
 var RAW='👻🎃🫆🫀🧠🧶👑🐶🐱🐭🐰🦊🐻🐻‍❄️🐨🐯🦁🐮🐸🐣🐤🪿🐦‍⬛🦅🦉🦇🐺🐝🐞🦋🐛🪱🐌🪰🪲🪳🦗🕷️🕸️🦂🐢🐍🦎🐙🦑🪼🦐🦞🦀🐳🐋🦈🦭🫍🐊🐅🦏🐘🐆🦘🦒🐫🐪🐑🦌🐈🐈‍⬛🪶🦤🦩🦫🦦🐁🐿️🐉🐦‍🔥☘️🍀🍂🍁🍄🐚🪸🌾🌹🌷🪻🪷🌺🌸🌼🌻🌕🌑🌙🪐💫🌟✨☄️⚡️🔥☀️🌊🍎🍊🍉🍓🍇🫐🥭🥥🥝🌶️🫑🥒🥬🥦🫛🥑🍅🌽🥕🧄🧅🥔🫜🍠🥐🥯🍞🥖🥨🧀🍳🧈🥞🧇🍟🍕🫓🥙🌮🧆🫔🫕🍝🍜🍣🥟🍙🍘🥮🍡🍧🥧🍭🍫🍩🍿🥛🍯🍪☕️🍵🧋🍷🧊🏀🎱🤿🏵️🎬🎤🎧🎼🎹🎨🎭🎸🎲♟️🧩⚓️🪝🛟🏰🗺️🗻🏝️📷📻🎚️🎛️⏳🕯️🪎🪤🩸🔬🔭⚗️⚔️🔑🪆🖼️🪭📜📰🖤🩶🤍🧡🩵💜🤎❣️⚜️💠🌀🔹🔸♠️♣️♥️♦️🏳️‍🌈🏴‍☠️🏁';
 var EMO=[];
 try{
  var seg=new Intl.Segmenter('en',{granularity:'grapheme'});
  var segit=seg.segment(RAW);
  for(var part of segit){if(part.segment.trim())EMO.push(part.segment);}
 }catch(e){EMO=RAW.split(/(?:)/u).filter(function(s){return s.trim();});}
 for(var i=EMO.length-1;i>0;i--){var j=Math.random()*(i+1)|0;var t0=EMO[i];EMO[i]=EMO[j];EMO[j]=t0;}
 var oi=0,lastX=null,lastY=null,acc=0,painting=false;
 /* the trail lives on ONE fixed canvas: one compositor layer, one tint filter,
    sprites drawn in a rAF loop. the old way (a DOM span + its own CSS filter
    per emoji) piled up 100+ filtered layers and stuttered on weaker machines. */
 var tcv=null,tcx=null,tcrumbs=[],trailRaf=0;
 function sizeTrailCv(){
  if(!tcv)return;
  var d=Math.min(2,window.devicePixelRatio||1);
  tcv.width=Math.round(innerWidth*d);tcv.height=Math.round(innerHeight*d);
  tcx=tcv.getContext('2d');
  tcx.setTransform(d,0,0,d,0,0);
  tcx.textAlign='center';tcx.textBaseline='middle';
 }
 function trailCanvas(){
  if(tcv)return;
  tcv=document.createElement('canvas');
  tcv.className='wtrailcv';
  tcv.setAttribute('aria-hidden','true');
  tcv.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:60;filter:'+TINT;
  document.body.appendChild(tcv);
  sizeTrailCv();
  window.addEventListener('resize',sizeTrailCv);
 }
 function drawTrail(){
  trailRaf=0;
  if(!tcx)return;
  var now=performance.now();
  tcx.clearRect(0,0,innerWidth,innerHeight);
  var live=[];
  for(var i=0;i<tcrumbs.length;i++){
   var c=tcrumbs[i],a=(now-c.t)/1000;
   if(a>=1)continue;
   live.push(c);
   var k=1-a;
   tcx.save();
   tcx.globalAlpha=.95*k;
   tcx.translate(c.x,c.y+c.dy*a);
   tcx.rotate(c.r*Math.PI/180*a);
   tcx.scale(.1+.9*k,.1+.9*k);
   tcx.font=c.s+'px serif';
   tcx.fillText(c.e,0,0);
   tcx.restore();
  }
  tcrumbs=live;
  if(tcrumbs.length)trailRaf=requestAnimationFrame(drawTrail);
 }
 function crumb(x,y){
  trailCanvas();
  tcrumbs.push({e:EMO[oi++%EMO.length],x:x,y:y,t:performance.now(),
   s:13+Math.random()*7,r:Math.random()*36-18,dy:6+Math.random()*10});
  if(tcrumbs.length>200)tcrumbs.splice(0,tcrumbs.length-200);
  if(!trailRaf)trailRaf=requestAnimationFrame(drawTrail);
 }
 window.__wTrailCount=function(){return tcrumbs.length;};
 window.__wTrailXs=function(){return tcrumbs.map(function(c){return Math.round(c.x);});};
 window.__wTrailClear=function(){tcrumbs=[];if(tcx)tcx.clearRect(0,0,innerWidth,innerHeight);};
 /* a real trail: crumbs are laid ALONG the travelled path, every ~15px, not
    one per mouse event. fast mouse events cover big jumps, so a single event
    may drop several crumbs; a cap keeps wild flicks from flooding the page. */
 document.addEventListener('pointermove',function(e){
  var px0=lastX,py0=lastY;
  var wasNull=(lastX===null);
  lastX=e.clientX;lastY=e.clientY;
  if(mode()!=='whimsy'||painting||!trailOn())return;
  if(wasNull){crumb(lastX,lastY);return;}
  acc+=Math.hypot(e.clientX-px0,e.clientY-py0);
  if(acc<15)return;
  var steps=Math.min(Math.floor(acc/15),7);
  if(tcrumbs.length>140)steps=1;
  for(var s=1;s<=steps;s++){
   var f=s/steps;
   crumb(px0+(e.clientX-px0)*f,py0+(e.clientY-py0)*f);
  }
  acc=0;
 },{passive:true});
 setInterval(function(){
  if(mode()!=='whimsy'||painting||lastX===null||!trailOn())return;
  crumb(lastX+(Math.random()*14-7),lastY+(Math.random()*14-7));
 },100);
 window.addEventListener('dv:mode',function(){
  if(mode()!=='whimsy'&&window.__wTrailClear)window.__wTrailClear();
  if(mode()==='whimsy'&&trailOn()&&lastX!==null){
   crumb(lastX,lastY);
   setTimeout(function(){if(mode()==='whimsy')crumb(lastX+8,lastY+6);},150);
  }
 });

 /* ---------- the desk, built on home only ---------- */
 var built=false,cache={},state={view:null,seq:0};
 var viewEl,backBtn,menuBtns=[],paperGo=null,deskEl;
 var cv,cx,tool='pencil',fgCol='#B72025',bgCol='#ffffff',sizeIdx=1,drawCol=null;
 var SIZES=[1,2,5,9];
 var undoStack=[],redoStack=[];
 var fgEl,bgEl;
 var COLORS=['#1D1615','#5f5a4e','#B72025','#E3554A','#FFBF00','#F4A300','#87AE73','#2E8B57','#1A2421','#9fc0ff','#32127A','#1F0954','#111b36','#F16C95',
  '#ffffff','#FFF9EE','#EBE8DE','#f7c8d4','#ffe9c9','#cde8c0','#dfe8ff','#c9b8f0','#8ea3c4','#e6a3a3','#f0d9a8','#b8d8c8','#d8d0f0','#f5b8cd'];
 var SECTIONS=[
  {name:'Marketing',href:'marketing.html',c:'rgba(183,32,37,.4)'},
  {name:'Design',href:'design.html',c:'rgba(46,139,87,.45)'},
  {name:'Blog',href:'blog.html',c:'rgba(241,108,149,.5)'},
  {name:'About',href:'about.html',c:'rgba(50,18,122,.4)'}];
 function el(tag,cls,parent){
  var d=document.createElement(tag);
  if(cls)d.className=cls;
  if(parent)parent.appendChild(d);
  return d;
 }
 function motifSvgs(){
  var seen={},out=[];
  document.querySelectorAll('.m svg').forEach(function(s){
   var k=s.innerHTML.replace(/\s+/g,'');
   if(seen[k])return;
   seen[k]=1;out.push(s);
  });
  return out;
 }

 /* ---------- canvas engine ---------- */
 var ghost=true,tipEl;
 function tipShow(txt){
  if(!tipEl)return;
  tipEl.textContent=txt;tipEl.style.display='block';
  clearTimeout(tipEl.__t);
  tipEl.__t=setTimeout(function(){tipEl.style.display='none';},1200);
 }
 function snapPixels(){return cx.getImageData(0,0,cv.width,cv.height);}
 function pushUndo(){
  /* raw pixels: a memory copy in a millisecond or two. PNG-encoding here used
     to stall the main thread at the START of every stroke. */
  try{
   undoStack.push(snapPixels());
   if(undoStack.length>6)undoStack.shift();
   redoStack.length=0;
  }catch(e){}
 }
 function restore(url,done){
  var img=new Image();
  img.onload=function(){
   cx.clearRect(0,0,cv.width,cv.height);
   /* contain-fit: a drawing from another screen shape arrives undistorted */
   var s=Math.min(cv.width/img.width,cv.height/img.height);
   var dw=img.width*s,dh=img.height*s;
   cx.drawImage(img,(cv.width-dw)/2,(cv.height-dh)/2,dw,dh);
   if(done)done();
  };
  img.src=url;
 }
 function undo(){
  if(!undoStack.length)return;
  redoStack.push(snapPixels());
  cx.putImageData(undoStack.pop(),0,0);
  saveDrawing();
 }
 function redo(){
  if(!redoStack.length)return;
  undoStack.push(snapPixels());
  cx.putImageData(redoStack.pop(),0,0);
  saveDrawing();
 }
 function clearAll(){
  pushUndo();
  cx.clearRect(0,0,cv.width,cv.height);
  ghost=false;
  saveDrawing();
 }
 var saveT=null,lastSaveAt=0;
 function doSave(){
  lastSaveAt=Date.now();
  try{
   cv.toBlob(function(b){
    if(!b)return;
    var fr=new FileReader();
    fr.onload=function(){try{localStorage.setItem('dvPaint',fr.result);}catch(e){}};
    fr.readAsDataURL(b);
   },'image/png');
  }catch(e){}
 }
 function doSaveSync(){
  try{localStorage.setItem('dvPaint',cv.toDataURL('image/png'));}catch(e){}
 }
 function saveDrawing(){
  /* throttled: encode at most once per 800ms, trailing save always lands */
  clearTimeout(saveT);saveT=null;
  var since=Date.now()-lastSaveAt;
  if(since>800)doSave();
  else saveT=setTimeout(function(){saveT=null;doSave();},820-since);
 }
 window.addEventListener('pagehide',function(){if(saveT){clearTimeout(saveT);saveT=null;doSaveSync();}});
 /* flatten for download/share: white paper underneath, stickers sitting on the
    drawing come along for the ride */
 function exportCanvas(cb){
  var out=document.createElement('canvas');
  out.width=cv.width;out.height=cv.height;
  var ox=out.getContext('2d');
  ox.fillStyle='#ffffff';ox.fillRect(0,0,out.width,out.height);
  ox.drawImage(cv,0,0);
  var cr=cv.getBoundingClientRect();
  var sx=cv.width/cr.width,sy=cv.height/cr.height;
  var jobs=[];
  document.querySelectorAll('.wplaced').forEach(function(g){
   var svg=g.querySelector('svg');
   if(!svg)return;
   var sr=svg.getBoundingClientRect();
   var cmx=(sr.left+sr.right)/2,cmy=(sr.top+sr.bottom)/2;
   if(cmx<cr.left||cmx>cr.right||cmy<cr.top||cmy>cr.bottom)return;
   var vb=svg.viewBox&&svg.viewBox.baseVal;
   var asp=(vb&&vb.height)?vb.width/vb.height:1;
   var hpx=38,wpx=38*asp;
   var cl=svg.cloneNode(true);
   cl.setAttribute('xmlns','http://www.w3.org/2000/svg');
   cl.setAttribute('width',Math.max(1,Math.round(wpx)));
   cl.setAttribute('height',Math.max(1,Math.round(hpx)));
   var str=new XMLSerializer().serializeToString(cl);
   var rot=parseFloat(g.dataset.r||'0');
   jobs.push(new Promise(function(res){
    var img=new Image();
    img.onload=function(){
     ox.save();
     ox.translate((cmx-cr.left)*sx,(cmy-cr.top)*sy);
     ox.scale(sx,sy);
     ox.rotate(rot*Math.PI/180);
     ox.drawImage(img,-wpx/2,-hpx/2);
     ox.restore();
     res();
    };
    img.onerror=function(){res();};
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(str);
   }));
  });
  Promise.all(jobs).then(function(){cb(out);});
 }
 window.__wExport=function(cb){exportCanvas(function(out){cb(out.toDataURL('image/png'));});};
 function ghostMotifs(){
  var kx=cv.width/1100,ky=cv.height/480;
  cx.save();
  cx.strokeStyle='rgba(50,18,122,.14)';cx.lineWidth=3;
  cx.beginPath();cx.arc(230*kx,160*ky,40*Math.min(kx,ky),0,7);cx.stroke();
  cx.beginPath();cx.moveTo(760*kx,330*ky);cx.quadraticCurveTo(830*kx,260*ky,900*kx,330*ky);cx.stroke();
  cx.font=Math.round(40*Math.min(kx,ky))+'px serif';cx.fillStyle='rgba(183,32,37,.12)';
  cx.fillText('❀',480*kx,220*ky);cx.fillText('✦',330*kx,390*ky);
  cx.restore();
 }
 function hexToRgb(h){
  h=h.replace('#','');
  return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];
 }
 function floodFill(x,y,hex){
  x=x|0;y=y|0;
  var w=cv.width,h=cv.height;
  var img=cx.getImageData(0,0,w,h),d=img.data;
  var idx=(y*w+x)*4;
  var tr=d[idx],tg=d[idx+1],tb=d[idx+2],ta=d[idx+3];
  var f=hexToRgb(hex),fr=f[0],fg2=f[1],fb=f[2];
  if(Math.abs(tr-fr)<8&&Math.abs(tg-fg2)<8&&Math.abs(tb-fb)<8&&ta===255)return;
  var TOL=48;
  var seen=new Uint8Array(w*h);
  function match(i){
   if(seen[i>>2])return false;
   return Math.abs(d[i]-tr)<=TOL&&Math.abs(d[i+1]-tg)<=TOL&&Math.abs(d[i+2]-tb)<=TOL&&Math.abs(d[i+3]-ta)<=TOL;
  }
  var stack=[[x,y]],guard=w*h;
  while(stack.length&&guard-->0){
   var p=stack.pop(),cxp=p[0],cyp=p[1];
   var i0=(cyp*w+cxp)*4;
   if(cxp<0||cyp<0||cxp>=w||cyp>=h||!match(i0))continue;
   var L=cxp,R=cxp;
   while(L>0&&match((cyp*w+L-1)*4))L--;
   while(R<w-1&&match((cyp*w+R+1)*4))R++;
   for(var xi=L;xi<=R;xi++){
    var ii=(cyp*w+xi)*4;
    seen[cyp*w+xi]=1;
    d[ii]=fr;d[ii+1]=fg2;d[ii+2]=fb;d[ii+3]=255;
    if(cyp>0&&match(((cyp-1)*w+xi)*4))stack.push([xi,cyp-1]);
    if(cyp<h-1&&match(((cyp+1)*w+xi)*4))stack.push([xi,cyp+1]);
   }
  }
  cx.putImageData(img,0,0);
 }
 function sprayAt(x,y){
  var r=SIZES[sizeIdx]*5+4;
  cx.fillStyle=drawCol||fgCol;
  for(var k=0;k<14;k++){
   var a=Math.random()*Math.PI*2,rr=Math.random()*r;
   cx.fillRect(x+Math.cos(a)*rr,y+Math.sin(a)*rr,1.4,1.4);
  }
 }
 function drawShape(a,b,shift){
  var x0=a[0],y0=a[1],x1=b[0],y1=b[1];
  if(shift){
   var side=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
   x1=x0+side*(x1<x0?-1:1);y1=y0+side*(y1<y0?-1:1);
  }
  cx.strokeStyle=drawCol||fgCol;cx.lineWidth=SIZES[sizeIdx];cx.lineCap='round';cx.lineJoin='round';
  cx.beginPath();
  if(tool==='line'){cx.moveTo(x0,y0);cx.lineTo(x1,y1);}
  else if(tool==='rect')cx.rect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0));
  else if(tool==='rounded'){
   var rx=Math.min(x0,x1),ry=Math.min(y0,y1),rw=Math.abs(x1-x0),rh=Math.abs(y1-y0);
   var rad=Math.min(18,rw/2,rh/2);
   if(cx.roundRect)cx.roundRect(rx,ry,rw,rh,rad);else cx.rect(rx,ry,rw,rh);
  }
  else if(tool==='ellipse')cx.ellipse((x0+x1)/2,(y0+y1)/2,Math.abs(x1-x0)/2,Math.abs(y1-y0)/2,0,0,7);
  cx.stroke();
 }
 function textAt(px,py,clientX,clientY){
  var holdEl=document.querySelector('.wcanvhold');
  var inp=document.createElement('input');
  inp.type='text';
  inp.className='wtextinp';
  var hr=holdEl.getBoundingClientRect();
  inp.style.left=(clientX-hr.left)+'px';
  inp.style.top=(clientY-hr.top-12)+'px';
  inp.style.color=fgCol;
  holdEl.appendChild(inp);
  setTimeout(function(){inp.focus();},30);
  function commit(){
   var v=inp.value.trim();
   inp.remove();
   if(!v)return;
   pushUndo();
   if(ghost){ghost=false;cx.clearRect(0,0,cv.width,cv.height);}
   cx.fillStyle=fgCol;
   cx.font=(14+SIZES[sizeIdx]*4)+'px Satisfy,Georgia,serif';
   cx.fillText(v,px,py);
   saveDrawing();
  }
  inp.addEventListener('keydown',function(ev){
   if(ev.key==='Enter')commit();
   if(ev.key==='Escape')inp.remove();
  });
  inp.addEventListener('blur',commit);
 }
 function initCanvas(){
  /* the canvas keeps the shape it is shown at, so nothing ever distorts */
  var box=cv.getBoundingClientRect();
  if(box.width>40&&box.height>40){
   cv.width=1100;
   cv.height=Math.max(320,Math.min(1600,Math.round(1100*box.height/box.width)));
  }
  cx=cv.getContext('2d',{willReadFrequently:true});
  var saved=null;
  try{saved=localStorage.getItem('dvPaint');}catch(e){}
  if(saved){ghost=false;restore(saved);}
  else ghostMotifs();
  var down=false,px,py,startPt=null,base=null;
  /* select tool state (selRect.path set = free-form lasso selection) */
  var selRect=null,selCv=null,selMove=null,selStart=null,marquee=false,selBase=null;
  var freePts=null,freeSnap=null;
  var selBox=document.createElement('div');
  selBox.className='wselbox';
  selBox.style.display='none';
  cv.parentNode.style.position='relative';
  cv.parentNode.appendChild(selBox);
  /* the eraser wears its own footprint */
  ringEl=document.createElement('div');
  ringEl.className='wering';
  cv.parentNode.appendChild(ringEl);
  function pathTo(ctx2,pts,dx,dy){
   ctx2.moveTo(pts[0][0]+dx,pts[0][1]+dy);
   for(var k=1;k<pts.length;k++)ctx2.lineTo(pts[k][0]+dx,pts[k][1]+dy);
   ctx2.closePath();
  }
  function inSel(p){
   return selRect&&p[0]>=selRect.x&&p[0]<=selRect.x+selRect.w&&p[1]>=selRect.y&&p[1]<=selRect.y+selRect.h;
  }
  cv.addEventListener('pointermove',function(e){
   if(tool==='eraser'){
    var cr=cv.getBoundingClientRect(),hr=cv.parentNode.getBoundingClientRect();
    var d=(SIZES[sizeIdx]*3+4)*(cr.width/cv.width);
    ringEl.style.width=d+'px';ringEl.style.height=d+'px';
    ringEl.style.left=(e.clientX-hr.left)+'px';ringEl.style.top=(e.clientY-hr.top)+'px';
    ringEl.style.display='block';
   }else ringEl.style.display='none';
   if(!down&&(tool==='select'||tool==='free'))cv.style.cursor=inSel(pt(e))?'move':'crosshair';
  });
  cv.addEventListener('pointerout',function(){ringEl.style.display='none';});
  /* polygon + curve state */
  var polyPts=[],polySnap=null;
  var curvePhase=0,curveA=null,curveB=null,curveC1=null,curveC2=null,curveSnap=null;
  function pt(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height];}
  function cssBox(r){
   var cr=cv.getBoundingClientRect(),hr=cv.parentNode.getBoundingClientRect();
   var sx=cr.width/cv.width,sy=cr.height/cv.height;
   return {l:(cr.left-hr.left)+r.x*sx,t:(cr.top-hr.top)+r.y*sy,w:r.w*sx,h:r.h*sy};
  }
  function showSel(){
   if(!selRect){selBox.style.display='none';return;}
   var b=cssBox(selRect);
   selBox.style.display='block';
   selBox.style.left=b.l+'px';selBox.style.top=b.t+'px';
   selBox.style.width=b.w+'px';selBox.style.height=b.h+'px';
  }
  function dropSel(){selRect=null;selCv=null;showSel();}
  function polyPreview(mx,my){
   cx.putImageData(polySnap,0,0);
   cx.strokeStyle=fgCol;cx.lineWidth=SIZES[sizeIdx];cx.lineCap='round';cx.lineJoin='round';
   cx.beginPath();
   cx.moveTo(polyPts[0][0],polyPts[0][1]);
   for(var k=1;k<polyPts.length;k++)cx.lineTo(polyPts[k][0],polyPts[k][1]);
   if(mx!=null)cx.lineTo(mx,my);
   cx.stroke();
  }
  function polyDone(close){
   if(polyPts.length>1){
    cx.putImageData(polySnap,0,0);
    cx.strokeStyle=fgCol;cx.lineWidth=SIZES[sizeIdx];cx.lineCap='round';cx.lineJoin='round';
    cx.beginPath();
    cx.moveTo(polyPts[0][0],polyPts[0][1]);
    for(var k=1;k<polyPts.length;k++)cx.lineTo(polyPts[k][0],polyPts[k][1]);
    if(close)cx.closePath();
    cx.stroke();
    saveDrawing();
   }
   polyPts=[];polySnap=null;
  }
  function curvePreview(){
   cx.putImageData(curveSnap,0,0);
   cx.strokeStyle=fgCol;cx.lineWidth=SIZES[sizeIdx];cx.lineCap='round';
   cx.beginPath();
   cx.moveTo(curveA[0],curveA[1]);
   var c1=curveC1||curveB,c2=curveC2||curveC1||curveB;
   cx.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],curveB[0],curveB[1]);
   cx.stroke();
  }
  function curveDone(){curvePhase=0;curveA=curveB=curveC1=curveC2=curveSnap=null;saveDrawing();}
  window.__wCancel=function(){
   if(polySnap){cx.putImageData(polySnap,0,0);polyPts=[];polySnap=null;}
   if(curveSnap&&curvePhase>0){cx.putImageData(curveSnap,0,0);curvePhase=0;curveA=curveB=curveC1=curveC2=curveSnap=null;}
   if(freeSnap&&freePts){cx.putImageData(freeSnap,0,0);}
   freePts=null;freeSnap=null;
   /* cancelled mid-move: stamp the lifted piece down where it is, lose nothing */
   if(selMove&&selCv&&selBase){
    cx.putImageData(selBase,0,0);
    cx.drawImage(selCv,selRect.x,selRect.y);
    saveDrawing();
   }
   selMove=null;selBase=null;down=false;painting=false;
   dropSel();
  };
  cv.addEventListener('contextmenu',function(e){e.preventDefault();});
  cv.addEventListener('pointerdown',function(e){
   e.preventDefault();
   var p=pt(e);
   var rbtn=(e.button===2);
   if(tool==='zoom')return;
   if(tool==='picker'){
    var d=cx.getImageData(p[0]|0,p[1]|0,1,1).data;
    if(d[3]>0){
     var hx='#'+[d[0],d[1],d[2]].map(function(v){return v.toString(16).padStart(2,'0');}).join('');
     if(rbtn){bgCol=hx;bgEl.style.background=hx;}
     else{fgCol=hx;fgEl.style.background=hx;}
    }
    return;
   }
   if(rbtn&&(tool==='select'||tool==='free'||tool==='poly'||tool==='curve'||tool==='text'))return;
   if(tool==='text'){textAt(p[0],p[1],e.clientX,e.clientY);return;}
   if(tool==='select'||tool==='free'){
    if(ghost){ghost=false;cx.clearRect(0,0,cv.width,cv.height);}
    if(inSel(p)){
     pushUndo();
     selCv=document.createElement('canvas');
     selCv.width=selRect.w;selCv.height=selRect.h;
     var sc=selCv.getContext('2d');
     if(selRect.rel){
      /* rel = lasso stored relative to the rect origin, so it travels with it */
      sc.save();sc.beginPath();pathTo(sc,selRect.rel,0,0);sc.clip();
      sc.drawImage(cv,-selRect.x,-selRect.y);sc.restore();
      cx.save();cx.beginPath();pathTo(cx,selRect.rel,selRect.x,selRect.y);cx.clip();
      cx.clearRect(selRect.x,selRect.y,selRect.w,selRect.h);cx.restore();
     }else{
      sc.putImageData(cx.getImageData(selRect.x,selRect.y,selRect.w,selRect.h),0,0);
      cx.clearRect(selRect.x,selRect.y,selRect.w,selRect.h);
     }
     selBase=cx.getImageData(0,0,cv.width,cv.height);
     selMove=[p[0]-selRect.x,p[1]-selRect.y];
     down=true;painting=true;
     return;
    }
    dropSel();
    if(tool==='select'){selStart=p;marquee=true;}
    else{freeSnap=cx.getImageData(0,0,cv.width,cv.height);freePts=[p];}
    down=true;painting=true;
    return;
   }
   if(tool==='poly'){
    if(ghost){ghost=false;cx.clearRect(0,0,cv.width,cv.height);}
    if(!polyPts.length){pushUndo();polySnap=cx.getImageData(0,0,cv.width,cv.height);polyPts.push(p);}
    else{
     var s=polyPts[0];
     if(polyPts.length>2&&Math.hypot(p[0]-s[0],p[1]-s[1])<12){polyDone(true);return;}
     polyPts.push(p);
     polyPreview(null);
    }
    return;
   }
   if(tool==='curve'){
    if(ghost){ghost=false;cx.clearRect(0,0,cv.width,cv.height);}
    if(curvePhase===0){pushUndo();curveSnap=cx.getImageData(0,0,cv.width,cv.height);curveA=p;curveB=p;}
    else if(curvePhase===1){curveC1=p;}
    else if(curvePhase===2){curveC2=p;}
    down=true;painting=true;
    return;
   }
   pushUndo();
   if(ghost){ghost=false;cx.clearRect(0,0,cv.width,cv.height);}
   down=true;painting=true;
   drawCol=rbtn?bgCol:fgCol;
   px=p[0];py=p[1];startPt=p;
   if(tool==='fill'){
    floodFill(p[0],p[1],drawCol);
    down=false;painting=false;
    saveDrawing();
    return;
   }
   if(tool==='line'||tool==='rect'||tool==='rounded'||tool==='ellipse'){
    base=cx.getImageData(0,0,cv.width,cv.height);
   }
   if(tool==='spray')sprayAt(p[0],p[1]);
  });
  cv.addEventListener('pointermove',function(e){
   if(!down)return;
   var p=pt(e);
   if(tool==='select'||tool==='free'){
    if(selMove){
     cx.putImageData(selBase,0,0);
     selRect.x=Math.round(p[0]-selMove[0]);selRect.y=Math.round(p[1]-selMove[1]);
     cx.drawImage(selCv,selRect.x,selRect.y);
     showSel();
     return;
    }
    if(marquee){
     selRect={x:Math.min(selStart[0],p[0])|0,y:Math.min(selStart[1],p[1])|0,
      w:Math.abs(p[0]-selStart[0])|0,h:Math.abs(p[1]-selStart[1])|0};
     showSel();
     return;
    }
    if(freePts){
     freePts.push(p);
     cx.putImageData(freeSnap,0,0);
     cx.save();
     cx.strokeStyle='#1D1615';cx.lineWidth=1;cx.setLineDash([5,4]);
     cx.beginPath();
     cx.moveTo(freePts[0][0],freePts[0][1]);
     for(var k=1;k<freePts.length;k++)cx.lineTo(freePts[k][0],freePts[k][1]);
     cx.stroke();
     cx.restore();
     return;
    }
    return;
   }
   if(tool==='curve'){
    if(curvePhase===0){curveB=p;curvePreview();}
    else if(curvePhase===1){curveC1=p;curvePreview();}
    else if(curvePhase===2){curveC2=p;curvePreview();}
    return;
   }
   if(base){
    cx.putImageData(base,0,0);
    drawShape(startPt,p,e.shiftKey);
    return;
   }
   if(tool==='spray'){sprayAt(p[0],p[1]);return;}
   cx.strokeStyle=tool==='eraser'?bgCol:(drawCol||fgCol);
   cx.lineWidth=tool==='eraser'?SIZES[sizeIdx]*3+4:(tool==='pencil'?1.6:SIZES[sizeIdx]);
   cx.lineCap='round';
   cx.beginPath();cx.moveTo(px,py);cx.lineTo(p[0],p[1]);cx.stroke();
   px=p[0];py=p[1];
  });
  cv.addEventListener('pointermove',function(e){
   if(down||tool!=='poly'||!polyPts.length)return;
   var p=pt(e);
   polyPreview(p[0],p[1]);
  });
  cv.addEventListener('dblclick',function(){
   if(tool==='poly'&&polyPts.length>1)polyDone(false);
  });
  function endStroke(){
   drawCol=null;
   if(!down)return;
   if(tool==='select'||tool==='free'){
    if(selMove){selMove=null;selBase=null;saveDrawing();}
    if(marquee){
     marquee=false;
     if(!selRect||selRect.w<4||selRect.h<4)dropSel();
    }
    if(freePts){
     cx.putImageData(freeSnap,0,0);
     if(freePts.length>2){
      var x0=cv.width,y0=cv.height,x1=0,y1=0;
      for(var k=0;k<freePts.length;k++){
       x0=Math.min(x0,freePts[k][0]);y0=Math.min(y0,freePts[k][1]);
       x1=Math.max(x1,freePts[k][0]);y1=Math.max(y1,freePts[k][1]);
      }
      x0=Math.max(0,x0|0);y0=Math.max(0,y0|0);
      x1=Math.min(cv.width,Math.ceil(x1));y1=Math.min(cv.height,Math.ceil(y1));
      if(x1-x0>=4&&y1-y0>=4){
       selRect={x:x0,y:y0,w:x1-x0,h:y1-y0,rel:freePts.map(function(q){return[q[0]-x0,q[1]-y0];})};
       showSel();
      }else dropSel();
     }else dropSel();
     freePts=null;freeSnap=null;
    }
    down=false;painting=false;
    return;
   }
   if(tool==='curve'){
    down=false;painting=false;
    if(curvePhase===0){
     if(Math.hypot(curveB[0]-curveA[0],curveB[1]-curveA[1])<4){curveDone();return;}
     curvePhase=1;
    }
    else if(curvePhase===1)curvePhase=2;
    else if(curvePhase===2)curveDone();
    return;
   }
   if(base)base=null;
   saveDrawing();
   down=false;painting=false;
  }
  window.addEventListener('pointerup',endStroke);
  window.addEventListener('pointercancel',endStroke);
  window.addEventListener('resize',function(){if(selRect)showSel();});
  document.addEventListener('keydown',function(e){
   if(mode()!=='whimsy')return;
   if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
   if(e.key==='Escape'){
    if(state.view){backToDrawing();return;}
    window.__wCancel();
   }
   if(state.view&&state.view.type==='paper'&&paperGo){
    if(e.key==='ArrowLeft'){e.preventDefault();paperGo(-1);return;}
    if(e.key==='ArrowRight'){e.preventDefault();paperGo(1);return;}
   }
   if((e.key==='Delete'||e.key==='Backspace')&&(tool==='select'||tool==='free')&&selRect&&!selMove){
    e.preventDefault();
    pushUndo();
    cx.save();
    cx.fillStyle=bgCol;
    if(selRect.rel){cx.beginPath();pathTo(cx,selRect.rel,selRect.x,selRect.y);cx.clip();}
    cx.fillRect(selRect.x,selRect.y,selRect.w,selRect.h);
    cx.restore();
    dropSel();
    saveDrawing();
   }
   if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}
   if((e.metaKey||e.ctrlKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();redo();}
  });
 }

 /* ---------- the magnifier: a lens over the whole page (tools area excluded
     so tools stay easy to click; on phones it lives inside the drawing only) ---------- */
 var lens,lensWrap,lensOn=false,LZ=2.2,LR=90;
 function lensBuild(){
  if(!lens){
   lens=el('div','wlens',document.body);
   lens.setAttribute('aria-hidden','true');
   lensWrap=el('div','wlenswrap',lens);
  }
  lensWrap.innerHTML='';
  lensWrap.style.width=document.documentElement.scrollWidth+'px';
  var c=document.body.cloneNode(true);
  c.querySelectorAll('script,.wlens,.wcrumb,.wtrailcv,.lightbox,.wtrailtog').forEach(function(x){x.remove();});
  c.style.margin='0';
  var st=document.createElement('style');
  st.textContent='*{animation:none!important;transition:none!important}';
  c.appendChild(st);
  lensWrap.appendChild(c);
  var oc=document.querySelectorAll('canvas'),nc=c.querySelectorAll('canvas');
  for(var i=0;i<oc.length&&i<nc.length;i++){
   try{nc[i].getContext('2d').drawImage(oc[i],0,0);}catch(e){}
  }
 }
 function lensMove(cxr,cyr){
  if(!lensOn||!lens)return;
  var show;
  if(window.matchMedia(MOBQ).matches){
   var r=cv?cv.getBoundingClientRect():null;
   show=r&&cxr>=r.left&&cxr<=r.right&&cyr>=r.top&&cyr<=r.bottom;
  }else{
   var t=document.querySelector('.wtools');
   var tr=t&&t.getBoundingClientRect();
   show=!(tr&&cxr>=tr.left-4&&cxr<=tr.right+4&&cyr>=tr.top-4&&cyr<=tr.bottom+4);
  }
  if(!show){lens.style.display='none';return;}
  lens.style.display='block';
  lens.style.left=(cxr-LR)+'px';lens.style.top=(cyr-LR)+'px';
  var px=cxr+(window.scrollX||0),py=cyr+(window.scrollY||0);
  lensWrap.style.transform='translate('+(LR-px*LZ)+'px,'+(LR-py*LZ)+'px) scale('+LZ+')';
 }
 function lensOff(){lensOn=false;if(lens)lens.style.display='none';}
 document.addEventListener('pointermove',function(e){lensMove(e.clientX,e.clientY);},{passive:true});
 document.addEventListener('pointerdown',function(e){lensMove(e.clientX,e.clientY);},{passive:true});
 document.addEventListener('click',function(){
  if(lensOn)setTimeout(function(){if(lensOn){lensBuild();if(lastX!==null)lensMove(lastX,lastY);}},250);
 });
 window.addEventListener('scroll',function(){if(lensOn&&lastX!==null)lensMove(lastX,lastY);},{passive:true});
 window.addEventListener('dv:mode',function(){
  if(mode()!=='whimsy')lensOff();
  else if(tool==='zoom'){lensOn=true;lensBuild();}
 });

 /* ---------- tools, sizes, palette, actions ---------- */
 var ringEl;
 var ICONS=[
  ['⬚','free-form select','free'],['▭','select','select'],
  ['🧽','eraser','eraser'],['🪣','fill with colour','fill'],
  ['💧','pick a colour','picker'],['🔍','magnifier','zoom'],
  ['✏️','pencil','pencil'],['🖌️','brush','brush'],
  ['💨','airbrush','spray'],['A','text','text'],
  ['╲','line','line'],['〜','curve','curve'],
  ['▭','rectangle','rect'],['⬠','polygon','poly'],
  ['◯','ellipse','ellipse'],['▢','rounded rectangle','rounded']];
 function initTools(box){
  var tname=el('span','wtoolname',box);
  ICONS.forEach(function(ic,i){
   var d=el('button','wtool'+(ic[2]==='pencil'?' sel':''),box);
   d.type='button';
   d.textContent=ic[0];
   d.setAttribute('aria-label',ic[1]);
   d.addEventListener('mouseenter',function(){
    tname.textContent=ic[1];
    if(window.matchMedia(MOBQ).matches)tname.style.top='';
    else tname.style.top=(d.offsetTop+3)+'px';
    tname.style.display='block';
   });
   d.addEventListener('mouseleave',function(){tname.style.display='none';});
   d.addEventListener('click',function(){
    if(window.__wCancel)window.__wCancel();
    tool=ic[2];
    if(tool==='zoom'){lensOn=true;lensBuild();}
    else lensOff();
    if(ringEl&&tool!=='eraser')ringEl.style.display='none';
    if(cv)cv.style.cursor=tool==='eraser'?'none':(tool==='zoom'?'zoom-in':'');
    box.querySelectorAll('.wtool').forEach(function(x){x.classList.remove('sel');});
    d.classList.add('sel');
   });
  });
  var sizes=el('div','wsizes',box.parentNode===null?box:box);
  box.appendChild(sizes);
  sizes.className='wsizes';
  SIZES.forEach(function(s,i){
   var b=el('button','wsizeopt'+(i===sizeIdx?' sel':''),sizes);
   b.type='button';
   b.setAttribute('aria-label','size '+s);
   b.title='size '+s;
   var bar=el('i',null,b);
   bar.style.height=Math.max(1,s)+'px';
   b.addEventListener('click',function(){
    sizeIdx=i;
    sizes.querySelectorAll('.wsizeopt').forEach(function(x){x.classList.remove('sel');});
    b.classList.add('sel');
   });
  });
 }

 function build(){
  if(built||!isHome())return;
  var desk=document.querySelector('.desk'),bw=document.querySelector('.bookwrap');
  if(!desk||!bw)return;
  built=true;
  document.body.classList.add('has-whimsy');
  var w=el('div','wdesk');
  deskEl=w;
  var paint=el('div','wpaint',w);
  /* the window chrome: sections live IN the program, like a menu row */
  var menu=el('div','wmenu',paint);
  menuBtns=[];
  SECTIONS.forEach(function(sec){
   var b=el('button','wmitem',menu);
   b.type='button';
   b.textContent=sec.name.toLowerCase();
   b.__name=sec.name;
   b.addEventListener('click',function(){openSection(sec.name);});
   menuBtns.push(b);
  });
  backBtn=el('button','wback',menu);
  backBtn.type='button';
  backBtn.textContent='back to my drawing';
  backBtn.style.display='none';
  backBtn.addEventListener('click',backToDrawing);
  var main=el('div','wmain',paint);
  var tools=el('div','wtools',main);
  var stage=el('div','wstage',main);
  var hold=el('div','wcanvhold',stage);
  cv=document.createElement('canvas');cv.width=1100;cv.height=480;
  hold.appendChild(cv);
  viewEl=el('div','wview',stage);
  var intro=el('div','wintro',main);
  var idw=el('div','wid',intro);
  var note=el('div','wnote',idw);
  var ph=document.querySelector('.photo img');
  if(ph){var im=document.createElement('img');im.src=ph.getAttribute('src');im.alt='Divyanshi Verma';note.appendChild(im);}
  var lead=document.querySelector('.sheet p.lead');
  var ip=el('p',null,idw);
  ip.textContent=lead?lead.textContent.trim():'Hello, I am Div.';
  buildIndex(intro);
  buildTray(intro);
  var bar=el('div','wbar',paint);
  var fgbg=el('span','wfgbg',bar);
  fgEl=el('i','fg',fgbg);fgEl.style.background=fgCol;
  bgEl=el('i','bg',fgbg);bgEl.style.background=bgCol;
  fgbg.title='paint colour over background colour. right-click a colour to set the background.';
  var chips=el('span','wchips',bar);
  COLORS.forEach(function(c){
   var d=el('button','wchip',chips);
   d.type='button';
   d.setAttribute('aria-label','paint colour '+c+' (right-click sets the background colour)');
   d.style.background=c;
   d.addEventListener('click',function(){fgCol=c;fgEl.style.background=c;});
   d.addEventListener('contextmenu',function(e){e.preventDefault();bgCol=c;bgEl.style.background=c;});
  });
  var acts=el('span','wacts',bar);
  function act(label,svg,fn){
   var b=el('button','wact',acts);
   b.type='button';b.setAttribute('aria-label',label);
   b.innerHTML=svg;
   b.addEventListener('click',fn);
   b.addEventListener('mouseenter',function(){tip.textContent=label;tip.style.display='block';});
   b.addEventListener('mouseleave',function(){tip.style.display='none';});
   return b;
  }
  var tip=el('span','wtip',acts);
  tipEl=tip;
  act('undo','<svg viewBox="0 0 24 24" fill="none" stroke="#1D1615" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5L3 10l5 5M3 10h11a6 6 0 016 6v1"/></svg>',undo);
  act('redo','<svg viewBox="0 0 24 24" fill="none" stroke="#1D1615" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 5l5 5-5 5M21 10H10a6 6 0 00-6 6v1"/></svg>',redo);
  var clr=act('erase everything','<svg viewBox="0 0 24 24" fill="none" stroke="#1D1615" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13h8l1-13"/></svg>',clearAll);
  clr.classList.add('wclear');
  act('download drawing','<svg viewBox="0 0 24 24" fill="none" stroke="#1D1615" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M4 20h16"/></svg>',function(){
   exportCanvas(function(out){
    var a=document.createElement('a');
    a.download='div-desk-drawing.png';
    a.href=out.toDataURL('image/png');
    a.click();
   });
  });
  act('share drawing','<svg viewBox="0 0 24 24" fill="none" stroke="#1D1615" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/></svg>',function(){
   exportCanvas(function(out){
    out.toBlob(function(b){
     var f=new File([b],'div-desk-drawing.png',{type:'image/png'});
     if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){
      navigator.share({files:[f],title:'my drawing on divyanshiverma.com'}).catch(function(){});
     }else{
      var a=document.createElement('a');
      a.download='div-desk-drawing.png';
      a.href=out.toDataURL('image/png');
      a.click();
     }
    });
   });
  });
  desk.insertBefore(w,bw);
  /* the trail can be hushed: little pill under the nav (Div's ask, Jul 7) */
  var tog=el('button','wtrailtog',document.body);
  tog.type='button';
  function togLabel(){tog.textContent=trailOn()?'trail: on':'trail: off';}
  togLabel();
  tog.addEventListener('click',function(){
   try{localStorage.setItem('dvTrail',trailOn()?'off':'on');}catch(e){}
   togLabel();
  });
  initTools(tools);
  initCanvas();
  restoreStickers(w);
  /* warm the shelves: section pages fetch in the idle moments after the desk
     builds, so opening one never waits on the network */
  setTimeout(function(){
   SECTIONS.forEach(function(sec){fetchDoc(sec.href);});
  },600);
 }

 /* ---------- sections + pane ---------- */
 function fetchDoc(href){
  if(cache[href])return Promise.resolve(cache[href]);
  return fetch(href).then(function(r){return r.text();}).then(function(t){
   var doc=new DOMParser().parseFromString(t,'text/html');
   cache[href]=doc;
   return doc;
  });
 }
 function sectionData(sec){
  return fetchDoc(sec.href).then(function(doc){
   var leads=[].slice.call(doc.querySelectorAll('.sheet p.lead')).map(function(p){return p.textContent.trim();});
   var items=[];
   doc.querySelectorAll('table.idx tbody tr').forEach(function(tr){
    var a=tr.querySelector('td a');
    if(a)items.push({t:a.textContent.replace(/\s*\(.*\)$/,'').trim(),href:a.getAttribute('href')});
   });
   return {leads:leads,items:items};
  });
 }
 function buildIndex(side){
  var ih=el('p','whand',side);
  ih.textContent='the index';
  var ix=el('div','windex',side);
  var counts={};
  document.querySelectorAll('table.idx tbody tr').forEach(function(tr){
   var a=tr.querySelector('td a');
   var sk=tr.querySelector('td.sk');
   if(a)counts[a.textContent.trim()]=sk?sk.textContent.trim():'';
  });
  SECTIONS.forEach(function(sec){
   var b=el('button','wix',ix);
   b.type='button';
   b.innerHTML='<b></b><small></small>';
   b.querySelector('b').textContent=sec.name;
   b.querySelector('small').textContent=counts[sec.name]||'';
   b.addEventListener('click',function(){openSection(sec.name);});
  });
 }
 function buildTray(side){
  var lbl=el('p','whand whandtray',side);
  lbl.textContent='stickers, drag them anywhere';
  var tray=el('div','wtray',side);
  motifSvgs().forEach(function(svg,idx){
   var s=el('span','wstick',tray);
   s.appendChild(svg.cloneNode(true));
   s.addEventListener('pointerdown',function(ev){startDrag(ev,svg,idx);});
  });
  var peel=el('button','wpeel',side);
  peel.type='button';
  peel.textContent='peel all stickers';
  peel.addEventListener('click',function(){
   document.querySelectorAll('.wplaced').forEach(function(x){x.remove();});
   try{localStorage.removeItem('dvStick');}catch(e){}
  });
 }
 /* ---------- the views: sections and pages open INSIDE the canvas frame ---------- */
 function updateChrome(){
  var v=state.view;
  if(backBtn)backBtn.style.display=v?'':'none';
  menuBtns.forEach(function(b){b.classList.toggle('on',!!v&&v.sec===b.__name);});
  if(deskEl)deskEl.classList.toggle('reading',!!v);
  if(cv)cv.parentNode.style.visibility=v?'hidden':'';
  if(viewEl)viewEl.style.display=v?'flex':'none';
 }
 function backToDrawing(){
  state.view=null;state.seq++;paperGo=null;
  if(viewEl)viewEl.innerHTML='';
  updateChrome();
 }
 window.__wBack=backToDrawing;
 function hashStr(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
 function openSection(name){
  if(name==='About'){openPaperPage('about.html','about','About');return;}
  var sec=SECTIONS.filter(function(s){return s.name===name;})[0];
  if(!sec)return;
  state.view={type:'section',sec:name};
  var seq=++state.seq;
  updateChrome();
  viewEl.innerHTML='<p class="whand wvload">walking to the '+name.toLowerCase()+' pages…</p>';
  sectionData(sec).then(function(d){
   if(state.seq!==seq)return;
   buildSectionView(sec,d);
  });
 }
 function buildSectionView(sec,d){
  viewEl.innerHTML='';
  var sv=el('div','wsecview',viewEl);
  var tx=el('div','wsectxt',sv);
  var h=el('h3',null,tx);
  h.textContent=sec.name;
  var hint=el('p','whand',tx);
  hint.textContent='each star is one page, open it';
  d.leads.forEach(function(txt){var pp=el('p',null,tx);pp.textContent=txt;});
  var cons=el('div','wcons',sv);
  var n=Math.max(1,d.items.length);
  var pts=d.items.map(function(it,i){
   var hsh=hashStr(it.t);
   var x=(i%2)?(50+(hsh%22)):(6+(hsh%22));
   var y=6+i*(78/Math.max(1,n-1));
   return {x:x,y:y};
  });
  var NS='http://www.w3.org/2000/svg';
  var lines=document.createElementNS(NS,'svg');
  lines.setAttribute('class','wconlines');
  lines.setAttribute('viewBox','0 0 100 100');
  lines.setAttribute('preserveAspectRatio','none');
  lines.setAttribute('aria-hidden','true');
  var dd='';
  pts.forEach(function(q,i){dd+=(i?'L':'M')+(q.x+4)+' '+(q.y+3)+' ';});
  var path=document.createElementNS(NS,'path');
  path.setAttribute('d',dd);
  lines.appendChild(path);
  cons.appendChild(lines);
  setTimeout(function(){d.items.forEach(function(it){fetchDoc(it.href);});},300);
  d.items.forEach(function(it,i){
   var b=el('button','wstar'+((i%2)?' flip':''),cons);
   b.type='button';
   b.style.left=pts[i].x+'%';
   b.style.top=pts[i].y+'%';
   b.innerHTML='<svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1 L11.8 8.2 L19 10 L11.8 11.8 L10 19 L8.2 11.8 L1 10 L8.2 8.2 Z" fill="#B72025"/></svg><span></span>';
   b.querySelector('span').textContent=it.t;
   b.addEventListener('click',function(){openProject(sec.name,it);});
  });
 }
 function openProject(secName,it){
  state.view={type:'paper',sec:secName,title:it.t};
  var seq=++state.seq;
  updateChrome();
  viewEl.innerHTML='<p class="whand wvload">opening '+it.t+'…</p>';
  fetchDoc(it.href).then(function(doc){
   if(state.seq!==seq)return;
   buildPaper(doc,secName.toLowerCase()+' · '+it.t,secName);
  });
 }
 function openPaperPage(href,label,secName){
  state.view={type:'paper',sec:secName,title:label};
  var seq=++state.seq;
  updateChrome();
  viewEl.innerHTML='<p class="whand wvload">opening the '+label+' page…</p>';
  fetchDoc(href).then(function(doc){
   if(state.seq!==seq)return;
   buildPaper(doc,label,secName);
  });
 }
 function buildPaper(doc,label,secName){
  viewEl.innerHTML='';
  var pv=el('div','wpaperview',viewEl);
  var hd=el('p','whand wviewhd',pv);
  hd.textContent=label;
  var paper=el('div','wpaper',pv);
  var inner=el('div','wpinner wcontent',paper);
  var sheet=doc.querySelector('.sheet');
  inner.innerHTML=sheet?sheet.innerHTML:'<p>nothing here yet</p>';
  inner.querySelectorAll('.endmotif,.colspacer,.pagenav,.takeaway,.zoombadge,.tape').forEach(function(x){x.remove();});
  var nav=el('div','wpnav',paper);
  var prev=el('button','wparr',nav);
  prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label','previous page');
  var lbl=el('span','wpglbl',nav);
  var next=el('button','wparr',nav);
  next.type='button';next.textContent='›';next.setAttribute('aria-label','next page');
  var pg=0,nP=1,vis=0;
  function measure(){
   vis=paper.clientWidth-parseFloat(getComputedStyle(paper).paddingLeft)-parseFloat(getComputedStyle(paper).paddingRight);
   inner.style.columnWidth=vis+'px';
   nP=Math.max(1,Math.round((inner.scrollWidth+32)/(vis+32)));
   if(pg>nP-1)pg=nP-1;
   place();
  }
  function place(){
   inner.style.transform='translateX('+(-pg*(vis+32))+'px)';
   lbl.textContent='page '+(pg+1)+' of '+nP;
   prev.disabled=pg<=0;
   next.disabled=pg>=nP-1;
  }
  function go(d2){
   var np=Math.max(0,Math.min(nP-1,pg+d2));
   if(np===pg)return;
   pg=np;place();
  }
  paperGo=go;
  prev.addEventListener('click',function(){go(-1);});
  next.addEventListener('click',function(){go(1);});
  inner.querySelectorAll('img').forEach(function(im){
   if(!im.complete)im.addEventListener('load',measure);
  });
  measure();
  setTimeout(measure,300);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){measure();});
 }

 /* ---------- stickers ---------- */
 function savePlaced(){
  var list=[];
  document.querySelectorAll('.wplaced').forEach(function(g){
   list.push({i:+g.dataset.i,x:parseFloat(g.style.left),y:parseFloat(g.style.top),r:+g.dataset.r});
  });
  try{localStorage.setItem('dvStick',JSON.stringify(list));}catch(e){}
 }
 function placeSticker(w,svg,idx,x,y,rot){
  var g=el('span','wplaced',w);
  g.dataset.i=idx;g.dataset.r=rot;
  g.title='click to peel';
  g.appendChild(svg.cloneNode(true));
  g.style.left=x+'px';g.style.top=y+'px';
  g.style.transform='rotate('+rot+'deg)';
  g.addEventListener('click',function(){g.remove();savePlaced();});
  return g;
 }
 function restoreStickers(w){
  var ms=motifSvgs(),list=[];
  try{list=JSON.parse(localStorage.getItem('dvStick')||'[]');}catch(e){}
  list.forEach(function(p){
   if(ms[p.i])placeSticker(w,ms[p.i],p.i,p.x,p.y,p.r);
  });
 }
 function startDrag(ev,svg,idx){
  ev.preventDefault();
  var w=document.querySelector('.wdesk');
  var wr=w.getBoundingClientRect();
  var rot=Math.random()*20-10;
  var g=placeSticker(w,svg,idx,0,0,rot);
  g.classList.add('dragging');
  function mv(e2){
   g.style.left=(e2.clientX-wr.left-18)+'px';
   g.style.top=(e2.clientY-wr.top-14)+'px';
  }
  mv(ev);
  window.addEventListener('pointermove',mv);
  window.addEventListener('pointerup',function up(){
   window.removeEventListener('pointermove',mv);
   window.removeEventListener('pointerup',up);
   g.classList.remove('dragging');
   savePlaced();
  },{once:true});
 }

 function init(){
  if(mode()==='whimsy')build();
 }
 window.addEventListener('dv:mode',function(){
  if(mode()==='whimsy')build();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
})();
