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
