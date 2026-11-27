/* HIYOKO nav: "このページの目次" (right column) — highlights the section in view, collapses on narrow screens */
(function(){
var toc=document.querySelector('.pagetoc'); if(!toc)return;
var narrow=function(){return window.matchMedia('(max-width:1200px)').matches;};
if(narrow())toc.removeAttribute('open');
var links=[].slice.call(toc.querySelectorAll('a[href^="#"]'));
links.forEach(function(a){a.addEventListener('click',function(){
  var t=document.getElementById(a.getAttribute('href').slice(1)); if(t&&t.tagName==='DETAILS')t.open=true;
  if(narrow())toc.removeAttribute('open');});});
var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1));});
function spy(){
  var y=window.innerHeight*0.25,cur=-1;
  secs.forEach(function(s,i){ if(s&&s.getBoundingClientRect().top<=y)cur=i; });
  links.forEach(function(a,i){a.classList.toggle('on',i===cur);});
}
var tk=false; window.addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(function(){tk=false;spy();});}},{passive:true});
spy();
})();
/* section tabs: keep the current tab visible on narrow screens */
(function(){var c=document.querySelector('.hy-tabs a[aria-current]');if(!c)return;var r=c.parentNode;r.scrollLeft=Math.max(0,c.offsetLeft-(r.clientWidth-c.offsetWidth)/2);})();
/* phones/tablets: "このコーナーのページ" starts closed and behaves like a dropdown (closes on outside tap or after choosing) */
(function(){
var mq=window.matchMedia('(max-width:900px)'); if(!mq.matches)return;
var dd=[].slice.call(document.querySelectorAll('.layout>.sitenav,.layout>.pagetoc'));
dd.forEach(function(d){d.removeAttribute('open');
  d.addEventListener('toggle',function(){if(d.open)dd.forEach(function(o){if(o!==d)o.removeAttribute('open');});});
  d.addEventListener('click',function(e){if(e.target.closest('a'))d.removeAttribute('open');});});
document.addEventListener('click',function(e){dd.forEach(function(d){if(d.open&&!d.contains(e.target))d.removeAttribute('open');});});
document.addEventListener('keydown',function(e){if(e.key==='Escape')dd.forEach(function(d){d.removeAttribute('open');});});
})();
/* 2026-11-27: "back to top" button on every page (round, orange, bottom-right; shows after scrolling) */
(function(){
  var b=document.createElement('button'); b.type='button'; b.className='totop'; b.setAttribute('aria-label','ページのいちばん上へ'); b.textContent='↑';
  document.body.appendChild(b);
  var rm=matchMedia('(prefers-reduced-motion: reduce)');
  function u(){ b.classList.toggle('show', scrollY>500); }
  addEventListener('scroll',u,{passive:true}); u();
  b.addEventListener('click',function(){ scrollTo({top:0,behavior:rm.matches?'auto':'smooth'}); var m=document.getElementById('main'); if(m){m.setAttribute('tabindex','-1'); m.focus({preventScroll:true});} });
})();
/* 2026-11-27 home: wallpapers follow the cursor / phone tilt / scroll (the slow idle drift is CSS) */
(function(){
  var h=document.getElementById('hm-bg'); if(!h||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var c=document.getElementById('hm-bg3'), w=document.querySelector('.hm-bg2');
  var px=0,py=0,tx=0,ty=0,sy=0,raf=0;
  function tick(){ raf=0; tx+=(px-tx)*.08; ty+=(py-ty)*.08;
    h.style.translate=(tx*-16)+'px '+(ty*-12+sy*.3)+'px';
    if(c)c.style.translate=(tx*-12)+'px '+(ty*-8)+'px';
    if(w)w.style.translate=(tx*-8)+'px '+(ty*-6)+'px';
    if(Math.abs(px-tx)>.002||Math.abs(py-ty)>.002)raf=requestAnimationFrame(tick); }
  function kick(){ if(!raf)raf=requestAnimationFrame(tick); }
  addEventListener('pointermove',function(e){ px=e.clientX/innerWidth-.5; py=e.clientY/innerHeight-.5; kick(); },{passive:true});
  addEventListener('deviceorientation',function(e){ if(e.gamma==null)return; px=Math.max(-1,Math.min(1,e.gamma/30))/2; py=Math.max(-1,Math.min(1,(e.beta-45)/30))/2; kick(); },{passive:true});
  addEventListener('scroll',function(){ sy=Math.min(scrollY,800); kick(); },{passive:true});
})();
