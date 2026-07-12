// Estado y setup de Pizarra Pro
// Usa el DOM y expone S, ctx, W, H, formaciones, etc. en window.

(function () {
  window.S = {
    mode: 'idle',            // idle|rec|play|pause
    game: 5,                 // 5|8|11
    speed: 1,
    team1: 5, team2: 5,
    form1: '1-2-1', form2: '1-2-1',
    players: [],             // {id,team,num,name,gk,ball,x,y}
    tracks: {}, duration: 0,
    recStart: 0, playT: 0, lastFrame: 0,
    dragging: null,
    carrier: null,           // id del jugador que lleva la pelota
    fx: [], fxLoop: false, curFx: null,
    drawings: [],            // {color, pts:[{x,y}]}
    drawMode: false, drawColor: '#f3f6f1', curStroke: null,
    preview: null,           // {tracks, duration}
    prevShow: 'ai',
    aiStyle: 'balanced',
    attTeam: 'auto',
    saved: [],
    editing: null,
    lastTap: { t: 0, id: null },
    loop: false,
    recHistory: [],
    plan: 'free',            // free | pro
    aiUsedToday: 0,
    aiDate: '',
  };

  window.SPEEDS = [
    { v: .5, n: 'Lento', d: 'Para analizar detalle por detalle', i: '🐢' },
    { v: 1, n: 'Normal', d: 'Velocidad real de la grabación', i: '▶️' },
    { v: 2, n: 'Rápido', d: 'El doble de velocidad', i: '⚡' },
    { v: 4, n: 'Muy rápido', d: 'Repaso veloz de toda la jugada', i: '🚀' },
    { v: 8, n: 'Relámpago', d: 'Repasá 5 jugadas en segundos', i: '⚡⚡' },
  ];

  window.STYLES = [
    { id: 'balanced', n: 'Equilibrado', i: '⚖️' },
    { id: 'attack',   n: 'Ofensivo',    i: '🔥' },
    { id: 'wings',    n: 'Por bandas',  i: '↔️' },
    { id: 'defense',  n: 'Defensivo',   i: '🛡️' },
    { id: 'counter',  n: 'Contraataque', i: '⚡' },
    { id: 'press',    n: 'Presión alta', i: '🎯' },
    { id: 'buildup',  n: 'Salida arco',  i: '🥅' },
  ];

  window.FORMATIONS = {
    5: ['1-2-1', '2-2', '1-1-2', '3-1'],
    8: ['3-3-1', '2-3-2', '3-2-2', '2-4-1', '3-1-3'],
    11: ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'],
  };
  window.DEFAULT_FORM = { 5: '1-2-1', 8: '3-3-1', 11: '4-3-3' };

  // Canvas setup
  window.cv = document.getElementById('fieldCanvas');
  window.ctx = window.cv.getContext('2d');
  window.W = 0; window.H = 0; window.DPR = 1;

  window.resize = function () {
    const wrap = document.getElementById('fieldWrap');
    const aw = wrap.clientWidth - 18, ah = wrap.clientHeight - 12;
    // Medidas reglamentarias: ancho/largo
    // F5 (futsal): 40m x 20m, F8: 60m x 45m, F11: 105m x 68m
    const ratio = typeof fieldAspect==='function' ? fieldAspect(S.game) : (S.game===5?.5:S.game===8?.75:68/105);
    let h = ah, w = h * ratio;
    if (w > aw) { w = aw; h = w / ratio; }
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * DPR; cv.height = h * DPR;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    W = w; H = h; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    draw();
  };
  addEventListener('resize', window.resize);

  window.parseForm = function (code, count) {
    const rows = code.split('-').map(Number);
    if (rows.reduce((a, b) => a + b, 0) + 1 !== count) return null;
    return rows;
  };

  window.formationPositions = function (code, count, isBlue) {
    let rows = parseForm(code, count);
    if (!rows) {
      const n = count - 1, per = Math.ceil(n / 3);
      rows = []; let left = n;
      while (left > 0) { rows.push(Math.min(per, left)); left -= per; }
    }
    const pos = [[0.5, 0.93]];
    const yBack = 0.82, yFront = S.game === 5 ? 0.62 : 0.57;
    rows.forEach((cnt, r) => {
      const y = rows.length === 1 ? (yBack + yFront) / 2 : yBack - (yBack - yFront) * r / (rows.length - 1);
      for (let j = 0; j < cnt; j++) {
        const x = (j + 1) / (cnt + 1);
        pos.push([0.5 + (x - 0.5) * 0.92, y]);
      }
    });
    return isBlue ? pos : pos.map(([x, y]) => [1 - x, 1 - y]);
  };

  window.buildPlayers = function (keepMeta) {
    const meta = {};
    if (keepMeta) S.players.forEach(p => meta[p.id] = { name: p.name, num: p.num, photo: p.photo || null });
    S.players = [];
    const f1 = formationPositions(S.form1, S.team1, true);
    for (let i = 0; i < S.team1; i++) {
      const id = 'b' + i;
      S.players.push({ id, team: 'blue', num: meta[id]?.num ?? (i + 1), name: meta[id]?.name || '', photo: meta[id]?.photo || null, gk: i === 0, x: f1[i][0], y: f1[i][1] });
    }
    const f2 = formationPositions(S.form2, S.team2, false);
    for (let i = 0; i < S.team2; i++) {
      const id = 'r' + i;
      S.players.push({ id, team: 'red', num: meta[id]?.num ?? (i + 1), name: meta[id]?.name || '', photo: meta[id]?.photo || null, gk: i === 0, x: f2[i][0], y: f2[i][1] });
    }
    S.players.push({ id: 'ball', team: 'ball', ball: true, num: 0, name: '', gk: false, x: .5, y: .5 });
  };

  window.applyFormation = function (team, code) {
    if (team === 'blue') S.form1 = code; else S.form2 = code;
    const count = team === 'blue' ? S.team1 : S.team2;
    const f = formationPositions(code, count, team === 'blue');
    let i = 0;
    S.players.forEach(p => { if (p.team === team) { p.x = f[i][0]; p.y = f[i][1]; i++; } });
    clearPlay(true);
    draw();
  };

  window.applyFormationsQuiet = function () {
    const f1 = formationPositions(S.form1, S.team1, true); let i = 0;
    S.players.forEach(p => { if (p.team === 'blue') { p.x = f1[i][0]; p.y = f1[i][1]; i++; } });
    const f2 = formationPositions(S.form2, S.team2, false); i = 0;
    S.players.forEach(p => { if (p.team === 'red') { p.x = f2[i][0]; p.y = f2[i][1]; i++; } });
  };

  window.syncGameSeg = function () {
    document.querySelectorAll('#gameSeg button').forEach(b => b.classList.toggle('on', +b.dataset.g === S.game));
  };

  window.initState = function () {
    buildPlayers();
    resize();
    syncGameSeg();
  };
})();
