const views = {
  home: document.getElementById('view-home'),
  tones: document.getElementById('view-tones'),
  input: document.getElementById('view-input'),
  output: document.getElementById('view-output'),
  journal: document.getElementById('view-journal'),
};
const setView = (name) => { Object.values(views).forEach(v => v.classList.remove('active')); views[name].classList.add('active'); };
document.getElementById('cta-start').addEventListener('click', () => setView('tones'));
document.querySelectorAll('.step-btn').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.step)));
document.querySelectorAll('.next').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.next)));
document.querySelectorAll('.prev').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.prev)));
document.getElementById('go-journal')?.addEventListener('click', () => setView('journal'));
document.getElementById('restart')?.addEventListener('click', () => setView('home'));

let freeCount = 0;
let lastOutputs = [];
const outputsEl = document.getElementById('outputs');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');

const buildPrompt = () => {
  const tone = document.querySelector('input[name="tone"]:checked')?.value || 'Clean Cut';
  const duration = document.getElementById('duration').value.trim();
  const reason = document.getElementById('reason').value.trim();
  const notes = document.getElementById('notes').value.trim();
  return {
    prompt: `You are a compassionate breakup assistant. Write a message ending a romantic relationship of ${duration || 'unknown duration'} due to ${reason || 'personal differences'}. Tone: ${tone}. The message must be clear, kind, and direct. Avoid cliches. Include any specific notes: ${notes || 'none'}. Provide 3 distinct options.`
  };
};

const renderOutputs = (texts=[]) => {
  outputsEl.innerHTML='';
  texts.forEach((t,i)=>{
    const card=document.createElement('div');
    card.className='output-card';
    card.innerHTML=`<strong>Option ${i+1}</strong><p>${t.replace(/\n/g,'<br>')}</p>`;
    outputsEl.appendChild(card);
  });
};

copyBtn?.addEventListener('click', () => {
  if (!lastOutputs.length) return;
  navigator.clipboard.writeText(lastOutputs[0]).then(() => {
    copyBtn.textContent='Copied ✓';
    setTimeout(()=>copyBtn.textContent='Copy best message',1200);
  });
});

const paywallEl=document.getElementById('paywall');
const journalArea=document.getElementById('journal-area');
const unlockBtn=document.getElementById('unlock-btn');
const journalText=document.getElementById('journal-text');
const journalStatus=document.getElementById('journal-status');
const setLocked=(locked)=>{ paywallEl.classList.toggle('hidden',!locked); journalArea.classList.toggle('hidden',locked); };
setLocked(true);
unlockBtn?.addEventListener('click',()=>{ setLocked(false); });

document.getElementById('save-journal')?.addEventListener('click',()=>{
  const txt=journalText.value.trim(); if(!txt) return;
  journalStatus.textContent='Saved locally.'; setTimeout(()=>journalStatus.textContent='',1500);
});

generateBtn?.addEventListener('click', async () => {
  if (freeCount >= 2) { setView('journal'); return; }
  generateBtn.disabled=true; generateBtn.textContent='Generating…';
  try{
    const payload=buildPrompt();
    const res=await fetch('/.netlify/functions/generate',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('API error');
    const data=await res.json();
    lastOutputs=data.options||[data.text||''];
    renderOutputs(lastOutputs); setView('output'); freeCount+=1;
  }catch(e){ alert('Issue generating your message. Check the function and API key in Netlify.'); }
  finally{ generateBtn.disabled=false; generateBtn.textContent='Generate message'; }
});

// Voice to text (Chrome/Safari)
const voiceBtn=document.getElementById('voice-btn');
const voiceStatus=document.getElementById('voice-status');
let rec;
if('webkitSpeechRecognition' in window){
  const Rec=window.webkitSpeechRecognition; rec=new Rec();
  rec.lang='en-GB'; rec.interimResults=false; rec.maxAlternatives=1;
  rec.onstart=()=>voiceStatus.textContent='Listening…';
  rec.onend=()=>voiceStatus.textContent='';
  rec.onerror=()=>voiceStatus.textContent='Mic error';
  rec.onresult=(evt)=>{
    const txt=evt.results[0][0].transcript||'';
    const existing=document.getElementById('notes').value;
    document.getElementById('notes').value=(existing?existing+'\n':'')+txt;
  };
  voiceBtn?.addEventListener('click',()=>rec.start());
}else{
  voiceBtn?.setAttribute('disabled','disabled'); voiceBtn?.classList.add('disabled');
  if(voiceStatus) voiceStatus.textContent='Voice not supported on this browser.';
}
