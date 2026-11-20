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
