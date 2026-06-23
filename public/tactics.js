// Generated from src/lib/tactics.ts — do not edit manually
// Run: npm run build:tactics
(function(){
// Funciones tácticas extraídas de pizarra-pro.html para testeo.
// Las versiones en public/tactics.js son equivalentes en JS plano para el HTML.
// Clamp utilitario
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Longitud de una trayectoria (suma de distancias entre keyframes consecutivos)
function pathLen(kf) {
    let d = 0;
    for (let i = 1; i < kf.length; i++) {
        d += Math.hypot(kf[i].x - kf[i - 1].x, kf[i].y - kf[i - 1].y);
    }
    return d;
}
// Catmull-Rom CENTRIPETAL (α=0.5): no produce loops ni overshoot
// cuando los keyframes están a distancias desiguales. Yuksel 2011.
function catmullRom(p0, p1, p2, p3, u) {
    const d2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
    let dt0 = Math.pow(d2(p0, p1), 0.25);
    let dt1 = Math.pow(d2(p1, p2), 0.25);
    let dt2 = Math.pow(d2(p2, p3), 0.25);
    if (dt1 < 1e-5)
        dt1 = 1;
    if (dt0 < 1e-5)
        dt0 = dt1;
    if (dt2 < 1e-5)
        dt2 = dt1;
    let t1x = (p1.x - p0.x) / dt0 - (p2.x - p0.x) / (dt0 + dt1) + (p2.x - p1.x) / dt1;
    let t1y = (p1.y - p0.y) / dt0 - (p2.y - p0.y) / (dt0 + dt1) + (p2.y - p1.y) / dt1;
    let t2x = (p2.x - p1.x) / dt1 - (p3.x - p1.x) / (dt1 + dt2) + (p3.x - p2.x) / dt2;
    let t2y = (p2.y - p1.y) / dt1 - (p3.y - p1.y) / (dt1 + dt2) + (p3.y - p2.y) / dt2;
    t1x *= dt1;
    t1y *= dt1;
    t2x *= dt1;
    t2y *= dt1;
    const u2 = u * u, u3 = u2 * u;
    const x = p1.x + t1x * u + (-3 * p1.x + 3 * p2.x - 2 * t1x - t2x) * u2 + (2 * p1.x - 2 * p2.x + t1x + t2x) * u3;
    const y = p1.y + t1y * u + (-3 * p1.y + 3 * p2.y - 2 * t1y - t2y) * u2 + (2 * p1.y - 2 * p2.y + t1y + t2y) * u3;
    return { x, y };
}
// Posición interpolada en una trayectoria de keyframes al tiempo t
function posAt(kf, t) {
    const n = kf.length;
    if (n === 1 || t <= kf[0].t)
        return kf[0];
    if (t >= kf[n - 1].t)
        return kf[n - 1];
    let i = 1;
    while (kf[i].t < t)
        i++;
    const p1 = kf[i - 1], p2 = kf[i];
    const p0 = kf[i - 2] ? kf[i - 2] : { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y };
    const p3 = kf[i + 1] ? kf[i + 1] : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };
    const u = (t - p1.t) / Math.max(1, p2.t - p1.t);
    const q = catmullRom(p0, p1, p2, p3, u);
    return { t, x: clamp(q.x, 0.02, 0.98), y: clamp(q.y, 0.02, 0.98) };
}
// Douglas-Peucker: simplifica una trayectoria eliminando puntos redundantes
function simplifyTrack(kf) {
    if (kf.length < 3)
        return kf.slice();
    const eps = 0.012;
    const rdp = (s, e) => {
        let dmax = 0, idx = 0;
        const a = kf[s], b = kf[e];
        for (let i = s + 1; i < e; i++) {
            const d = perpDist(kf[i], a, b);
            if (d > dmax) {
                dmax = d;
                idx = i;
            }
        }
        if (dmax > eps) {
            const left = rdp(s, idx), right = rdp(idx, e);
            return left.slice(0, -1).concat(right);
        }
        return [a, b];
    };
    return rdp(0, kf.length - 1);
}
// Distancia perpendicular de punto p al segmento a-b
function perpDist(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-12)
        return Math.hypot(p.x - a.x, p.y - a.y);
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    const tClamped = clamp(t, 0, 1);
    return Math.hypot(p.x - (a.x + tClamped * dx), p.y - (a.y + tClamped * dy));
}
// Dirección de ataque: blue ataca hacia arriba (y decrece)
const dirOf = (team) => team === 'blue' ? -1 : 1;
// IA: completa una jugada generando tracks para jugadores que no se movieron
function completePlay(baseTracks, duration, style, players, attOverride) {
    const SAMPLE = 220;
    const ids = Object.keys(baseTracks);
    const start = {};
    const active = {};
    ids.forEach(id => {
        start[id] = baseTracks[id][0];
        active[id] = pathLen(baseTracks[id]) > 0.06;
    });
    const ball = baseTracks['ball'];
    const ballMoved = ball && pathLen(ball) > 0.06;
    let refTrack = ball && ball.length ? ball : [{ t: 0, x: 0.5, y: 0.5 }];
    if (!ballMoved) {
        let bl = 0;
        players.forEach(p => {
            if (p.ball)
                return;
            const l = pathLen(baseTracks[p.id] || []);
            if (l > bl) {
                bl = l;
                refTrack = baseTracks[p.id];
            }
        });
    }
    const ballAt = (t) => posAt(refTrack, t);
    // Detectar equipo atacante
    let att = (attOverride && attOverride !== 'auto') ? attOverride : null;
    if (!att && ballMoved) {
        const dy = ball[ball.length - 1].y - ball[0].y;
        if (Math.abs(dy) > 0.05)
            att = dy < 0 ? 'blue' : 'red';
    }
    if (!att) {
        const adv = { blue: 0, red: 0 };
        players.forEach(p => {
            if (p.ball)
                return;
            const kf = baseTracks[p.id];
            if (!kf)
                return;
            const d = (kf[0].y - kf[kf.length - 1].y) * (p.team === 'blue' ? 1 : -1);
            adv[p.team] += Math.max(0, d);
        });
        if (Math.abs(adv.blue - adv.red) > 0.02)
            att = adv.blue > adv.red ? 'blue' : 'red';
    }
    if (!att) {
        const b0 = ballAt(0);
        let bd = 9;
        players.forEach(p => {
            if (p.ball || p.gk)
                return;
            const d = Math.hypot(start[p.id].x - b0.x, start[p.id].y - b0.y);
            if (d < bd) {
                bd = d;
                att = p.team;
            }
        });
    }
    att = att || 'blue';
    const def = att === 'blue' ? 'red' : 'blue';
    const dAtt = dirOf(att);
    // Presor: defensor más cercano a la pelota al inicio
    let presser = null, pd = 9;
    players.forEach(p => {
        if (p.team !== def || p.gk || p.ball)
            return;
        const b0 = ballAt(0), d = Math.hypot(start[p.id].x - b0.x, start[p.id].y - b0.y);
        if (d < pd) {
            pd = d;
            presser = p.id;
        }
    });
    // Corredores especiales
    let winger = null, striker = null;
    if (style === 'attack' || style === 'wings' || style === 'balanced' || style === 'counter' || style === 'buildup') {
        const b0 = ballAt(0), side = b0.x < 0.5 ? 'L' : 'R';
        let wBest = 0;
        players.forEach(p => {
            if (p.team !== att || p.gk || active[p.id])
                return;
            const sx = start[p.id].x;
            const sameSide = side === 'L' ? sx < 0.5 : sx >= 0.5;
            const wide = Math.abs(sx - 0.5);
            if (sameSide && wide > wBest) {
                wBest = wide;
                winger = p.id;
            }
        });
        let sBest = 9;
        players.forEach(p => {
            if (p.team !== att || p.gk || active[p.id] || p.id === winger)
                return;
            const gy = att === 'blue' ? 0 : 1;
            const d = Math.abs(start[p.id].y - gy);
            if (d < sBest) {
                sBest = d;
                striker = p.id;
            }
        });
    }
    const depth = style === 'attack' ? 0.26 : style === 'defense' ? 0.07 : style === 'wings' ? 0.16
        : style === 'counter' ? 0.42 : style === 'press' ? 0.05 : style === 'buildup' ? 0.12 : 0.16;
    const out = {};
    const steps = Math.max(2, Math.ceil(duration / SAMPLE));
    for (const p of players) {
        const id = p.id;
        if (active[id] || p.ball && ballMoved) {
            out[id] = baseTracks[id];
            continue;
        }
        if (p.ball) {
            out[id] = baseTracks[id] || [{ t: 0, x: p.x, y: p.y }, { t: duration, x: p.x, y: p.y }];
            continue;
        }
        const a = start[id], kf = [];
        for (let s = 0; s <= steps; s++) {
            const t = Math.min(duration, s * SAMPLE);
            const b = ballAt(t);
            const prog = clamp(((ballAt(0).y - b.y) * dAtt * -1) / 0.55, 0, 1);
            let x, y;
            if (p.gk) {
                x = 0.5 + (b.x - 0.5) * 0.28;
                y = p.team === 'blue' ? clamp(a.y, 0.87, 0.94) : clamp(a.y, 0.06, 0.13);
                if (style === 'buildup' && p.team === att && prog < 0.15) {
                    y = a.y + dAtt * 0.04 * (0.15 - prog) / 0.15;
                }
            }
            else if (p.team === att) {
                x = a.x + (b.x - a.x) * 0.22;
                y = a.y + dAtt * depth * prog;
                if (style === 'counter') {
                    if (id === striker) {
                        const gy = att === 'blue' ? 0.15 : 0.85;
                        const gx = b.x < 0.5 ? 0.62 : 0.38;
                        x = a.x + (gx - a.x) * Math.min(1, prog * 1.8);
                        y = a.y + (gy - a.y) * Math.min(1, prog * 1.6);
                    }
                    else if (id !== winger) {
                        y = a.y + dAtt * (depth + 0.08) * Math.min(1, prog * 1.3);
                        x = a.x + (b.x - a.x) * 0.35;
                    }
                }
                if (style === 'press') {
                    y = a.y + dAtt * 0.05 * prog;
                }
                if (style === 'buildup') {
                    if (prog < 0.3) {
                        const wide = Math.abs(a.x - 0.5);
                        x = a.x + (a.x < 0.5 ? -0.15 : 0.15) * wide * prog / 0.3;
                        y = a.y + dAtt * 0.05 * (prog / 0.3);
                    }
                    else {
                        x = a.x + (b.x - a.x) * 0.2;
                        y = a.y + dAtt * depth * ((prog - 0.3) / 0.7);
                    }
                }
                if (id === winger) {
                    const tx = ballAt(0).x < 0.5 ? 0.10 : 0.90;
                    x = a.x + (tx - a.x) * Math.min(1, prog * 1.5);
                    y = a.y + dAtt * (depth + 0.16) * prog;
                }
                if (id === striker && style !== 'counter') {
                    const gy = att === 'blue' ? 0.12 : 0.88;
                    x = a.x + (0.5 + (b.x - 0.5) * 0.4 - a.x) * prog;
                    y = a.y + (gy - a.y) * Math.min(1, prog * 1.25);
                }
                if (style === 'wings' && id !== winger && Math.abs(a.x - 0.5) > 0.18) {
                    x = a.x + ((a.x < 0.5 ? 0.13 : 0.87) - a.x) * 0.5 * prog;
                }
                const dball = Math.hypot(x - b.x, y - b.y);
                if (dball < 0.085) {
                    const f = (0.085 - dball);
                    x += (x - b.x) / Math.max(0.01, dball) * f;
                    y += (y - b.y) / Math.max(0.01, dball) * f;
                }
            }
            else {
                const retreat = def === 'blue' ? 0.10 : -0.10;
                x = a.x + (b.x - a.x) * 0.30;
                y = a.y + retreat * prog;
                if (style === 'defense') {
                    x = a.x + (b.x - a.x) * 0.18 + (0.5 - a.x) * 0.18;
                    y = a.y + retreat * 1.4 * prog;
                }
                if (style === 'press') {
                    if (id === presser) {
                        const reach = Math.min(1, 0.4 + prog * 1.4);
                        x = a.x + (b.x - a.x) * reach;
                        y = a.y + (b.y - a.y) * reach;
                    }
                    else {
                        x = a.x + (b.x - a.x) * 0.45;
                        y = a.y + (def === 'blue' ? 0.18 : -0.18) * prog;
                    }
                }
                if (style === 'counter') {
                    x = a.x + (b.x - a.x) * 0.15;
                    y = a.y + retreat * 0.6 * prog;
                    if (id === presser) {
                        const reach = Math.min(0.8, prog * 1.2);
                        x = a.x + (b.x - a.x) * reach;
                        y = a.y + (b.y - a.y) * reach * 0.7;
                    }
                }
                if (id === presser && style !== 'press' && style !== 'counter') {
                    const off = def === 'blue' ? 0.055 : -0.055;
                    const reach = Math.min(1, 0.25 + prog * 1.1);
                    x = a.x + (b.x - a.x) * reach;
                    y = a.y + (b.y + off - a.y) * reach;
                }
            }
            kf.push({ t, x: clamp(x, 0.03, 0.97), y: clamp(y, 0.03, 0.97) });
        }
        out[id] = kf;
    }
    return { tracks: out, att };
}

window.clamp=clamp;
window.pathLen=pathLen;
window.catmullRom=catmullRom;
window.posAt=posAt;
window.simplifyTrack=simplifyTrack;
window.dirOf=dirOf;
window.completePlay=completePlay;
})();
