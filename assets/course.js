/* AI 410: theme toggle and header height, shared by guide pages */
(function(){
  var root=document.documentElement, btn=document.getElementById('themeToggle');
  try { var saved=localStorage.getItem('ai410-theme'); if(saved) root.setAttribute('data-theme',saved); } catch(e){}
  function isDark(){ return root.getAttribute('data-theme')==='dark'; }
  function label(){ if(btn) btn.textContent = isDark() ? '☀️ Light' : '🌙 Dark'; }
  label();
  var hdr=document.querySelector('header.top');
  function hh(){ if(hdr) root.style.setProperty('--header-h',hdr.offsetHeight+'px'); }
  hh(); window.addEventListener('resize',hh);
  if(btn) btn.addEventListener('click',function(){
    var next=isDark()?'light':'dark'; root.setAttribute('data-theme',next);
    try { localStorage.setItem('ai410-theme',next); } catch(e){}
    label();
  });
})();
