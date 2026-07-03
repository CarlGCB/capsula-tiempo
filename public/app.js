const $ = (id) => document.getElementById(id);

const states = {
  loading: $('state-loading'),
  empty: $('state-empty'),
  sealed: $('state-sealed'),
  revealed: $('state-revealed'),
};

function showState(name){
  Object.values(states).forEach(el => el.classList.add('hidden'));
  states[name].classList.remove('hidden');
}

function formatDate(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

let countdownTimer = null;

function startCountdown(deadlineIso){
  const target = new Date(deadlineIso + 'T00:00:00').getTime();

  function tick(){
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0){
      clearInterval(countdownTimer);
      // La fecha ya llegó desde el punto de vista del navegador.
      // El contenido real solo aparece cuando el proceso automático
      // lo haya publicado en data/content.json.
      $('cd-days').textContent = '00';
      $('cd-hours').textContent = '00';
      $('cd-mins').textContent = '00';
      $('cd-secs').textContent = '00';
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    $('cd-days').textContent = String(days).padStart(2, '0');
    $('cd-hours').textContent = String(hours).padStart(2, '0');
    $('cd-mins').textContent = String(mins).padStart(2, '0');
    $('cd-secs').textContent = String(secs).padStart(2, '0');
  }

  tick();
  countdownTimer = setInterval(tick, 1000);
}

async function fetchJson(path){
  const res = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function init(){
  const status = await fetchJson('data/status.json');

  if (!status || !status.deadline){
    showState('empty');
    return;
  }

  if (!status.revealed){
    $('deadline-date').textContent = formatDate(status.deadline);
    showState('sealed');
    startCountdown(status.deadline);
    return;
  }

  const content = await fetchJson('data/content.json');
  if (!content){
    // Se marcó como revelada pero el contenido aún no se ha publicado
    // (puede tardar un minuto tras el despliegue). Reintenta.
    $('deadline-date').textContent = formatDate(status.deadline);
    showState('sealed');
    startCountdown(status.deadline);
    return;
  }

  $('revealed-date').textContent = formatDate(status.deadline);
  $('letter-filename').textContent = content.filename || 'capsula.txt';
  $('letter-content').textContent = content.content || '';
  showState('revealed');

  $('download-btn').addEventListener('click', () => {
    const blob = new Blob([content.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = content.filename || 'capsula.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
}

showState('loading');
init();
