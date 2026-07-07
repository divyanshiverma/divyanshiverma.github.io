/* notebook.js — notebook pagination + leaflet page-flip navigation */
(function(){
 var ORDER=['index.html','marketing.html','project/marketing-01.html','project/marketing-02.html','project/marketing-03.html','design.html','project/design-01.html','project/design-02.html','project/design-03.html','project/design-04.html','blog.html','post/blog-01.html','post/blog-02.html','post/blog-03.html','post/blog-04.html','about.html'];
 var spread,sheet,sheetB,vp,vpT,vpB,vine,hintUp,hintDn,pgL,pgR;
 var prevHref=null,nextHref=null;
 var small=window.matchMedia('(max-width:940px),(max-height:520px) and (pointer:coarse)');
 var reduced={matches:false}; /* Div's call: the book turns for everyone */
 var ZOOM=1;
 var k=0,nSpreads=1,unit=0,busy=false,mobile=false,single=false,stickEnd=false,orderIdx=0,isPiece=false,lb=null;

 function lightbox(src,alt){
  if(!lb){
   lb=document.createElement('div');lb.className='lightbox';
   lb.innerHTML='<img alt="">';
   lb.addEventListener('click',function(){lb.style.display='none';});
   document.body.appendChild(lb);
  }
  var li=lb.querySelector('img');
  li.src=src;
  li.alt=alt||'';
  lb.style.display='flex';
 }

 function motifs(disp){
  [sheet,sheetB].forEach(function(s){
   if(!s)return;
   var m=s.querySelector('.endmotif');
   if(m)m.style.display=disp;
  });
 }
 function measure(){
  if(!sheet){nSpreads=1;return;}
  motifs('none');
  var cw=sheet.clientWidth;
  unit=mobile?cw:cw/2;
  var nCols=Math.max(1,Math.round(sheet.scrollWidth/unit));
  if(nCols%2===1&&sheet.querySelector('.endmotif')&&!single){motifs('flex');nCols++;}
  nSpreads=single?nCols:Math.max(1,Math.ceil(nCols/2));
  if(k>nSpreads-1)k=nSpreads-1;
 }
 function bookShadow(){
  var p=Math.min(1,(orderIdx+(k+1)/nSpreads)/ORDER.length);
  var L=1+Math.round(p*5),R=Math.max(1,6-Math.round(p*5)),s=[],i;
  if(mobile){
   for(i=1;i<=L;i++){s.push('0 '+(-3*i)+'px 0 -1px #efece2');s.push('0 '+(-3*i)+'px 0 0 #cfc9b6');}
   for(i=1;i<=R;i++){s.push('0 '+(3*i)+'px 0 -1px #efece2');s.push('0 '+(3*i)+'px 0 0 #cfc9b6');}
   s.push('0 18px 34px rgba(29,22,21,.14)');
  }else{
   for(i=1;i<=L;i++){s.push((-3*i)+'px 2px 0 -1px #efece2');s.push((-3*i)+'px 2px 0 0 #cfc9b6');}
   for(i=1;i<=R;i++){s.push((3*i)+'px 2px 0 -1px #efece2');s.push((3*i)+'px 2px 0 0 #cfc9b6');}
   s.push('0 30px 54px rgba(29,22,21,.14)');
  }
  spread.style.boxShadow=s.join(',');
 }
 function place(){
  if(!sheet)return;
  sheet.style.transform='translateX('+(-(single?1:2)*k*unit)+'px)';
  if(mobile&&sheetB)sheetB.style.transform='translateX('+(-(2*k+1)*unit)+'px)';
  if(pgL&&pgR){
   var show=isPiece&&nSpreads>1;
   pgL.style.display=(show&&!mobile)?'':'none';
   pgR.style.display=show?'':'none';
   if(single)pgR.textContent='page '+(k+1)+'/'+nSpreads;
   else{pgL.textContent=2*k+1;pgR.textContent=2*k+2;}
  }
  if(hintUp)hintUp.style.visibility=(k>0||prevHref)?'visible':'hidden';
  if(hintDn)hintDn.style.visibility=(k<nSpreads-1||nextHref)?'visible':'hidden';
  bookShadow();
  try{
   var base=location.href.split('#')[0];
   history.replaceState(null,'',k>0?base+'#p'+(k+1):base);
  }catch(e){}
 }
 function hideHalf(side){
  var W=sheet.clientWidth,cut=2*k*unit+W/2;
  if(side==='L')sheet.style.clipPath='inset(0 -20000px 0 '+cut+'px)';
  else sheet.style.clipPath='inset(0 '+(W-cut)+'px 0 -20000px)';
 }
 function unhide(){sheet.style.clipPath='';}
 function vpBox(){
  var host=vp||spread;
  var r=host.getBoundingClientRect(),s=spread.getBoundingClientRect();
  return {l:(r.left-s.left)/ZOOM,t:(r.top-s.top)/ZOOM,w:r.width/ZOOM,h:r.height/ZOOM};
 }
 /* scale the book (crumb + spread) so the whole page fits the viewport */
 function fitScreen(){
  var bw=document.querySelector('.bookwrap');
  if(!bw)return;
  bw.style.zoom='';ZOOM=1;
  bw.style.marginTop='';
  document.body.classList.remove('bw-fit');
  var skyEl=document.querySelector('.sky');
  if(skyEl)skyEl.style.zoom='';
  if(document.documentElement.getAttribute('data-mode')==='whimsy'&&document.body.classList.contains('has-whimsy'))return;
  /* landscape phones: fitting would make the book unreadably small; scroll instead */
  if(window.innerHeight<520)return;
  if(document.body.classList.contains('has-sky')&&isNight()){
   /* the sky is showing, not the book: fit the sky instead (desktop only;
      the mobile sky is a designed vertical scroll) */
   if(mobile||!skyEl)return;
   var sr=skyEl.getBoundingClientRect();
   var sTop=sr.top+(window.scrollY||0);
   var sh=skyEl.offsetHeight;
   if(!sh)return;
   var sBelow=Math.max(0,document.body.scrollHeight-sTop-sh);
   var sz=(window.innerHeight-sTop-sBelow-6)/sh;
   sz=Math.min(1,Math.max(0.25,sz));
   if(sz<0.995)skyEl.style.zoom=sz;
   return;
  }
  function calc(){
   var rect=bw.getBoundingClientRect();
   var absTop=rect.top+(window.scrollY||0);
   var h=bw.offsetHeight;
   if(!h)return 1;
   var below=Math.max(0,document.body.scrollHeight-absTop-h);
   return (window.innerHeight-absTop-below-6)/h;
  }
  var tabsEl=document.querySelector('.tabs');
  function tabsOverflow(){
   return tabsEl&&!mobile&&tabsEl.getBoundingClientRect().right>window.innerWidth-8;
  }
  if(calc()>=0.995&&!tabsOverflow())return;
  /* needs shrinking: tighten the desk around the book, then zoom if the
     trim alone is not enough. The trim stays either way (removing it would
     bring the scroll right back). */
  document.body.classList.add('bw-fit');
  var z=Math.min(1,Math.max(0.25,calc()));
  if(z<0.995){bw.style.zoom=z;ZOOM=z;}
  else z=1;
  /* zoomed elements lay out in a wider virtual space, so the only honest way
     to keep the side tabs on screen is to measure and tighten until they fit */
  for(var gi=0;gi<8&&tabsOverflow()&&z>0.25;gi++){
   z=Math.max(0.25,z*0.94);
   bw.style.zoom=z;ZOOM=z;
  }
  /* split the leftover space evenly above and below the book */
  var lo=window.innerHeight-document.body.scrollHeight;
  if(lo>4)bw.style.marginTop=(lo/(2*z))+'px';
  /* fine-balance the visual gaps, then make sure nothing overflows */
  var nav=document.querySelector('.nav');
  if(nav){
   var nb=nav.getBoundingClientRect().bottom;
   var br=bw.getBoundingClientRect();
   var shift=((window.innerHeight-br.bottom)-(br.top-nb))/2;
   if(Math.abs(shift)>2){
    var cur=parseFloat(bw.style.marginTop)||0;
    bw.style.marginTop=Math.max(0,cur+shift/z)+'px';
   }
   var over=document.body.scrollHeight-window.innerHeight;
   if(over>0){
    cur=parseFloat(bw.style.marginTop)||0;
    bw.style.marginTop=Math.max(0,cur-over/z)+'px';
   }
  }
 }
 function sheetCloneFrom(src,col,box){
  var c=src.cloneNode(true);
  c.style.transform='translateX('+(-col*unit)+'px)';
  c.style.clipPath='';
  c.style.width=(2*unit)+'px';
  c.style.height=box.h+'px';
  c.style.overflow='hidden';
  c.style.visibility='visible';
  c.style.position='';
  return c;
 }
 function sheetClone(col,box){return sheetCloneFrom(sheet,col,box);}
 function mkFaceFrom(which,src,col,box){
  var f=document.createElement('div');
  f.className='pface '+which;
  if(col!=null)f.appendChild(sheetCloneFrom(src,col,box));
  var sh=document.createElement('div');sh.className='psh';f.appendChild(sh);
  return f;
 }
 function mkFace(which,col,box){return mkFaceFrom(which,sheet,col,box);}
 function mkPleafFrom(dir,srcF,frontCol,srcB,backCol,anim,dur,ease){
  var box=vpBox();
  var lf=document.createElement('div');
  lf.className='pleaf pleaf-'+dir;
  lf.setAttribute('aria-hidden','true');
  lf.style.top=box.t+'px';lf.style.height=box.h+'px';lf.style.width=unit+'px';
  lf.style.left=(dir==='next'?box.l+unit:box.l)+'px';
  lf.style.transformOrigin=(dir==='next'?'left':'right')+' center';
  lf.appendChild(mkFaceFrom('front',srcF,frontCol,box));
  lf.appendChild(mkFaceFrom('back',srcB,backCol,box));
  lf.style.animation=anim+' '+dur+'ms '+ease+' forwards';
  spread.classList.add('persp');
  spread.appendChild(lf);
  return lf;
 }
 function mkPleaf(dir,frontCol,backCol,anim,dur,ease){
  return mkPleafFrom(dir,sheet,frontCol,sheet,backCol,anim,dur,ease);
 }
 function mkUnderFrom(src,col,half){
  var box=vpBox();
  var o=document.createElement('div');
  o.className='punder';
  o.setAttribute('aria-hidden','true');
  o.style.top=box.t+'px';o.style.height=box.h+'px';o.style.width=unit+'px';
  o.style.left=(half==='R'?box.l+unit:box.l)+'px';
  o.appendChild(sheetCloneFrom(src,col,box));
  spread.appendChild(o);
  return o;
 }
 function mkUnder(col,half){return mkUnderFrom(sheet,col,half);}
 function mkCast(half,anim,dur){
  var box=vpBox();
  var c=document.createElement('div');
  c.className='pcast pcast-'+(half==='L'?'next':'prev');
  c.setAttribute('aria-hidden','true');
  c.style.top=box.t+'px';c.style.height=box.h+'px';c.style.width=unit+'px';
  c.style.left=(half==='R'?box.l+unit:box.l)+'px';
  c.style.animation=anim+' '+dur+'ms linear forwards';
  spread.appendChild(c);
  return c;
 }
 /* night mode: a stardust nebula wash instead of page flips */
 function isNight(){return document.documentElement.getAttribute('data-mode')==='night';}
 function mkWashOld(cls,offset){
  var lo=document.createElement('div');
  lo.className='leafouter '+cls;
  lo.setAttribute('aria-hidden','true');
  var cl=sheet.cloneNode(true);
  cl.style.transform='translateX('+offset+'px)';
  cl.style.clipPath='';
  cl.style.overflow='visible';
  lo.appendChild(cl);
  (vp||spread).appendChild(lo);
  return lo;
 }
 function mkWash(d,parent){
  var w=document.createElement('div');
  w.className='nebwash '+(mobile?'v ':'')+(d==='next'?'nw-next':'nw-prev');
  w.setAttribute('aria-hidden','true');
  (parent||spread).appendChild(w);
  setTimeout(function(){w.remove();},1250);
  return w;
 }
 function washFlip(d){
  mkWash(d);
  var lo=mkWashOld('wash-old '+(mobile?'v ':'')+(d==='next'?'nwo-next':'nwo-prev'),-(single?1:2)*k*unit);
  if(d==='next')k++;else k--;
  stickEnd=false;place();
  setTimeout(function(){lo.remove();busy=false;},1020);
 }
 function deskFlip(d){
  var out=(d==='next');
  var dur=720;
  var frontCol=out?2*k+1:2*k;
  var backCol=out?2*k+2:2*k-1;
  var underCol=out?2*k+3:2*k-2;
  var under=mkUnder(underCol,out?'R':'L');
  var cast=mkCast(out?'L':'R',out?'nbCastNext':'nbCastPrev',dur);
  var lf=mkPleaf(d,frontCol,backCol,out?'nbLeafNext':'nbLeafPrev',dur,'linear');
  var done=false;
  function finish(){
   if(done)return;done=true;
   if(out)k++;else k--;
   stickEnd=false;place();
   lf.remove();under.remove();cast.remove();
   spread.classList.remove('persp');
   busy=false;
  }
  lf.addEventListener('animationend',function(e){if(e.target===lf)finish();});
  setTimeout(finish,dur+300); /* watchdog: hidden tabs freeze CSS animations */
 }
 function mobFlip(d){
  var outEl=d==='next'?vpB:vpT, inEl=d==='next'?vpT:vpB;
  outEl.classList.add(d==='next'?'m-out-next':'m-out-prev');
  setTimeout(function(){
   outEl.classList.remove('m-out-next','m-out-prev');
   if(d==='next')k++;else k--;
   stickEnd=false;place();
   inEl.classList.add(d==='next'?'m-in-next':'m-in-prev');
   setTimeout(function(){inEl.classList.remove('m-in-next','m-in-prev');busy=false;},430);
  },335);
 }
 function spaEligible(href){
  if(!sheet)return false;
  /* only the night sky replaces the book; in day these pages are normal spreads */
  if(document.body.classList.contains('has-sky')&&isNight())return false;
  if(mobile&&!single&&!spread.classList.contains('mbook'))return false;
  if(isNight()){
   var bn=href.split('#')[0].split('?')[0].split('/').pop();
   if(bn&&bn.indexOf('.')<0)bn+='.html';
   if(bn===''||bn==='index.html'||bn==='marketing.html'||bn==='design.html'||bn==='blog.html'||bn==='about.html')return false;
  }
  return true;
 }
 function applyChrome(pl){
  if(pl.title)document.title=pl.title;
  var c=document.querySelector('.crumb');
  if(c&&pl.crumb!=null)c.innerHTML=pl.crumb;
  var tn=document.querySelector('.tabs');
  if(tn&&pl.tabs!=null)tn.innerHTML=pl.tabs;
  var rib=spread.querySelector('.ribbon');
  if(rib&&!pl.ribbon)rib.remove();
  if(pl.prev)spread.setAttribute('data-prev',pl.prev);else spread.removeAttribute('data-prev');
  if(pl.next)spread.setAttribute('data-next',pl.next);else spread.removeAttribute('data-next');
  prevHref=pl.prev||null;nextHref=pl.next||null;
  var th=document.querySelector('.tab-home');
  if(th&&pl.tabHome)th.setAttribute('href',pl.tabHome);
  var br=document.querySelector('.nav .brand');
  if(br&&pl.brand)br.setAttribute('href',pl.brand);
  var bn=pl.path.split('/').pop();
  orderIdx=ORDER.map(function(o){return o.split('/').pop();}).indexOf(bn);
  if(orderIdx<0)orderIdx=0;
  isPiece=ORDER[orderIdx].indexOf('/')>-1;
  document.body.classList.remove('pg-home','pg-section','pg-piece','pg-about');
  document.body.classList.add(
   bn==='index.html'?'pg-home':
   bn==='about.html'?'pg-about':
   (bn==='marketing.html'||bn==='design.html'||bn==='blog.html')?'pg-section':'pg-piece');
  prefetch(prevHref);prefetch(nextHref);
  try{window.dispatchEvent(new Event('nb:navigated'));}catch(e){}
 }
 function applyContent(d,pl){
  sheet.innerHTML=pl.sheetHTML;
  wrapImages();
  if(sheetB){sheetB.innerHTML=sheet.innerHTML;muteClone(sheetB);}
  measure();fixTables();measure();
  k=d==='next'?0:nSpreads-1;
  stickEnd=false;
  place();
  window.scrollTo(0,0);
 }
 function measureColsOf(s){
  var m=s.querySelector('.endmotif');
  if(m)m.style.display='none';
  var n=Math.max(1,Math.round(s.scrollWidth/unit));
  if(n%2===1&&m){m.style.display='flex';n++;}
  return n;
 }
 function spaWash(d,pl){
  mkWash(d,spread.parentNode);
  var lo=mkWashOld('wash-old '+(mobile?'v ':'')+(d==='next'?'nwo-next':'nwo-prev'),-(single?1:2)*k*unit);
  applyChrome(pl);applyContent(d,pl);
  setTimeout(function(){lo.remove();busy=false;},1020);
 }
 function spaMob(d,pl){
  var outEl=d==='next'?vpB:vpT;
  outEl.classList.add(d==='next'?'m-out-next':'m-out-prev');
  setTimeout(function(){
   outEl.classList.remove('m-out-next','m-out-prev');
   applyChrome(pl);applyContent(d,pl);
   var inEl=d==='next'?vpT:vpB;
   var cls=d==='next'?'m-in-next':'m-in-prev';
   inEl.classList.add(cls);
   setTimeout(function(){inEl.classList.remove(cls);busy=false;},450);
  },335);
 }
 function spaDesk(d,pl){
  var host=vp||spread;
  var tmp=sheet.cloneNode(false);
  tmp.innerHTML=pl.sheetHTML;
  tmp.style.position='absolute';tmp.style.top='0';tmp.style.left='0';
  tmp.style.visibility='hidden';tmp.style.transform='none';
  host.appendChild(tmp);
  var lastK=Math.max(0,Math.ceil(measureColsOf(tmp)/2)-1);
  var out=(d==='next');
  var dur=720;
  var frontCol=out?2*k+1:2*k;
  var backCol=out?0:2*lastK+1;
  var underCol=out?1:2*lastK;
  var under=mkUnderFrom(tmp,underCol,out?'R':'L');
  var cast=mkCast(out?'L':'R',out?'nbCastNext':'nbCastPrev',dur);
  var lf=mkPleafFrom(d,sheet,frontCol,tmp,backCol,out?'nbLeafNext':'nbLeafPrev',dur,'linear');
  var fin=false;
  function finish(){
   if(fin)return;fin=true;
   applyChrome(pl);applyContent(d,pl);
   requestAnimationFrame(function(){
    lf.remove();under.remove();cast.remove();tmp.remove();
    spread.classList.remove('persp');
    busy=false;
   });
  }
  lf.addEventListener('animationend',function(e){if(e.target===lf)finish();});
  setTimeout(finish,dur+300);
 }
 function leave(d){
  var href=d==='next'?nextHref:prevHref;
  if(reduced.matches){location.href=href;return;}
  if(!spaEligible(href)){fallbackLeave(d,href);return;}
  var abs;
  try{abs=new URL(href,location.href).href;}catch(e){fallbackLeave(d,href);return;}
  function fromText(txt){
   var doc=new DOMParser().parseFromString(txt,'text/html');
   var ns=doc.querySelector('.spread');
   var nsh=ns&&ns.querySelector('.sheet');
   if(!nsh)return false;
   var pl={title:doc.title,
    sheetHTML:nsh.innerHTML,
    crumb:doc.querySelector('.crumb')?doc.querySelector('.crumb').innerHTML:null,
    tabs:doc.querySelector('.tabs')?doc.querySelector('.tabs').innerHTML:null,
    ribbon:!!ns.querySelector('.ribbon'),
    prev:ns.getAttribute('data-prev'),
    next:ns.getAttribute('data-next'),
    tabHome:(doc.querySelector('.tab-home')||{getAttribute:function(){}}).getAttribute('href'),
    brand:(doc.querySelector('.nav .brand')||{getAttribute:function(){}}).getAttribute('href'),
    path:new URL(abs).pathname};
   try{history.pushState(null,'',abs);}catch(e){}
   if(isNight())spaWash(d,pl);
   else if(mobile)spaMob(d,pl);
   else spaDesk(d,pl);
   return true;
  }
  /* already prefetched: the turn starts this very tick, no network in the click path */
  if(pfText[abs]){
   if(!fromText(pfText[abs]))fallbackLeave(d,href);
   return;
  }
  var done=false;
  var slow=setTimeout(function(){if(!done){done=true;fallbackLeave(d,href);}},1500);
  fetch(abs).then(function(r){return r.text();}).then(function(txt){
   if(done)return;
   done=true;clearTimeout(slow);
   if(!fromText(txt))fallbackLeave(d,href);
  }).catch(function(){
   if(!done){done=true;clearTimeout(slow);fallbackLeave(d,href);}
  });
 }
 function fallbackLeave(d,href){
  try{sessionStorage.setItem('nbFlip',d);}catch(e){}
  if(isNight()){
   mkWash(d,spread.parentNode);
   if(mobile)spread.classList.add('v');
   spread.classList.add(d==='next'?'nwo-next':'nwo-prev');
   setTimeout(function(){location.href=href;},520);
   return;
  }
  if(mobile){
   var el=spread.classList.contains('mbook')?(d==='next'?vpB:vpT):spread;
   el.classList.add(d==='next'?'m-out-next':'m-out-prev');
   setTimeout(function(){location.href=href;},330);
  }else if(sheet){
   mkPleaf(d,d==='next'?2*k+1:2*k,null,
    d==='next'?'nbLeafOutNext':'nbLeafOutPrev',340,'cubic-bezier(.5,.05,.85,.4)');
   hideHalf(d==='next'?'R':'L');
   setTimeout(function(){location.href=href;},330);
  }else{
   spread.classList.add(d==='next'?'flip-out-next':'flip-out-prev');
   setTimeout(function(){location.href=href;},365);
  }
 }
 function go(d){
  if(busy)return;
  var intra=!!sheet&&(d==='next'?k<nSpreads-1:k>0);
  var href=d==='next'?nextHref:prevHref;
  if(!intra&&!href)return;
  busy=true;
  if(reduced.matches&&intra){
   if(d==='next')k++;else k--;
   stickEnd=false;place();busy=false;return;
  }
  if(intra){if(isNight()&&sheet)washFlip(d);else mobile?mobFlip(d):deskFlip(d);}
  else leave(d);
 }
 function sizeVine(){
  if(!vine||!mobile)return;
  vine.style.cssText='display:block;position:absolute;left:50%;top:50%;right:auto;bottom:auto;width:26px;height:'+spread.clientWidth+'px;transform:translate(-50%,-50%) rotate(90deg);opacity:.75;pointer-events:none;z-index:3';
 }
 function mkEl(cls,txt,parent){
  var el=document.createElement('div');
  el.className=cls;
  if(txt)el.textContent=txt;
  parent.appendChild(el);
  return el;
 }
 function buildMobile(){
  spread.classList.add('mbook');
  vpT=document.createElement('div');vpT.className='mpage mtop';
  vpB=document.createElement('div');vpB.className='mpage mbot';
  sheet.parentNode.insertBefore(vpT,sheet);
  vpT.appendChild(sheet);
  sheetB=sheet.cloneNode(true);
  muteClone(sheetB); /* purely visual copy: keep it out of the accessibility tree */
  vpB.appendChild(sheetB);
  vpT.parentNode.insertBefore(vpB,vpT.nextSibling);
  sheet.style.overflow='visible';sheetB.style.overflow='visible';
  vine=spread.querySelector('.vine');
  hintUp=mkEl('mhint mhint-up','\u2191 prev',vpT);
  hintDn=mkEl('mhint mhint-dn','next \u2193',vpB);
  pgL=mkEl('pgnum pgnum-l','',vpT);
  pgR=mkEl('pgnum pgnum-r','',vpB);
  sizeVine();
 }
 function buildDesk(){
  vp=document.createElement('div');vp.className='sheetvp';
  sheet.parentNode.insertBefore(vp,sheet);
  vp.appendChild(sheet);
  sheet.style.overflow='visible';
  pgL=mkEl('pgnum pgnum-l','',spread);
  pgR=mkEl('pgnum pgnum-r','',spread);
 }
 /* night mobile: one whole page per screen, same fixed page size, no split */
 function buildSingle(){
  buildDesk();
  spread.classList.add('nbook');
  hintUp=mkEl('mhint mhint-up','\u2191 prev',spread);
  hintDn=mkEl('mhint mhint-dn','next \u2193',spread);
 }
 function muteClone(s){
  /* the bottom-half sheet is a visual duplicate; hide it from AT and unfocus its zoomwraps */
  if(!s)return;
  s.setAttribute('aria-hidden','true');
  s.querySelectorAll('.zoomwrap[tabindex]').forEach(function(w){w.setAttribute('tabindex','-1');});
 }
 function wrapImages(){
  if(!sheet)return;
  sheet.querySelectorAll('.prose img').forEach(function(im){
   if(im.closest('.zoomwrap'))return;
   var w=document.createElement('span');w.className='zoomwrap';
   im.parentNode.insertBefore(w,im);w.appendChild(im);
   var b=document.createElement('span');b.className='zoombadge';b.textContent='\u2922 expand';w.appendChild(b);
   var t1=document.createElement('span');t1.className='tape tape-tl';w.appendChild(t1);
   var t2=document.createElement('span');t2.className='tape tape-br';w.appendChild(t2);
  });
  /* keyboard path: each zoomwrap is a button that opens the lightbox */
  sheet.querySelectorAll('.zoomwrap').forEach(function(w){
   if(w.getAttribute('tabindex'))return;
   w.setAttribute('tabindex','0');
   w.setAttribute('role','button');
   var im=w.querySelector('img');
   w.setAttribute('aria-label','Expand image'+(im&&im.alt?': '+im.alt:''));
  });
 }
 function mkSpacer(t){
  var target=t,pv=t.previousElementSibling;
  if(pv&&pv.tagName==='H2')target=pv;
  var sp=document.createElement('div');
  sp.className='colspacer';
  sp.style.breakBefore='column';
  sp.style.height='96%';
  target.parentNode.insertBefore(sp,target);
 }
 function fixTables(){
  [sheet,sheetB].forEach(function(s){if(s)[].slice.call(s.querySelectorAll('.colspacer')).forEach(function(x){x.remove();});});
  if(!sheet)return;
  var cs=getComputedStyle(sheet);
  var gap=parseFloat(cs.columnGap)||0,padL=parseFloat(cs.paddingLeft)||0,colW=unit-gap;
  var ts=[].slice.call(sheet.querySelectorAll('table.idx'));
  var tsB=sheetB?[].slice.call(sheetB.querySelectorAll('table.idx')):[];
  ts.forEach(function(t,i){
   /* rects are scaled by the fitScreen zoom; unit and colW are layout px, so unscale first */
   var r=t.getBoundingClientRect(),sr=sheet.getBoundingClientRect();
   var col=Math.round(((r.left-sr.left)/ZOOM-padL)/unit);
   var split=r.width/ZOOM>colW+20;
   if(split&&(single||col%2===1)){
    mkSpacer(t);
    if(tsB[i])mkSpacer(tsB[i]);
   }
  });
 }
 function refresh(){
  fitScreen();
  measure();
  fixTables();
  measure();
  if(stickEnd)k=nSpreads-1;
  place();
  sizeVine();
 }
 var pfDone={},pfText={};
 function prefetch(href){
  if(!href||pfDone[href]||/^(https?:|mailto:|#|data:)/i.test(href))return;
  pfDone[href]=1;
  try{
   var abs=new URL(href,location.href).href;
   fetch(abs).then(function(r){return r.ok?r.text():null;})
    .then(function(t){if(t)pfText[abs]=t;}).catch(function(){});
  }catch(e){}
 }
 document.addEventListener('pointerover',function(e){
  var a=e.target.closest&&e.target.closest('a[href]');
  if(a)prefetch(a.getAttribute('href'));
 },{passive:true});
 window.addEventListener('popstate',function(){location.reload();});
 function init(){
  spread=document.querySelector('.spread');if(!spread||spread.__nb)return;spread.__nb=true;
  prevHref=spread.getAttribute('data-prev')||null;
  nextHref=spread.getAttribute('data-next')||null;
  prefetch(prevHref);prefetch(nextHref);
  sheet=spread.querySelector('.sheet');
  mobile=small.matches;
  var bn=decodeURIComponent(location.pathname).split('/').pop();
  if(bn&&bn.indexOf('.')<0)bn+='.html';
  if(bn==='')bn='index.html';
  orderIdx=ORDER.map(function(o){return o.split('/').pop();}).indexOf(bn);
  if(orderIdx<0)orderIdx=0;
  isPiece=ORDER[orderIdx].indexOf('/')>-1;
  if(sheet)wrapImages();
  single=isNight()&&mobile;
  if(sheet){single?buildSingle():mobile?buildMobile():buildDesk();}
  measure();
  fixTables();
  measure();
  var dir=null;
  try{dir=sessionStorage.getItem('nbFlip');sessionStorage.removeItem('nbFlip');}catch(e){}
  var mh=location.hash.match(/^#p(\d+)$/);
  if(mh)k=Math.min(Math.max(0,parseInt(mh[1],10)-1),nSpreads-1);
  if(dir==='prev'){k=nSpreads-1;stickEnd=true;}
  if(dir==='next')k=0;
  place();
  fitScreen();
  if(dir&&!reduced.matches){
   if(isNight()){
    mkWash(dir,spread.parentNode);
    if(mobile)spread.classList.add('v');
    var wc=dir==='next'?'nwi-next':'nwi-prev';
    spread.classList.add(wc);
    setTimeout(function(){spread.classList.remove('nwi-next','nwi-prev','v');},1150);
   }else if(mobile){
    if(spread.classList.contains('mbook')){
     var el=dir==='next'?vpT:vpB, cls=dir==='next'?'m-in-next':'m-in-prev';
     el.classList.add(cls);setTimeout(function(){el.classList.remove(cls);},450);
    }else if(dir==='prev'){
     spread.classList.add('m-in-prev');setTimeout(function(){spread.classList.remove('m-in-prev');},450);
    }
   }else if(sheet){
    hideHalf(dir==='next'?'L':'R');
    var li=mkPleaf(dir,null,dir==='next'?2*k:2*k+1,
     dir==='next'?'nbLeafInNext':'nbLeafInPrev',430,'cubic-bezier(.16,.6,.35,1)');
    var inDone=false;
    function inFinish(){
     if(inDone)return;inDone=true;
     unhide();
     li.remove();spread.classList.remove('persp');
    }
    li.addEventListener('animationend',function(e){if(e.target===li)inFinish();});
    setTimeout(inFinish,730);
   }else{
    var scls=dir==='next'?'flip-in-next':'flip-in-prev';
    spread.classList.add(scls);setTimeout(function(){spread.classList.remove(scls);},480);
   }
  }
  spread.addEventListener('click',function(e){
   if(e.target.closest('a,button,input,textarea,select,img,.zoomwrap'))return;
   if(window.getSelection&&String(window.getSelection()))return;
   var r=spread.getBoundingClientRect();
   if(mobile){
    var y=(e.clientY-r.top)/r.height;
    go(y<0.5?'prev':'next');
    return;
   }
   var x=(e.clientX-r.left)/r.width;
   if(x<=0.325)go('prev');else if(x>=0.675)go('next');
  });
  spread.addEventListener('mousemove',function(e){
   if(mobile){spread.style.cursor='';return;}
   var r=spread.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;
   var canP=k>0||prevHref,canN=(sheet&&k<nSpreads-1)||nextHref;
   spread.style.cursor=(x<=0.325&&canP)||(x>=0.675&&canN)?'pointer':'';
  });
  document.addEventListener('click',function(e){
   var pl=e.target.closest('.pdflink');
   if(pl){e.preventDefault();window.print();return;}
   var im=e.target.closest('.sheet img');
   if(!im){var zw=e.target.closest('.zoomwrap');if(zw)im=zw.querySelector('img');}
   if(im&&im.getAttribute('src'))lightbox(im.getAttribute('src'),im.getAttribute('alt'));
  });
  document.addEventListener('keydown',function(e){
   if(lb&&lb.style.display==='flex'){if(e.key==='Escape')lb.style.display='none';return;}
   if(e.target.closest&&e.target.closest('input,textarea,select'))return;
   /* zoomwrap acts as a button: Enter or Space opens the lightbox */
   if(e.key==='Enter'||e.key===' '){
    var kzw=e.target.closest&&e.target.closest('.zoomwrap');
    if(kzw){
     e.preventDefault();
     var kim=kzw.querySelector('img');
     if(kim&&kim.getAttribute('src'))lightbox(kim.getAttribute('src'),kim.getAttribute('alt'));
     return;
    }
   }
   /* the book is hidden in whimsy: arrows must not flip it behind the paint desk */
   if(document.documentElement.getAttribute('data-mode')==='whimsy')return;
   if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();go('prev');}
   if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();go('next');}
  });
  window.addEventListener('resize',refresh);
  if(window.ResizeObserver&&sheet){var ro=new ResizeObserver(function(){refresh();});ro.observe(sheet);ro.observe(spread);}
  setTimeout(refresh,400);setTimeout(refresh,1200);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){refresh();});
  window.addEventListener('load',refresh);
  small.addEventListener('change',function(){location.reload();});
 }
 if(document.querySelector('.spread'))init();
 else{
  var n=0,t=setInterval(function(){n++;if(document.querySelector('.spread')){clearInterval(t);init();}else if(n>60)clearInterval(t);},80);
 }
})();
