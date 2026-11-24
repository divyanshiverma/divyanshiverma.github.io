/* night.js — day/night toggle, the star field, and the constellation sky */
(function(){
 var KEY='dvMode';
 var root=document.documentElement;
 var SVGNS='http://www.w3.org/2000/svg';
 var reduced={matches:false}; /* Div's call: the sky moves for everyone */

 /* ---------- mode ---------- */
 function current(){return root.getAttribute('data-mode')||'day';}
 function setMode(m){
  try{localStorage.setItem(KEY,m);}catch(e){}
  var bn=decodeURIComponent(location.pathname).split('/').pop();
  if(bn&&bn.indexOf('.')<0)bn+='.html';
  var home=(bn===''||bn==='index.html');
  if(m==='whimsy'&&!home){
   location.href=(/\/(project|post)\//.test(location.pathname)?'../':'')+'index.html';
   return;
  }
  /* night is its own world: entering it from any page starts at its first
     page (the home sky); switching back to day walks you back to the page
     you left the daylight on (Div's brother's call, Jul 8) */
  if(m==='night'&&!home){
   try{sessionStorage.setItem('dvDayBack',location.pathname);}catch(e){}
   location.href=(/\/(project|post)\//.test(location.pathname)?'../':'')+'index.html';
   return;
  }
  if(m==='day'&&home){
   var back=null;
   try{back=sessionStorage.getItem('dvDayBack');sessionStorage.removeItem('dvDayBack');}catch(e){}
   if(back&&back!==location.pathname){location.href=back;return;}
  }
  if(window.matchMedia('(max-width:940px),(max-height:520px) and (pointer:coarse)').matches){location.reload();return;}
  if(m==='day')root.removeAttribute('data-mode');
  else root.setAttribute('data-mode',m);
  updateToggle();
  window.dispatchEvent(new Event('resize'));
  try{window.dispatchEvent(new Event('dv:mode'));}catch(e){}
 }
 function buildToggle(){
  var box=document.querySelector('.mode');
  if(!box)return;
  box.innerHTML='';
  ['day','night','whimsy'].forEach(function(m){
   var b=document.createElement('button');
   b.type='button';b.textContent=m;b.setAttribute('data-m',m);
   b.addEventListener('click',function(){setMode(m);});
   box.appendChild(b);
  });
  updateToggle();
 }
 function updateToggle(){
  var box=document.querySelector('.mode');
  if(!box)return;
  var cur=current();
  box.querySelectorAll('button').forEach(function(b){
   b.setAttribute('aria-pressed',b.getAttribute('data-m')===cur?'true':'false');
  });
 }

 /* ---------- helpers ---------- */
 function seeded(str){
  var h=2166136261;
  for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return function(){
   h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;
   return (h>>>0)/4294967296;
  };
 }
 function el(name,attrs,parent){
  var e=document.createElementNS(SVGNS,name);
  for(var k in attrs)e.setAttribute(k,attrs[k]);
  if(parent)parent.appendChild(e);
  return e;
 }
 function txt(t,attrs,parent){
  var e=el('text',attrs,parent);
  e.textContent=t;
  return e;
 }
 var TINTS=['#eef2ff','#eef2ff','#eef2ff','#eef2ff','#cfe0ff','#ffe9c9'];
 function bgStars(g,name,count,w,h){
  var r=seeded(name+'bg');
  for(var i=0;i<count;i++){
   var c=el('circle',{cx:(r()*w).toFixed(1),cy:(r()*h).toFixed(1),
    r:(0.4+r()*0.9).toFixed(2),fill:TINTS[(r()*TINTS.length)|0],'class':'tw'},g);
   c.style.animationDelay=(-r()*4.5).toFixed(2)+'s';
   c.style.animationDuration=(3.2+r()*3.4).toFixed(2)+'s';
   c.style.opacity=(0.35+r()*0.55).toFixed(2);
  }
 }
 /* irregular chain of n points around 0,0 — deterministic per name */
 function ringPoints(name,n,R){
  var r=seeded(name),pts=[],i;
  var a=r()*Math.PI*2;
  pts.push({x:0,y:0,parent:-1,r:r()});
  for(i=1;i<n;i++){
   var branch=(i>2&&r()<0.28)?Math.floor(r()*(i-1)):i-1;
   var base=pts[branch];
   if(branch!==i-1)a=r()*Math.PI*2;
   a+=(r()-.5)*1.7;
   var d=R*(.38+r()*.42);
   pts.push({x:base.x+Math.cos(a)*d,y:base.y+Math.sin(a)*d,parent:branch,r:r()});
  }
  var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  pts.forEach(function(p){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);});
  var mx=(minX+maxX)/2,my=(minY+maxY)/2,m=0;
  pts.forEach(function(p){p.x-=mx;p.y-=my;m=Math.max(m,Math.hypot(p.x,p.y));});
  var s=R/(m||1);
  pts.forEach(function(p){p.x*=s;p.y*=s;p.a=Math.atan2(p.y,p.x);});
  return pts;
 }
 /* Div's call (Jul 8): section stars read in index order, top to bottom, in
    every mode. still a night walk, not a list: x wanders with the seeded rng
    and the thread only ever descends, so the first piece is the highest star. */
 function orderedPoints(name,n,rx,ry){
  var r=seeded(name),pts=[],i;
  var step=n>1?(2*ry)/(n-1):0;
  var side=r()<.5?1:-1;
  for(i=0;i<n;i++){
   var wob=n>1?(r()-.5)*step*.5:0;
   var y=(n>1?-ry+i*step:0)+wob;
   side=-side;
   var x=side*(rx*.28+r()*rx*.62);
   pts.push({x:x,y:y,parent:i-1,r:r()});
  }
  return pts;
 }
 function chainLine(parent,pts,cx,cy){
  var g=el('g',null,parent);
  pts.forEach(function(p){
   if(p.parent<0)return;
   var q=pts[p.parent];
   el('line',{x1:(cx+q.x).toFixed(1),y1:(cy+q.y).toFixed(1),x2:(cx+p.x).toFixed(1),y2:(cy+p.y).toFixed(1),
    'class':'cline','stroke-width':'1','stroke-dasharray':'1',pathLength:'1'},g);
  });
  return g;
 }
 function starDot(parent,x,y,r,glint){
  var g=el('g',null,parent);
  el('circle',{cx:x,cy:y,r:r,'class':'star'},g);
  if(glint){
   el('path',{d:'M '+(x-r-4)+' '+y+' H '+(+x+ +r+4)+' M '+x+' '+(y-r-4)+' V '+(+y+ +r+4),
    'class':'glint','stroke-width':'.7'},g);
  }
  return g;
 }
 function shortTitle(t){
  var i=t.indexOf(' (');
  return (i>0?t.slice(0,i):t).trim();
 }
 var WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
 function numWord(n){return n>=0&&n<WORDS.length?WORDS[n]:String(n);}

 /* ---------- the fixed star field, on every page ---------- */
 function buildFx(){
  if(document.querySelector('.nightfx'))return;
  var fx=document.createElement('div');
  fx.className='nightfx';
  fx.setAttribute('aria-hidden','true');
  var far=el('svg',{viewBox:'0 0 1600 900',preserveAspectRatio:'xMidYMid slice','class':'far'});
  var near=el('svg',{viewBox:'0 0 1600 900',preserveAspectRatio:'xMidYMid slice','class':'near'});
  bgStars(el('g',null,far),'fxfar'+location.pathname,120,1600,900);
  var ng=el('g',null,near);
  bgStars(ng,'fxnear'+location.pathname,46,1600,900);
  /* a handful of brighter ones on the near layer */
  var r=seeded('bright'+location.pathname);
  for(var i=0;i<7;i++){
   var c=el('circle',{cx:(r()*1600).toFixed(1),cy:(r()*640).toFixed(1),
    r:(1.5+r()*1.1).toFixed(2),fill:'#fff','class':'tw'},ng);
   c.style.filter='drop-shadow(0 0 4px rgba(230,240,255,.85))';
   c.style.animationDelay=(-r()*4).toFixed(2)+'s';
   c.style.animationDuration=(3.6+r()*2.4).toFixed(2)+'s';
  }
  fx.appendChild(far);fx.appendChild(near);
  var neb=document.createElement('div');neb.className='neb';fx.appendChild(neb);
  ['s1','s2'].forEach(function(cl){
   var s=document.createElement('div');s.className='shoot '+cl;fx.appendChild(s);
  });
  document.body.appendChild(fx);
  parallax(far,near);
 }
 function parallax(far,near){
  if(reduced.matches)return;
  if(window.matchMedia('(hover: none)').matches&&!('onscroll' in window))return;
  var mx=0,my=0,tx=0,ty=0,sy=0,raf=null;
  function apply(){
   raf=null;
   tx+= (mx-tx)*.06; ty+=(my-ty)*.06;
   var s=window.scrollY||0;
   sy+=(s-sy)*.12;
   far.style.transform='translate3d('+(tx*-7)+'px,'+(ty*-4-sy*.02)+'px,0)';
   near.style.transform='translate3d('+(tx*-16)+'px,'+(ty*-10-sy*.045)+'px,0)';
   if(Math.abs(mx-tx)>.002||Math.abs(my-ty)>.002||Math.abs((window.scrollY||0)-sy)>.5)queue();
  }
  function queue(){if(!raf)raf=requestAnimationFrame(apply);}
  window.addEventListener('mousemove',function(e){
   mx=e.clientX/window.innerWidth-.5;
   my=e.clientY/window.innerHeight-.5;
   queue();
  },{passive:true});
  window.addEventListener('scroll',queue,{passive:true});
 }

 /* zooming between the whole sky and a constellation */
 function zoomLeave(el,href,mode){
  var sky=document.querySelector('.sky');
  if(!sky){location.href=href;return;}
  if(mode==='in'&&el){
   var r=el.getBoundingClientRect(),sr=sky.getBoundingClientRect();
   sky.style.transformOrigin=(((r.left+r.width/2-sr.left)/sr.width)*100).toFixed(1)+'% '+
    (((r.top+r.height/2-sr.top)/sr.height)*100).toFixed(1)+'%';
  }
  sky.classList.add(mode==='in'?'zoom-in-leave':'zoom-out-leave');
  try{sessionStorage.setItem('nightZoom',mode);}catch(e){}
  setTimeout(function(){location.href=href;},450);
 }

 /* real constellation figures, baked by tools/build_sky_figures.py */
 /*SKYFIG*/var SKYFIG={"Eri":{"w":0.8749,"h":1.0,"lines":[[[-0.4375,-0.4661],[-0.3444,-0.5],[-0.3062,-0.4982],[-0.2044,-0.4336],[-0.1468,-0.3101],[-0.0973,-0.3361],[-0.0852,-0.3794],[-0.0423,-0.3851],[0.1097,-0.3955],[0.161,-0.3036],[0.1569,-0.2162],[0.0849,-0.1227],[0.0136,-0.1572],[-0.0458,-0.1596],[-0.1002,-0.1296],[-0.303,0.0059],[-0.255,0.0699],[-0.2295,0.0658],[-0.1111,0.1103],[-0.0596,0.1858],[0.0119,0.2376],[0.1021,0.1863],[0.1754,0.178],[0.2323,0.3234],[0.2759,0.394],[0.3615,0.3957],[0.4375,0.5]]]},"Ori":{"w":0.681,"h":1.0,"lines":[[[-0.3043,-0.3161],[-0.1949,-0.5],[-0.274,-0.4954],[-0.3405,-0.2974],[-0.2612,-0.1451],[-0.2014,-0.0703],[0.0478,-0.0349],[0.2986,-0.1619]],[[0.2683,0.1199],[0.3039,0.0956],[0.3292,-0.0101],[0.3405,-0.0554],[0.3341,-0.1201],[0.2986,-0.1619],[0.2863,-0.2742],[0.2183,-0.3373],[0.1758,-0.3438]],[[0.1356,0.451],[0.0532,0.2571],[-0.0093,0.1871],[0.0478,-0.0349],[-0.0352,-0.1546],[-0.2014,-0.0703],[-0.0819,0.242],[-0.1399,0.5]],[[-0.0819,0.242],[-0.0442,0.2172],[-0.0093,0.1871]]]},"Cap":{"w":1.0,"h":0.6784,"lines":[[[0.5,-0.3392],[0.4624,-0.2322],[0.3746,-0.0894],[0.1818,0.2616],[0.1177,0.3392],[-0.2721,0.127],[-0.5,-0.1688],[-0.4223,-0.1436],[-0.2226,-0.1355],[-0.0403,-0.1168],[0.5,-0.3392]]]},"Lib":{"w":0.5528,"h":1.0,"lines":[[[0.1238,0.2796],[0.2764,-0.1735],[-0.0259,-0.5],[-0.2402,-0.2349],[-0.2575,0.4195],[-0.2764,0.5]],[[0.2764,-0.1735],[-0.2402,-0.2349]]]},"UMa":{"w":1.0,"h":0.6392,"lines":[[[-0.2097,-0.1974],[0.0163,-0.293],[0.0223,-0.1842],[-0.1416,-0.1297],[-0.2097,-0.1974],[-0.3313,-0.1756],[-0.4256,-0.1547],[-0.5,-0.0409]],[[-0.1416,-0.1297],[-0.1171,-0.0098],[-0.0302,0.2879],[-0.0293,0.3196]],[[-0.1171,-0.0098],[-0.0024,0.0567],[0.1468,0.1175]],[[-0.0024,0.0567],[0.1633,0.0888]],[[0.0163,-0.293],[0.3069,-0.3196],[0.5,-0.2721],[0.2456,-0.2381],[0.0223,-0.1842]],[[0.0223,-0.1842],[0.242,-0.1372],[0.3027,-0.0888],[0.4088,-0.0151]],[[0.3949,0.0028],[0.3027,-0.0888]]]},"Cet":{"w":1.0,"h":0.6909,"lines":[[[-0.3835,-0.1763],[-0.3379,-0.2343],[-0.2905,-0.3048],[-0.3935,-0.3455],[-0.4843,-0.3158],[-0.5,-0.1973],[-0.3835,-0.1763],[-0.36,-0.1049],[-0.2364,-0.0236],[-0.0651,0.1573],[-0.0197,0.2951],[0.3516,0.3455],[0.5,0.1202],[0.1981,0.1536],[0.1033,0.1044],[-0.0651,0.1573]]]},"Hya":{"w":1.0,"h":0.4385,"lines":[[[0.4755,-0.2192],[0.4711,-0.2129],[0.4851,-0.1864],[0.497,-0.1858],[0.5,-0.2115],[0.4755,-0.2192],[0.4524,-0.2141],[0.4015,-0.1746],[0.3331,-0.137],[0.366,-0.0553],[0.3019,0.012],[0.2506,-0.0151],[0.209,0.0336],[0.1458,0.0266],[0.0294,0.1969],[-0.024,0.2192],[-0.2548,0.1025],[-0.3821,0.1407],[-0.5,0.1546]]]}};/*ENDSKYFIG*/
 /* ---------- home sky ---------- */
 function readHome(){
  var scope=document.querySelector('.spread .sheet')||document;
  var secs=[];
  scope.querySelectorAll('table.idx tbody tr').forEach(function(tr){
   var a=tr.querySelector('td a');if(!a)return;
   var href=a.getAttribute('href')||'';
   var sk=tr.querySelector('td.sk');
   var count=sk?parseInt(sk.textContent,10):NaN;
   secs.push({name:a.textContent.trim(),href:href,count:isNaN(count)?4:count,
    sub:sk?sk.textContent.trim():''});
  });
  if(!secs.length)secs=[
   {name:'Marketing',href:'marketing.html',count:6,sub:'6 projects'},
   {name:'Design',href:'design.html',count:9,sub:'9 projects'},
   {name:'Blog',href:'blog.html',count:13,sub:'13 posts'},
   {name:'About',href:'about.html',count:4,sub:'bio · contact'}];
  var h1=scope.querySelector('h1.big');
  var ph=scope.querySelector('.photo');
  var img=ph?ph.querySelector('img'):null;
  var phText=ph&&ph.querySelector('.ph')?ph.querySelector('.ph').textContent.trim():'a good photo of me goes here';
  var leads=[].slice.call(scope.querySelectorAll('p.lead')).map(function(p){return p.textContent.trim();});
  return {sections:secs,
   name:h1?h1.textContent.trim():'Divyanshi Verma',
   imgSrc:img?img.getAttribute('src'):null,phText:phText,
   leads:leads.map(function(t){return t.replace('Pick a tab, or use the index.','Pick a constellation.').replace('Pick a tab or use the index.','Pick a constellation.');})};
 }
 function photoFrame(data,cls){
  var f=document.createElement('div');
  f.className='sky-photo'+(cls?' '+cls:'');
  if(data.imgSrc){
   var im=document.createElement('img');
   im.src=data.imgSrc;im.alt='';
   f.appendChild(im);
  }else{
   var d=document.createElement('div');
   d.className='ph';d.textContent=data.phText;
   f.appendChild(d);
  }
  return f;
 }
 function buildHomeSky(sky){
  var data=readHome(),W=1200,H=560;
  sky.classList.add('home-sky');
  sky.setAttribute('data-screen-label','Night sky home');
  /* the intro first, centred on the sky */
  var intro=document.createElement('div');
  intro.className='sky-intro';
  intro.appendChild(photoFrame(data));
  var t=document.createElement('div');
  t.className='txt';
  var h=document.createElement('h1');
  h.textContent=data.name;
  t.appendChild(h);
  data.leads.forEach(function(s){
   var p=document.createElement('p');
   p.textContent=s;
   t.appendChild(p);
  });
  intro.appendChild(t);
  sky.appendChild(intro);
  /* Home · Works · About (Div, Nov 21 2026): ONE constellation of chapters, and About
     as a lone star in the open sky beside the intro. The chapters ride along in the
     home page as #dv-works (written by build_launch.py). */
  var worksData=null;
  try{var wj=document.getElementById('dv-works');if(wj)worksData=JSON.parse(wj.textContent);}catch(e){}
  if(worksData&&worksData.length){
   var aboutSec=data.sections.filter(function(s){return /about/i.test(s.name);})[0];
   aboutStar(intro,aboutSec?aboutSec.href:'about.html');
   bgFigures();
   worksSky(sky,worksData);
   buildHomeList(sky,data);
   return;
  }
  /* then the constellations, spread across the same sky */
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,'class':'chart',role:'img',
   'aria-label':'The night sky. Each constellation is a section of the site.'});
  bgStars(el('g',null,svg),'homesky',60,W,H);
  /* three constellations since the blog left (Nov 2026); the four-section layout stays for the master tree */
  var hasBlog=data.sections.some(function(s){return s.name==='Blog';});
  var spots=hasBlog?{Marketing:[170,300],Design:[475,190],Blog:[820,330],About:[1080,190]}
   :{Marketing:[220,320],Design:[620,250],About:[1010,300]};
  var fall=[[170,300],[475,190],[820,330],[1080,190]];
  data.sections.forEach(function(s,i){
   var c=spots[s.name]||fall[i%4];
   var R=Math.min(140,52+s.count*7);
   var pts=ringPoints(s.name,s.count,R);
   var a=el('a',{href:s.href},svg);
   a.setAttribute('aria-label',s.name+', '+s.sub+', open this section');
   if(!reduced.matches){
    a.addEventListener('click',function(e){
     if(current()!=='night')return;
     e.preventDefault();
     zoomLeave(a,s.href,'in');
    });
   }
   /* generous invisible hit area: hovering anywhere over the constellation is the link */
   el('circle',{cx:c[0],cy:c[1],r:(R+42).toFixed(0),fill:'none','pointer-events':'all'},a);
   chainLine(a,pts,c[0],c[1]);
   pts.forEach(function(p,j){starDot(a,(c[0]+p.x).toFixed(1),(c[1]+p.y).toFixed(1),j===0?3.2:1.8+p.r*1.2,j===0);});
   txt(s.name,{x:c[0],y:c[1]+R+34,'class':'cname','font-size':'21','text-anchor':'middle'},a);
  });
  sky.appendChild(svg);
  buildHomeList(sky,data);
 }
 function aboutStar(intro,href){
  var a=document.createElement('a');
  a.className='sky-aboutstar';a.href=href;
  a.setAttribute('aria-label','About me');
  a.innerHTML='<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">'+
   '<circle cx="23" cy="23" r="3.6" class="star"/>'+
   '<path d="M23 9 V37 M9 23 H37" class="glint" stroke-width=".8"/>'+
   '<path d="M15 15 L31 31 M31 15 L15 31" class="glint" stroke-width=".5" opacity=".55"/></svg>'+
   '<span>About</span>';
  if(!reduced.matches){
   a.addEventListener('click',function(e){
    if(current()!=='night')return;
    e.preventDefault();
    zoomLeave(a,href,'in');
   });
  }
  intro.appendChild(a);
  /* level with the name (Div, Nov 22): the star's centre sits on the h1's middle */
  function level(){
   var h=intro.querySelector('h1');
   if(!h||!a.isConnected)return;
   a.style.top=(h.offsetTop+h.offsetHeight/2-23)+'px';
  }
  requestAnimationFrame(level);
  window.addEventListener('resize',level);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(level);
 }
 /* Eridanus helpers: the real river, turned, fitted into a box, chapters spaced
    evenly along its length (shared by the home sky, the Works page and phones) */
 function eriFit(ang,W,H,LBL,TOP,BOT){
  var path=SKYFIG.Eri.lines[0],ca=Math.cos(ang),sa=Math.sin(ang);
  var R=path.map(function(q){return {x:q[0]*ca-q[1]*sa,y:q[0]*sa+q[1]*ca};});
  var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  R.forEach(function(q){x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);});
  var S=Math.min((W-2*LBL)/(x1-x0),(H-TOP-BOT)/(y1-y0));
  var oy=TOP+((H-TOP-BOT)-(y1-y0)*S)/2;
  return R.map(function(q){return {x:W/2+(q.x-(x0+x1)/2)*S,y:oy+(q.y-y0)*S};});
 }
 function eriPick(P,n){
  /* which of the river's stars carry chapters: in order along the river, choosing the
     set whose two closest consecutive chapters are as far apart as possible, so close
     star pairs never both carry one (easy to click at any chapter count). Ties go to
     the more even spacing along the river's length. */
  var m=P.length,pick={},k,i,j;
  if(n>=m){for(k=0;k<m;k++)pick[k]=k;return pick;}
  if(n<=1){pick[0]=0;return pick;}
  function d(a,b){return Math.hypot(P[a].x-P[b].x,P[a].y-P[b].y);}
  /* best[c][j]: best minimum gap using c+1 chapters ending at star j; sum = total gap (tie-break) */
  var best=[],sum=[],from=[];
  for(k=0;k<n;k++){best.push([]);sum.push([]);from.push([]);}
  for(j=0;j<m;j++){best[0][j]=Infinity;sum[0][j]=0;from[0][j]=-1;}
  for(k=1;k<n;k++)for(j=k;j<m;j++){
   best[k][j]=-1;sum[k][j]=0;from[k][j]=-1;
   for(i=k-1;i<j;i++){
    if(best[k-1][i]<0)continue;
    var v=Math.min(best[k-1][i],d(i,j)),s=sum[k-1][i]+Math.min(d(i,j),60);
    if(v>best[k][j]+1e-9||(Math.abs(v-best[k][j])<1e-9&&s>sum[k][j])){best[k][j]=v;sum[k][j]=s;from[k][j]=i;}
   }
  }
  var end=m-1;
  for(j=n-1;j<m;j++)if(best[n-1][j]>best[n-1][end]+1e-9)end=j;
  for(k=n-1,j=end;k>=0;k--){pick[j]=k;j=from[k][j];}
  return pick;
 }
 function riverLine(svg,P){
  var g=el('g',null,svg);
  for(var k=1;k<P.length;k++)el('line',{x1:P[k-1].x.toFixed(1),y1:P[k-1].y.toFixed(1),x2:P[k].x.toFixed(1),y2:P[k].y.toFixed(1),
   'class':'cline','stroke-width':'1'},g);
 }
 var ERI_TURN=-26*Math.PI/180;
 /* the turn that stands the river on end: its first-to-last star axis becomes vertical */
 function eriUpright(){
  var path=SKYFIG.Eri.lines[0],a=path[0],b=path[path.length-1];
  return Math.PI/2-Math.atan2(b[1]-a[1],b[0]-a[0]);
 }
 /* the Works constellation is ERIDANUS, the river (Div, Nov 22 2026): its real 27-star
    line, chapters on evenly spaced stars along it in index order from the north end,
    the in-between stars kept small so the figure stays whole */
 function worksSky(sky,items){
  var n=items.length,W=1200,H=560,cx=W/2;
  var P=eriFit(ERI_TURN,W,H,190,22,58),pick=eriPick(P,n);
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,'class':'chart works-chart',role:'img',
   'aria-label':'Works, drawn as the constellation Eridanus: one star per chapter'});
  bgStars(el('g',null,svg),'homesky',60,W,H);
  riverLine(svg,P);
  var labels=[];
  P.forEach(function(p,j){
   if(!(j in pick)){el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:'1.3','class':'star dimstar'},svg);return;}
   var it=items[pick[j]],i=pick[j];
   var a=el('a',{href:it.href},svg);
   a.setAttribute('aria-label',it.t+(it.pages?', '+it.pages+' pages':''));
   if(!reduced.matches){
    a.addEventListener('click',function(e){
     if(current()!=='night')return;
     e.preventDefault();
     zoomLeave(null,it.href,'in');
    });
   }
   el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:'20',fill:'none','pointer-events':'all'},a);
   starDot(a,p.x.toFixed(1),p.y.toFixed(1),i===0?3.6:2.6,i===0);
   var nm=it.t.length>26?it.t.slice(0,24)+'…':it.t;
   var right=p.x>=cx;
   var tl=el('text',{x:(p.x+(right?14:-14)).toFixed(1),y:(p.y+4.5).toFixed(1),'class':'starlabel','text-anchor':right?'start':'end'},a);
   tl.textContent=nm;
   labels.push({t:tl,sx:p.x,sy:p.y,by:p.y+4.5,right:right});
  });
  var wl=el('a',{href:'works.html'},svg);
  wl.setAttribute('aria-label','Works, the whole index');
  txt('Works',{x:cx,y:H-14,'class':'cname','font-size':'21','text-anchor':'middle'},wl);
  sky.appendChild(svg);
  pendingLabels={list:labels,w:W,h:H,dots:P};
  requestAnimationFrame(untangleLabels);
 }
 /* Orion, Capricornus, Libra, Ursa Major, Cetus and Hydra: far back, dim, never
    joined to each other or to the river (Div, Nov 22 2026) */
 /* [id, side, inset % from that side, top %, width px] in a full-screen layer, so
    they use the screen's edges, not the centred sky box (Div, Nov 22) */
 var BGFIGS=[['Cap','left',2,9,170],['Ori','left',5,36,190],['Hya','left',1.5,76,300],
  ['UMa','right',3,30,240],['Lib','right',13,55,110],['Cet','right',2,72,220]];
 function bgFigures(){
  if(document.querySelector('.bgfigs'))return;
  var layer=document.createElement('div');
  layer.className='bgfigs';layer.setAttribute('aria-hidden','true');
  BGFIGS.forEach(function(f){
   var F=SKYFIG[f[0]];if(!F)return;
   var w=f[4],h=Math.round(w*F.h/F.w),pad=6;
   var s=el('svg',{viewBox:(-w/2-pad)+' '+(-h/2-pad)+' '+(w+2*pad)+' '+(h+2*pad),'class':'bgfig'},layer);
   s.style[f[1]]=f[2]+'%';s.style.top=f[3]+'%';s.style.width=(w+2*pad)+'px';
   var sc=w/F.w,seen={};
   F.lines.forEach(function(ln){
    for(var i=1;i<ln.length;i++)el('line',{x1:(ln[i-1][0]*sc).toFixed(1),y1:(ln[i-1][1]*sc).toFixed(1),
     x2:(ln[i][0]*sc).toFixed(1),y2:(ln[i][1]*sc).toFixed(1),'class':'bgline'},s);
    ln.forEach(function(q){
     var key=q[0]+','+q[1];if(seen[key])return;seen[key]=1;
     el('circle',{cx:(q[0]*sc).toFixed(1),cy:(q[1]*sc).toFixed(1),r:'1.4','class':'bgstar'},s);
    });
   });
  });
  document.body.appendChild(layer);
 }
 function buildHomeList(sky,data){
  var list=document.createElement('div');
  list.className='sky-list';
  var hasWorks=typeof SKYFIG!=='undefined'&&data.sections.some(function(s){return /^works$/i.test(s.name);});
  if(hasWorks){
   /* phones (Div, Nov 22): About is ONE star right under the intro, then Works as the
      river, bigger and further down */
   list.classList.add('sky-list-works');
   var secs=data.sections.slice().sort(function(x,y){return (/about/i.test(y.name)?1:0)-(/about/i.test(x.name)?1:0);});
   secs.forEach(function(s){
    var isW=/^works$/i.test(s.name);
    var it=listItem(s.href,s.name,s.sub,isW?eriGlyph():
     '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="3.6" class="star"/>'+
     '<path d="M23 9 V37 M9 23 H37" class="glint" stroke-width=".8"/><path d="M15 15 L31 31 M31 15 L15 31" class="glint" stroke-width=".5" opacity=".55"/></svg>');
    it.classList.add(isW?'works-item':'about-item');
    list.appendChild(it);
   });
   sky.appendChild(list);
   return;
  }
  data.sections.forEach(function(s){
   list.appendChild(listItem(s.href,s.name,s.sub,miniConst(s.name,s.count)));
  });
  sky.appendChild(list);
 }
 function eriGlyph(){
  var path=SKYFIG.Eri.lines[0],ang=-26*Math.PI/180,ca=Math.cos(ang),sa=Math.sin(ang);
  var R=path.map(function(q){return {x:q[0]*ca-q[1]*sa,y:q[0]*sa+q[1]*ca};});
  var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  R.forEach(function(q){x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);});
  var W=120,pad=6,s=(W-2*pad)/(x1-x0),H=Math.round((y1-y0)*s+2*pad);
  var pts=R.map(function(q){return [((q.x-x0)*s+pad).toFixed(1),((q.y-y0)*s+pad).toFixed(1)];});
  var out='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" aria-hidden="true">';
  out+='<polyline points="'+pts.map(function(q){return q.join(',');}).join(' ')+'" fill="none" stroke="#cdd8ff" stroke-opacity=".45" stroke-width="1"/>';
  pts.forEach(function(q,j){out+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+(j===0?2.6:1.5)+'" fill="#eef2ff"/>';});
  return out+'</svg>';
 }
 /* a small real constellation for one section, same seed as the big sky */
 function miniConst(name,count){
  var pts=ringPoints(name,Math.max(3,count),16);
  var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  pts.forEach(function(p){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);});
  var w=maxX-minX||1,h=maxY-minY||1,W=76,H=46,pad=7;
  var s=Math.min((W-2*pad)/w,(H-2*pad)/h);
  var ox=W/2-(minX+maxX)/2*s,oy=H/2-(minY+maxY)/2*s;
  function X(p){return (p.x*s+ox).toFixed(1);}
  function Y(p){return (p.y*s+oy).toFixed(1);}
  var out='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" aria-hidden="true">';
  pts.forEach(function(p){
   if(p.parent<0)return;
   var q=pts[p.parent];
   out+='<line x1="'+X(q)+'" y1="'+Y(q)+'" x2="'+X(p)+'" y2="'+Y(p)+'" stroke="#cdd8ff" stroke-opacity=".45" stroke-width="1" stroke-dasharray="1 3"/>';
  });
  pts.forEach(function(p,j){
   out+='<circle cx="'+X(p)+'" cy="'+Y(p)+'" r="'+(j===0?2.6:1.5+p.r).toFixed(1)+'" fill="#eef2ff"/>';
  });
  return out+'</svg>';
 }
 function listItem(href,title,sub,constGlyph){
  var a=document.createElement('a');
  a.className='item';a.href=href;
  var g=(typeof constGlyph==='string')?constGlyph:constGlyph
   ?'<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><polyline points="2,15 10,5 19,12 28,4" fill="none" stroke="#cdd8ff" stroke-opacity=".55" stroke-width="1"/><circle cx="2" cy="15" r="2" fill="#eef2ff"/><circle cx="10" cy="5" r="2.4" fill="#eef2ff"/><circle cx="19" cy="12" r="2" fill="#eef2ff"/><circle cx="28" cy="4" r="2" fill="#eef2ff"/></svg>'
   :'<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="2.6" fill="#eef2ff"/><path d="M8 10 H22 M15 3 V17" stroke="#eef2ff" stroke-width=".8" opacity=".6"/></svg>';
  a.innerHTML='<span class="g">'+g+'</span><span class="t"><b></b><small></small></span>';
  a.querySelector('b').textContent=title;
  a.querySelector('small').textContent=sub;
  return a;
 }

 /* ---------- section sky ---------- */
 function readSectionItems(){
  var out=[],seen={};
  var scope=document.querySelector('.spread .sheet')||document;
  scope.querySelectorAll('table.idx tbody tr').forEach(function(tr){
   var a=tr.querySelector('td a');if(!a)return;
   var href=a.getAttribute('href');
   if(seen[href])return;seen[href]=1;
   var sk=tr.querySelector('td.sk');
   var pn=tr.querySelector('td.pn');
   out.push({label:shortTitle(a.textContent),href:href,sub:sk?sk.textContent.trim():'',pages:pn?pn.textContent.trim():''});
  });
  return out;
 }
 function buildSectionSky(sky,name){
  var items=readSectionItems();
  if(!items.length)return;
  var isBlog=/blog/i.test(name);
  var scope=document.querySelector('.spread .sheet')||document;
  var leads=[].slice.call(scope.querySelectorAll('p.lead')).map(function(p){return p.textContent.trim();});
  sky.classList.add('sky-section');
  sky.setAttribute('data-screen-label','Night sky · '+name);
  /* left: the section's own words, same as day */
  var lede=document.createElement('div');
  lede.className='lede';
  var h=document.createElement('h1');
  h.textContent=name;
  lede.appendChild(h);
  var sub=document.createElement('p');
  sub.className='ssub';
  sub.textContent=isBlog?'each star is one post, open it':'each star is one project, open it';
  lede.appendChild(sub);
  leads.forEach(function(t){
   var p=document.createElement('p');
   p.className='story';
   p.textContent=t;
   lede.appendChild(p);
  });
  sky.appendChild(lede);
  /* right: the constellation itself, one labelled star per piece */
  var chart=document.createElement('div');
  chart.className='sky-chart';
  var hand=document.createElement('p');
  hand.className='colhand';
  hand.textContent=numWord(items.length)+(isBlog?' to read':' to visit');
  chart.appendChild(hand);
  var W=640,H=560,cx=320,cy=268,n=items.length;
  if(/^works$/i.test(name)&&typeof SKYFIG!=='undefined'){worksPageSky(sky,chart,hand,items,name);return;}
  var R=Math.min(210,100+n*16);
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,'class':'chart',role:'img',
   'aria-label':name+' constellation, one star per '+(isBlog?'post':'project')});
  bgStars(el('g',null,svg),name+'sky',42,W,H);
  var pts=orderedPoints(name,n,185,R);
  chainLine(svg,pts,cx,cy);
  var labels=[];
  items.forEach(function(it,j){
   var p=pts[j],x=cx+p.x,y=cy+p.y;
   var a=el('a',{href:it.href},svg);
   a.setAttribute('aria-label',it.label+(it.pages?', '+it.pages:''));
   if(!reduced.matches){
    a.addEventListener('click',function(e){
     if(current()!=='night')return;
     e.preventDefault();
     zoomLeave(null,it.href,'in');
    });
   }
   el('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:'26',fill:'none','pointer-events':'all'},a);
   starDot(a,x.toFixed(1),y.toFixed(1),j===0?3.6:2.3+p.r*1.2,j===0);
   var nm=it.label.length>34?it.label.slice(0,32)+'\u2026':it.label;
   var lbl=nm+(it.pages?' ('+it.pages+')':'');
   var right=p.x>=0;
   var t=el('text',{x:(x+(right?14:-14)).toFixed(1),y:(y+4.5).toFixed(1),
    'class':'starlabel','text-anchor':right?'start':'end'},a);
   t.textContent=lbl;
   labels.push({t:t,sx:x,sy:y,by:y+4.5,right:right});
  });
  chart.appendChild(svg);
  sky.appendChild(chart);
  pendingLabels={list:labels,w:W,h:H};
  untangleLabels();
  var back=document.createElement('div');
  back.className='sky-back';
  back.innerHTML='<a></a>';
  var ba=back.querySelector('a');
  ba.href='index.html';ba.textContent='back to the whole sky';
  if(!reduced.matches){
   ba.addEventListener('click',function(e){
    if(current()!=='night')return;
    e.preventDefault();
    zoomLeave(null,'index.html','out');
   });
  }
  sky.appendChild(back);
  /* mobile: the same constellation, portrait, names under the stars */
  var cm=document.createElement('div');
  cm.className='sky-chart-m';
  var lh=document.createElement('p');
  lh.className='listhand';
  lh.textContent=name.toLowerCase()+', star by star';
  cm.appendChild(lh);
  var MW=420,MR=Math.min(160,82+n*16),MH=2*MR+180,mcx=MW/2,mcy=MH/2-16;
  var msvg=el('svg',{viewBox:'0 0 '+MW+' '+MH,'class':'chartm',role:'img',
   'aria-label':name+' constellation, one star per '+(isBlog?'post':'project')});
  bgStars(el('g',null,msvg),name+'skym',26,MW,MH);
  var mpts=orderedPoints(name,n,115,MR);
  chainLine(msvg,mpts,mcx,mcy);
  items.forEach(function(it,j){
   var p=mpts[j],x=mcx+p.x,y=mcy+p.y;
   var a=el('a',{href:it.href},msvg);
   a.setAttribute('aria-label',it.label+(it.pages?', '+it.pages:''));
   if(!reduced.matches){
    a.addEventListener('click',function(e){
     if(current()!=='night')return;
     e.preventDefault();
     zoomLeave(null,it.href,'in');
    });
   }
   el('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:'36',fill:'none','pointer-events':'all'},a);
   starDot(a,x.toFixed(1),y.toFixed(1),j===0?3.8:2.5+p.r*1.2,j===0);
   var nm=it.label.length>26?it.label.slice(0,24)+'\u2026':it.label;
   var lx=Math.min(Math.max(x,118),MW-118);
   var t=el('text',{'class':'starlabel','text-anchor':'middle'},a);
   var t1=el('tspan',{x:lx.toFixed(1),y:(y+26).toFixed(1)},t);
   t1.textContent=nm;
   if(it.pages){
    var t2=el('tspan',{x:lx.toFixed(1),dy:'1.3em','class':'pgs'},t);
    t2.textContent='('+it.pages+')';
   }
  });
  cm.appendChild(msvg);
  sky.appendChild(cm);
 }
 /* the Works page: the same river as the home sky, labelled with page counts (desktop);
    phones get the river with numbered stars and a numbered list under it */
 function worksPageSky(sky,chart,hand,items,name){
  sky.classList.add('works-sky');
  var n=items.length,W=760,H=760;
  var P=eriFit(eriUpright(),W,H,130,24,24),pick=eriPick(P,n);
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,'class':'chart',role:'img',
   'aria-label':'Works, drawn as the constellation Eridanus: one star per chapter'});
  bgStars(el('g',null,svg),name+'sky',42,W,H);
  riverLine(svg,P);
  var labels=[];
  P.forEach(function(p,j){
   if(!(j in pick)){el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:'1.3','class':'star dimstar'},svg);return;}
   var i=pick[j],it=items[i];
   var a=el('a',{href:it.href},svg);
   a.setAttribute('aria-label',it.label+(it.pages?', '+it.pages:''));
   starLink(a,it.href);
   el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:'20',fill:'none','pointer-events':'all'},a);
   starDot(a,p.x.toFixed(1),p.y.toFixed(1),i===0?3.6:2.5,i===0);
   var nm=it.label.length>30?it.label.slice(0,28)+'\u2026':it.label;
   var right=p.x>=W/2;
   var t=el('text',{x:(p.x+(right?14:-14)).toFixed(1),y:(p.y+4.5).toFixed(1),'class':'starlabel','text-anchor':right?'start':'end'},a);
   t.textContent=nm;  /* name only: page counts live in the hover text and the day index */
   labels.push({t:t,sx:p.x,sy:p.y,by:p.y+4.5,right:right});
  });
  chart.appendChild(svg);
  sky.appendChild(chart);
  pendingLabels={list:labels,w:W,h:H,dots:P,near:4};
  requestAnimationFrame(untangleLabels);
  var back=document.createElement('div');
  back.className='sky-back';
  back.innerHTML='<a></a>';
  var ba=back.querySelector('a');
  ba.href='index.html';ba.textContent='back to the whole sky';
  starLink(ba,'index.html','out');
  sky.appendChild(back);
  /* phones: the river, upright, numbered; the names in a list beneath it */
  var cm=document.createElement('div');
  cm.className='sky-chart-m works-m';
  var MW=420,MH=520;
  var Q=eriFit(0,MW,MH,40,20,20),qp=eriPick(Q,n);
  var ms=el('svg',{viewBox:'0 0 '+MW+' '+MH,'class':'chartm',role:'img',
   'aria-label':'Works, drawn as the constellation Eridanus, stars numbered as in the list below'});
  bgStars(el('g',null,ms),name+'skym',26,MW,MH);
  riverLine(ms,Q);
  Q.forEach(function(p,j){
   if(!(j in qp)){el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:'1.6','class':'star dimstar'},ms);return;}
   var i=qp[j],it=items[i];
   var a=el('a',{href:it.href},ms);
   a.setAttribute('aria-label',(i+1)+'. '+it.label);
   starLink(a,it.href);
   el('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:'18',fill:'none','pointer-events':'all'},a);
   starDot(a,p.x.toFixed(1),p.y.toFixed(1),i===0?4:3,i===0);
   var right=p.x<MW/2;
   var t=el('text',{x:(p.x+(right?12:-12)).toFixed(1),y:(p.y+5).toFixed(1),'class':'starnum','text-anchor':right?'start':'end'},a);
   t.textContent=String(i+1);
  });
  cm.appendChild(ms);
  var ol=document.createElement('ol');
  ol.className='works-list';
  items.forEach(function(it,i){
   var li=document.createElement('li');
   var a=document.createElement('a');
   a.href=it.href;
   a.innerHTML='<i></i><b></b>';
   a.querySelector('i').textContent=String(i+1);
   a.querySelector('b').textContent=it.label;
   starLink(a,it.href);
   li.appendChild(a);ol.appendChild(li);
  });
  cm.appendChild(ol);
  sky.appendChild(cm);
 }
 function starLink(a,href,mode){
  if(reduced.matches)return;
  a.addEventListener('click',function(e){
   if(current()!=='night')return;
   e.preventDefault();
   zoomLeave(null,href,mode||'in');
  });
 }
 /* section-sky labels must never sit on each other: two stars at the same
    height used to print their names on top of one another. once the chart is
    in the page, measure every label box, then settle them one by one, top to
    bottom: keep the first clear spot, trying the star's own side, the flipped
    side, then small vertical steps outward, all inside the viewBox. every
    move is deterministic, no dice. if the chart is hidden (day mode, narrow
    screens) the work waits until it can be measured, hence the resize hook. */
 var pendingLabels=null;
 function untangleLabels(){
  if(!pendingLabels)return;
  var list=pendingLabels.list,W=pendingLabels.w,H=pendingLabels.h,DOTS=pendingLabels.dots||[],NEAR=pendingLabels.near||14,GAP=14,PAD=2,i,bb;
  for(i=0;i<list.length;i++){
   try{bb=list[i].t.getBBox();}catch(e){return;}
   if(!bb.width)return; /* not rendered yet: keep it pending */
   list[i].w=bb.width;list[i].h=bb.height;list[i].asc=list[i].by-bb.y;
  }
  pendingLabels=null;
  var order=list.slice().sort(function(a,b){return a.sy-b.sy||a.sx-b.sx;});
  var placed=[];
  function boxFor(L,right,by){
   return {x:right?L.sx+GAP:L.sx-GAP-L.w,y:by-L.asc,w:L.w,h:L.h};
  }
  function clearOf(b){
   if(b.x<0||b.x+b.w>W||b.y<0||b.y+b.h>H)return false;
   for(var k=0;k<placed.length;k++){
    var p=placed[k];
    if(b.x<p.x+p.w+PAD&&p.x<b.x+b.w+PAD&&b.y<p.y+p.h+PAD&&p.y<b.y+b.h+PAD)return false;
   }
   for(var d=0;d<DOTS.length;d++){
    var q=DOTS[d];
    if(q.x>b.x-5&&q.x<b.x+b.w+5&&q.y>b.y-5&&q.y<b.y+b.h+5)return false;
   }
   return true;
  }
  order.forEach(function(L){
   var steps=[0],s,si,flip,pick=null;
   for(s=1;s<=NEAR;s++){steps.push(s*9);steps.push(-s*9);}
   for(si=0;si<steps.length&&!pick;si++){
    for(flip=0;flip<2&&!pick;flip++){
     var right=flip?!L.right:L.right;
     var b=boxFor(L,right,L.by+steps[si]);
     if(clearOf(b))pick={right:right,by:L.by+steps[si],b:b};
    }
   }
   if(!pick)pick={right:L.right,by:L.by,b:boxFor(L,L.right,L.by)};
   L.t.setAttribute('x',(pick.right?L.sx+GAP:L.sx-GAP).toFixed(1));
   L.t.setAttribute('y',pick.by.toFixed(1));
   L.t.setAttribute('text-anchor',pick.right?'start':'end');
   placed.push(pick.b);
  });
 }
 window.addEventListener('resize',untangleLabels);

 /* ---------- about sky ---------- */
 function buildAboutSky(sky){
  var scope=document.querySelector('.spread .sheet')||document;
  sky.setAttribute('data-screen-label','Night sky · About');
  var h1=scope.querySelector('h1.big');
  var ph=scope.querySelector('.photo');
  var img=ph?ph.querySelector('img'):null;
  var data={imgSrc:img?img.getAttribute('src'):null,
   phText:ph&&ph.querySelector('.ph')?ph.querySelector('.ph').textContent.trim():'a good photo of me goes here'};
  var wrap=document.createElement('div');
  wrap.className='sky-about';
  var left=document.createElement('div');
  left.className='portrait';
  left.appendChild(photoFrame(data));
  wrap.appendChild(left);
  var right=document.createElement('div');
  var h=document.createElement('h1');
  h.textContent=h1?h1.textContent.trim():'About';
  right.appendChild(h);
  scope.querySelectorAll('p.lead').forEach(function(p){
   var q=document.createElement('p');
   q.className='story';
   q.textContent=p.textContent.trim();
   right.appendChild(q);
  });
  var rows=scope.querySelectorAll('table.idx tbody tr');
  if(rows.length){
   var dl=document.createElement('div');
   dl.className='details';
   rows.forEach(function(tr){
    var tds=tr.querySelectorAll('td');
    if(tds.length<2)return;
    var k=document.createElement('span');
    k.className='k';k.textContent=tds[0].textContent.trim();
    var v=document.createElement('span');
    v.className='v';v.innerHTML=tds[1].innerHTML;
    dl.appendChild(k);dl.appendChild(v);
   });
   right.appendChild(dl);
  }
  var hand=scope.querySelector('p.hand');
  if(hand){
   var nt=document.createElement('p');
   nt.className='note';
   nt.textContent=hand.textContent.trim();
   right.appendChild(nt);
  }
  wrap.appendChild(right);
  sky.appendChild(wrap);
  /* back to the whole sky, like the sections */
  var back=document.createElement('div');
  back.className='sky-back';
  var ba=document.createElement('a');
  ba.href='index.html';ba.textContent='back to the whole sky';
  if(!reduced.matches){
   ba.addEventListener('click',function(e){
    if(current()!=='night')return;
    e.preventDefault();
    zoomLeave(null,'index.html','out');
   });
  }
  back.appendChild(ba);
  sky.appendChild(back);
 }

 /* five stars, top left: the night version of the day tabs */
 function buildStarNav(){
  if(document.querySelector('.starnav'))return;
  var desk=document.querySelector('.desk');
  if(!desk)return;
  var home=document.querySelector('.tab-home')||document.querySelector('.nav .brand');
  var tabs=[].slice.call(document.querySelectorAll('.tabs .tab'));
  if(!home&&!tabs.length)return;
  var items=[];
  if(home)items.push({label:'Home',href:home.getAttribute('href'),act:pageKind()==='home'});
  tabs.forEach(function(t){
   items.push({label:t.textContent.trim(),href:t.getAttribute('href'),act:t.classList.contains('act')});
  });
  var nav=document.createElement('nav');
  nav.className='starnav';
  nav.setAttribute('aria-label','Sections');
  items.forEach(function(it){
   var a=document.createElement('a');
   a.href=it.href;
   a.title=it.label;
   if(it.act){a.className='act';a.setAttribute('aria-current','page');}
   a.innerHTML='<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1 L8.6 5.4 13 7 8.6 8.6 7 13 5.4 8.6 1 7 5.4 5.4 Z"></path></svg><span></span>';
   a.querySelector('span').textContent=it.label;
   nav.appendChild(a);
  });
  desk.insertBefore(nav,desk.firstChild);
 }

 /* nebula wash for in-piece page links; works on pages that do not load notebook.js */
 function washNav(){
  var spread=document.querySelector('.spread');
  if(!spread||spread.__nightwash)return;
  spread.__nightwash=true;
  var mobile=window.matchMedia('(max-width:940px),(max-height:520px) and (pointer:coarse)').matches;
  var busy=false;
  function mkWash(d){
   var w=document.createElement('div');
   w.className='nebwash '+(mobile?'v ':'')+(d==='next'?'nw-next':'nw-prev');
   w.setAttribute('aria-hidden','true');
   (spread.parentNode||spread).appendChild(w);
   setTimeout(function(){w.remove();},1250);
  }
  var dir=null;
  try{dir=sessionStorage.getItem('nightWash');sessionStorage.removeItem('nightWash');}catch(e){}
  if(dir&&current()==='night'&&!reduced.matches){
   mkWash(dir);
   if(mobile)spread.classList.add('v');
   var wc=dir==='next'?'nwi-next':'nwi-prev';
   spread.classList.add(wc);
   setTimeout(function(){spread.classList.remove('nwi-next','nwi-prev','v');},1150);
  }
  document.addEventListener('click',function(e){
   if(current()!=='night'||busy)return;
   var pa=e.target.closest('.pagenav a');
   var z=e.target.closest('.zone');
   if(!pa&&!z)return;
   var href=pa?pa.getAttribute('href'):z.getAttribute('data-href');
   if(!href||/^https?:/i.test(href))return;
   var d=(z&&z.classList.contains('zprev'))||(pa&&/previous|\u2190/i.test(pa.textContent))?'prev':'next';
   e.preventDefault();e.stopPropagation();
   if(reduced.matches){location.href=href;return;}
   busy=true;
   try{sessionStorage.setItem('nightWash',d);}catch(e2){}
   mkWash(d);
   if(mobile)spread.classList.add('v');
   spread.classList.add(d==='next'?'nwo-next':'nwo-prev');
   setTimeout(function(){location.href=href;},520);
  },true);
 }

 /* on notebook pages the crumb's section becomes a quiet link back to its constellation */
 function linkCrumb(){
  var crumb=document.querySelector('.crumb');
  var act=document.querySelector('.tab.act');
  if(!crumb||!act)return;
  var t=crumb.textContent,name=act.textContent.trim();
  if(t.indexOf(name)!==0)return;
  crumb.textContent='';
  var a=document.createElement('a');
  a.href=act.getAttribute('href');
  a.textContent=name;
  crumb.appendChild(a);
  crumb.appendChild(document.createTextNode(t.slice(name.length)));
 }

 /* ---------- init ---------- */
 function pageKind(){
  var bn=decodeURIComponent(location.pathname).split('/').pop();
  if(bn&&bn.indexOf('.')<0)bn+='.html';
  if(bn===''||bn==='index.html')return 'home';
  if(bn==='works.html'||bn==='marketing.html'||bn==='design.html'||bn==='blog.html')return 'section';
  if(bn==='about.html')return 'about';
  return null;
 }
 function init(){
  buildToggle();
  buildFx();
  var kind=pageKind();
  if(!kind){buildStarNav();linkCrumb();washNav();return;}
  var desk=document.querySelector('.desk');
  if(!desk)return;
  document.body.classList.add('has-sky');
  if(kind==='section'||kind==='about')buildStarNav();
  var sky=document.createElement('div');
  sky.className='sky';
  desk.insertBefore(sky,desk.querySelector('.bookwrap'));
  if(kind==='home')buildHomeSky(sky);
  else if(kind==='about')buildAboutSky(sky);
  else{
   var h=document.querySelector('h1.big');
   buildSectionSky(sky,h?h.textContent.trim():'Section');
  }
  /* arrive with the matching zoom */
  var z=null;
  try{z=sessionStorage.getItem('nightZoom');sessionStorage.removeItem('nightZoom');}catch(e){}
  if(z&&!reduced.matches){
   if(z==='in'&&kind!=='home')sky.classList.add('zoom-in-enter');
   if(z==='out'&&kind==='home')sky.classList.add('zoom-out-enter');
  }
 }
 window.addEventListener('nb:navigated',function(){
  var nav=document.querySelector('.starnav');
  if(nav){
   var here=location.pathname.split('/').pop();
   nav.querySelectorAll('a').forEach(function(a){
    var bn=(a.getAttribute('href')||'').split('/').pop();
    if(bn===here){a.classList.add('act');a.setAttribute('aria-current','page');}
    else{a.classList.remove('act');a.removeAttribute('aria-current');}
   });
  }
  linkCrumb();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
})();
