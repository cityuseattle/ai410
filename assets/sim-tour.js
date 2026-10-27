/* AI 410: guided tour for the simulators.
   A page defines window.SIM_TOUR = [{title, setup, do, watch, expect, why}, ...]
   before loading this file, and has an empty <section id="tour"> where the tour goes.
   setup(h) configures the simulator; h.set(id, value) and h.click(id) fire the same
   events a person would, so the simulator's own code does the work. */
(function(){
  var steps=window.SIM_TOUR, box=document.getElementById('tour');
  if(!steps||!box) return;
  var KEY='ai410-tour-'+location.pathname.replace(/[^a-z0-9]+/gi,'-'), i=0;
  var h={
    set:function(id,v){
      var el=document.getElementById(id); if(!el) return;
      if(el.type==='checkbox') el.checked=!!v; else el.value=v;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    },
    click:function(id){ var el=typeof id==='string'?document.getElementById(id):id; if(el) el.click(); },
    q:function(sel){ return document.querySelector(sel); }
  };
  function save(v){ try{ localStorage.setItem(KEY,v); }catch(e){} }
  function load(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }

  function row(label,text){ return text?'<p class="tour-line"><b>'+label+'</b> '+text+'</p>':''; }
  function render(){
    var s=steps[i], dots='';
    for(var k=0;k<steps.length;k++) dots+='<span class="tour-dot'+(k===i?' on':k<i?' done':'')+'" aria-hidden="true"></span>';
    box.innerHTML=
      '<div class="tour-head"><span class="tour-k">Guided tour · step '+(i+1)+' of '+steps.length+'</span><span class="tour-dots">'+dots+'</span>'+
      '<button type="button" class="btn secondary tour-skip">Hide the tour</button></div>'+
      '<h2 class="tour-title">'+s.title+'</h2>'+
      row('Do:',s['do'])+row('Watch:',s.watch)+row('You should see:',s.expect)+row('Why it matters:',s.why)+
      '<div class="row tour-btns">'+
      (s.setup?'<button type="button" class="btn tour-setup">Set this up for me</button>':'')+
      '<button type="button" class="btn secondary tour-prev"'+(i===0?' disabled':'')+'>◂ Back</button>'+
      '<button type="button" class="btn secondary tour-next">'+(i===steps.length-1?'Finish tour':'Next step ▸')+'</button></div>'+
      '<p class="sr-only" aria-live="polite">Tour step '+(i+1)+' of '+steps.length+': '+s.title.replace(/<[^>]+>/g,'')+'</p>';
    box.className='card tour';
    var b=box.querySelector('.tour-setup');
    if(b) b.addEventListener('click',function(){ s.setup(h); b.textContent='Set up ✓ (press again to reset)'; });
    box.querySelector('.tour-prev').addEventListener('click',function(){ if(i>0){ i--; render(); focusTitle(); } });
    box.querySelector('.tour-next').addEventListener('click',function(){ if(i<steps.length-1){ i++; render(); focusTitle(); } else done(); });
    box.querySelector('.tour-skip').addEventListener('click',done);
  }
  function focusTitle(){ var t=box.querySelector('.tour-title'); if(t){ t.setAttribute('tabindex','-1'); t.focus({preventScroll:true}); } }
  function done(){
    save('done');
    box.className='card tour tour-min';
    box.innerHTML='<p class="small" style="margin:0"><b>Guided tour hidden.</b> Explore on your own, or <button type="button" class="linkish tour-restart">restart the '+steps.length+'-step tour</button>. The "What this teaches" box below has more experiments.</p>';
    box.querySelector('.tour-restart').addEventListener('click',function(){ save(''); i=0; render(); focusTitle(); });
  }
  if(load()==='done' && location.hash!=='#tour') done(); else render();
})();
