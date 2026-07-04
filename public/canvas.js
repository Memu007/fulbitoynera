// Renderer de canvas para Pizarra Pro
// Usa variables globales del HTML: ctx, W, H, S, activeTracks, curDuration, pathLen

(function () {
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function L(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  function C(x, y, r, f) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); f ? ctx.fill() : ctx.stroke(); }

  // Medidas reglamentarias en metros (largo x ancho)
  const FIELD_DIMS = {
    5: { length: 40, width: 20, areaRadius: 6, penalty: 6, centerRadius: 0 },
    8: { length: 60, width: 45, bigArea: { depth: 13, width: 32 }, smallArea: { depth: 4, width: 9 }, penalty: 10 },
    11: { length: 105, width: 68, bigArea: { depth: 16.5, width: 40.3 }, smallArea: { depth: 5.5, width: 18.3 }, penalty: 11, centerRadius: 9.15 }
  };

  // Convierte metros de ancho del campo a píxeles X del canvas
  function mW(m, dim) { return m / dim.width * W; }
  // Convierte metros de largo del campo a píxeles Y del canvas
  function mL(m, dim) { return m / dim.length * H; }

  function drawPitch() {
    const dim = FIELD_DIMS[S.game];
    const stripes = S.game === 11 ? 10 : S.game === 8 ? 8 : 6;
    ctx.fillStyle = '#1A5334';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#1E5E3A' : '#18502E';
      ctx.fillRect(0, i * H / stripes, W, H / stripes + 1);
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.7);
    vg.addColorStop(0, 'rgba(255,255,255,.06)');
    vg.addColorStop(0.6, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(242,244,243,.92)';
    ctx.lineWidth = Math.max(1.5, W * 0.0045);
    const m = W * 0.045;
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    L(m, H / 2, W - m, H / 2);
    // F5 no tiene círculo central; F8/F11 usan 9.15m
    const centerRadius = S.game === 5 ? 0 : mW(9.15, dim);
    if (centerRadius) {
      C(W / 2, H / 2, centerRadius, false);
    }
    ctx.fillStyle = 'rgba(242,244,243,.92)'; C(W / 2, H / 2, 3, true);

    if (S.game === 5) {
      // F5: arco semicircular (área) de 6m de radio
      const r = mW(dim.areaRadius, dim);
      ctx.beginPath(); ctx.arc(W / 2, m, r, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H - m, r, Math.PI, 2 * Math.PI); ctx.stroke();
      // Punto de penalty (6m)
      const py = mL(dim.penalty, dim);
      C(W / 2, m + py, 3, true); C(W / 2, H - m - py, 3, true);
    } else {
      // F8 / F11: áreas rectangulares
      const big = dim.bigArea, sm = dim.smallArea;
      const bw = mW(big.width, dim), bh = mL(big.depth, dim);
      const sw = mW(sm.width, dim), sh = mL(sm.depth, dim);
      ctx.strokeRect(W / 2 - bw / 2, m, bw, bh); ctx.strokeRect(W / 2 - sw / 2, m, sw, sh);
      ctx.strokeRect(W / 2 - bw / 2, H - m - bh, bw, bh); ctx.strokeRect(W / 2 - sw / 2, H - m - sh, sw, sh);
      // Punto de penalty
      const py = mL(dim.penalty, dim);
      ctx.fillStyle = 'rgba(242,244,243,.92)';
      C(W / 2, m + py, 3, true); C(W / 2, H - m - py, 3, true);
      // Arco semicircular fuera del área (radio 9.15m, centro en el penalty)
      const arcR = mW(9.15, dim);
      ctx.beginPath(); ctx.arc(W / 2, m + py, arcR, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H - m - py, arcR, 1.25 * Math.PI, 1.75 * Math.PI); ctx.stroke();
    }

    ctx.lineWidth = Math.max(3, W * 0.008);
    const gw = (S.game === 5 ? mW(3, dim) : mW(dim.smallArea ? dim.smallArea.width * 0.8 : 7, dim));
    L(W / 2 - gw / 2, m, W / 2 + gw / 2, m);
    L(W / 2 - gw / 2, H - m, W / 2 + gw / 2, H - m);
  }

  function playerR() {
    const base = S.game === 11 ? 0.036 : S.game === 8 ? 0.041 : 0.047;
    return Math.max(12, W * base);
  }

  function drawPlayer(p) {
    const r = playerR();
    let x = p.x * W, y = p.y * H;
    const moving = (S.mode === 'play' || S.mode === 'pause') && p.spd > 0.0008;
    if (moving) { y += Math.sin(S.playT * 0.018 + p.id.length) * r * 0.09; }
    const isGK = p.gk;
    const baseCol = isGK ? '#FBBF24' : (p.team === 'blue' ? '#3B82F6' : '#EF4444');
    const darkCol = isGK ? '#B45309' : (p.team === 'blue' ? '#1E40AF' : '#991B1B');
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.75, r * 0.85, r * 0.32, 0, 0, 7); ctx.fill();
    ctx.restore();
    if (p.photo) {
      ctx.fillStyle = baseCol;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
      try {
        if (!p._img) p._img = new Image();
        if (p._img.src !== p.photo) p._img.src = p.photo;
        if (p._img.complete && p._img.naturalWidth > 0) {
          const iw = p._img.naturalWidth, ih = p._img.naturalHeight;
          const sc = Math.max(r * 2 / iw, r * 2 / ih);
          const dw = iw * sc, dh = ih * sc;
          ctx.drawImage(p._img, x - dw / 2, y - dh / 2, dw, dh);
        }
      } catch (e) { console.error('Error dibujando foto de jugador', e); }
      ctx.restore();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = baseCol;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    } else {
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, baseCol);
      g.addColorStop(0.7, baseCol);
      g.addColorStop(1, darkCol);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      ctx.stroke();
      const hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x - r * 0.2, y - r * 0.25, r * 0.75);
      hl.addColorStop(0, 'rgba(255,255,255,.55)');
      hl.addColorStop(0.6, 'rgba(255,255,255,.08)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    if (S.carrier === p.id && S.mode !== 'play' && S.mode !== 'pause') {
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 7); ctx.stroke();
    }
    if (S.dragging === p) { ctx.strokeStyle = '#22D3A6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 7); ctx.stroke(); }
    if (moving) {
      const ang = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(x + Math.cos(ang) * r * 1.15, y + Math.sin(ang) * r * 1.15);
      ctx.rotate(ang);
      ctx.fillStyle = p.team === 'blue' ? '#93C5FD' : '#FCA5A5';
      ctx.beginPath();
      ctx.moveTo(r * 0.45, 0);
      ctx.lineTo(-r * 0.1, -r * 0.28);
      ctx.lineTo(-r * 0.1, r * 0.28);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.font = `800 ${r * 0.92}px 'Inter',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.gk && !p.name ? 'A' : p.num, x, y + 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(p.gk && !p.name ? 'A' : p.num, x, y + 1);
    if (p.name) {
      ctx.font = `700 ${Math.max(9, r * 0.6)}px 'Inter',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,.96)';
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.strokeText(p.name, x, y + r * 1.75);
      ctx.fillText(p.name, x, y + r * 1.75);
    }
  }

  function drawBall(b) {
    const r = playerR() * 0.58;
    let x = b.x * W, y = b.y * H;
    const moving = (S.mode === 'play' || S.mode === 'pause') && b.spd > 0.0008;
    if (moving) { y += Math.sin(S.playT * 0.025) * r * 0.06; }
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.75, r * 0.26, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
    g.addColorStop(0, '#FDE68A'); g.addColorStop(1, '#FBBF24');
    ctx.fillStyle = g; C(x, y, r, true);
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.2; C(x, y, r, false);
    const spin = (S.mode === 'play' || S.mode === 'pause') ? S.playT * 0.014 : 0;
    ctx.fillStyle = 'rgba(30,30,30,.7)';
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 6.283 - 1.57 + spin;
      C(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.15, true);
    }
    C(x, y, r * 0.28, true);
    if (S.dragging === b) { ctx.strokeStyle = '#22D3A6'; ctx.lineWidth = 3; C(x, y, r + 5, false); }
  }

  function drawTrails() {
    const tr = activeTracks();
    if (tr && S.mode !== 'idle') {
      const upTo = S.mode === 'rec' ? Infinity : S.playT;
      if (upTo > 0) for (const id in tr) {
        const kf = tr[id]; if (!kf || kf.length < 2) continue;
        if (pathLen(kf) < 0.05) continue;
        const p = S.players.find(q => q.id === id); if (!p) continue;
        ctx.strokeStyle = p.ball ? 'rgba(251,191,36,.65)' : p.team === 'blue' ? 'rgba(59,130,246,.5)' : 'rgba(239,68,68,.5)';
        ctx.lineWidth = 2.4; ctx.setLineDash(p.ball ? [7, 7] : []);
        ctx.beginPath(); let st = false;
        for (const k of kf) {
          if (k.t > upTo) break;
          const x = k.x * W, y = k.y * H;
          st ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), st = true);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    drawFx();
  }

  function drawFx() {
    if (!S.fx.length) return;
    const now = performance.now();
    for (const s of S.fx) {
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.setLineDash(s.ball ? [7, 7] : []);
      const col = s.ball ? '251,191,36' : s.team === 'blue' ? '59,130,246' : '239,68,68';
      for (let i = 1; i < s.pts.length; i++) {
        const a = s.pts[i - 1], b = s.pts[i];
        const al = Math.max(0, 1 - (now - b.t) / 2400) * 0.8;
        if (al <= 0) continue;
        ctx.strokeStyle = `rgba(${col},${al})`;
        ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }

  function drawStrokes() {
    const all = S.curStroke ? [...S.drawings, S.curStroke] : S.drawings;
    for (const s of all) {
      if (s.pts.length < 2) continue;
      ctx.strokeStyle = s.color; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x * W, s.pts[0].y * H);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x * W, s.pts[i].y * H);
      ctx.stroke();
      const n = s.pts.length, a = s.pts[Math.max(0, n - 4)], b = s.pts[n - 1];
      const ang = Math.atan2((b.y - a.y) * H, (b.x - a.x) * W), hl = 11;
      ctx.fillStyle = s.color; ctx.beginPath();
      ctx.moveTo(b.x * W, b.y * H);
      ctx.lineTo(b.x * W - hl * Math.cos(ang - 0.45), b.y * H - hl * Math.sin(ang - 0.45));
      ctx.lineTo(b.x * W - hl * Math.cos(ang + 0.45), b.y * H - hl * Math.sin(ang + 0.45));
      ctx.closePath(); ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawPitch();
    drawStrokes();
    drawTrails();
    for (const p of S.players) { if (!p.ball) drawPlayer(p); }
    const b = S.players.find(p => p.ball); if (b) drawBall(b);
  }

  // Estelas en vivo: al mover algo queda su recorrido unos segundos y se desvanece
  const FXFADE = 2400;
  window.pushFx = function (p) {
    if (S.mode === 'play') return;
    if (!S.curFx || S.curFx.id !== p.id) {
      S.curFx = { id: p.id, ball: !!p.ball, team: p.team, pts: [] };
      S.fx.push(S.curFx);
    }
    S.curFx.pts.push({ x: p.x, y: p.y, t: performance.now() });
    ensureFxLoop();
  };
  function ensureFxLoop() {
    if (S.fxLoop) return; S.fxLoop = true;
    const step = () => {
      const now = performance.now();
      S.fx = S.fx.filter(s => s.pts.length && now - s.pts[s.pts.length - 1].t < FXFADE);
      if (!S.fx.length || S.mode === 'play') { S.fxLoop = false; draw(); return }
      draw(); requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Exponer solo lo que el HTML necesita
  window.draw = draw;
  window.playerR = playerR;
  window.CanvasRenderer = {
    draw, drawPitch, drawPlayer, drawBall, drawTrails, drawFx, drawStrokes, playerR, L, C
  };
})();
