import { describe, it, expect } from 'vitest';
import { catmullRom, simplifyTrack, completePlay, posAt, clamp, pathLen, type Keyframe, type Player } from './tactics';

describe('clamp', () => {
  it('limita al rango [a,b]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('pathLen', () => {
  it('calcula la longitud total de una trayectoria', () => {
    const kf: Keyframe[] = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 0.3, y: 0 },
      { t: 200, x: 0.3, y: 0.4 },
    ];
    expect(pathLen(kf)).toBeCloseTo(0.7, 5);
  });
});

describe('catmullRom', () => {
  it('interpola p1 en u=0 y p2 en u=1', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0.25, y: 0.5 };
    const p2 = { x: 0.75, y: 0.5 };
    const p3 = { x: 1, y: 0 };

    const r0 = catmullRom(p0, p1, p2, p3, 0);
    expect(r0.x).toBeCloseTo(p1.x, 5);
    expect(r0.y).toBeCloseTo(p1.y, 5);

    const r1 = catmullRom(p0, p1, p2, p3, 1);
    expect(r1.x).toBeCloseTo(p2.x, 5);
    expect(r1.y).toBeCloseTo(p2.y, 5);
  });

  it('no produce overshoot con puntos a distancias desiguales', () => {
    // Puntos con spacing muy desigual: p0-p1 cercanos, p1-p2 lejano, p2-p3 cercano
    const p0 = { x: 0.5, y: 0.5 };
    const p1 = { x: 0.51, y: 0.5 };
    const p2 = { x: 0.9, y: 0.5 };
    const p3 = { x: 0.91, y: 0.5 };

    // En toda la interpolación, x debe estar entre p1.x y p2.x (sin overshoot)
    for (let i = 1; i < 100; i++) {
      const u = i / 100;
      const r = catmullRom(p0, p1, p2, p3, u);
      expect(r.x).toBeGreaterThanOrEqual(p1.x - 0.001);
      expect(r.x).toBeLessThanOrEqual(p2.x + 0.001);
    }
  });

  it('maneja puntos repetidos sin NaN', () => {
    const p0 = { x: 0.5, y: 0.5 };
    const p1 = { x: 0.5, y: 0.5 }; // mismo punto
    const p2 = { x: 0.7, y: 0.3 };
    const p3 = { x: 0.9, y: 0.1 };

    const r = catmullRom(p0, p1, p2, p3, 0.5);
    expect(isNaN(r.x)).toBe(false);
    expect(isNaN(r.y)).toBe(false);
  });
});

describe('simplifyTrack', () => {
  it('reduce puntos colineales a 2 extremos', () => {
    const kf: Keyframe[] = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 0.1, y: 0.1 },
      { t: 200, x: 0.2, y: 0.2 },
      { t: 300, x: 0.3, y: 0.3 },
      { t: 400, x: 0.4, y: 0.4 },
    ];
    const result = simplifyTrack(kf);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(kf[0]);
    expect(result[1]).toEqual(kf[4]);
  });

  it('preserva puntos con desviación significativa', () => {
    const kf: Keyframe[] = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 0.1, y: 0.1 },
      { t: 200, x: 0.2, y: 0.5 }, // desviación grande
      { t: 300, x: 0.3, y: 0.3 },
      { t: 400, x: 0.4, y: 0.4 },
    ];
    const result = simplifyTrack(kf);
    expect(result.length).toBeGreaterThan(2);
    // El punto desviado debe estar preservado
    const hasDeviation = result.some(p => p.x === 0.2 && p.y === 0.5);
    expect(hasDeviation).toBe(true);
  });

  it('no modifica trayectorias de menos de 3 puntos', () => {
    const kf: Keyframe[] = [
      { t: 0, x: 0.1, y: 0.2 },
      { t: 100, x: 0.3, y: 0.4 },
    ];
    const result = simplifyTrack(kf);
    expect(result.length).toBe(2);
    expect(result).toEqual(kf);
  });
});

describe('completePlay', () => {
  // Setup: equipo 5v5 Futsal
  const players: Player[] = [
    { id: 'b1', team: 'blue', x: 0.5, y: 0.9, gk: true },
    { id: 'b2', team: 'blue', x: 0.3, y: 0.7 },
    { id: 'b3', team: 'blue', x: 0.7, y: 0.7 },
    { id: 'b4', team: 'blue', x: 0.4, y: 0.5 },
    { id: 'b5', team: 'blue', x: 0.6, y: 0.5 },
    { id: 'r1', team: 'red', x: 0.5, y: 0.1, gk: true },
    { id: 'r2', team: 'red', x: 0.3, y: 0.3 },
    { id: 'r3', team: 'red', x: 0.7, y: 0.3 },
    { id: 'r4', team: 'red', x: 0.4, y: 0.5 },
    { id: 'r5', team: 'red', x: 0.6, y: 0.5 },
    { id: 'ball', team: 'blue', x: 0.5, y: 0.5, ball: true },
  ];

  const baseTracks: Record<string, Keyframe[]> = {};
  players.forEach(p => {
    baseTracks[p.id] = [{ t: 0, x: p.x, y: p.y }];
  });
  // La pelota se mueve hacia arriba (blue ataca)
  baseTracks['ball'] = [
    { t: 0, x: 0.5, y: 0.5 },
    { t: 2000, x: 0.5, y: 0.3 },
    { t: 4000, x: 0.5, y: 0.15 },
  ];

  it('devuelve tracks para todos los jugadores', () => {
    const result = completePlay(baseTracks, 4000, 'attack', players);
    const ids = Object.keys(result.tracks);
    expect(ids.length).toBe(players.length);
    players.forEach(p => {
      expect(result.tracks[p.id]).toBeDefined();
      expect(result.tracks[p.id].length).toBeGreaterThan(1);
    });
  });

  it('detecta que blue ataca (pelota sube)', () => {
    const result = completePlay(baseTracks, 4000, 'attack', players);
    expect(result.att).toBe('blue');
  });

  it('style=attack genera tracks válidas (x,y en [0,1])', () => {
    const result = completePlay(baseTracks, 4000, 'attack', players);
    for (const id in result.tracks) {
      for (const kf of result.tracks[id]) {
        expect(kf.x).toBeGreaterThanOrEqual(0);
        expect(kf.x).toBeLessThanOrEqual(1);
        expect(kf.y).toBeGreaterThanOrEqual(0);
        expect(kf.y).toBeLessThanOrEqual(1);
        expect(kf.t).toBeGreaterThanOrEqual(0);
        expect(kf.t).toBeLessThanOrEqual(4000);
      }
    }
  });

  it('style=counter genera tracks válidas diferentes a attack', () => {
    const attackResult = completePlay(baseTracks, 4000, 'attack', players);
    const counterResult = completePlay(baseTracks, 4000, 'counter', players);

    // Ambos válidos
    for (const id in counterResult.tracks) {
      for (const kf of counterResult.tracks[id]) {
        expect(kf.x).toBeGreaterThanOrEqual(0);
        expect(kf.x).toBeLessThanOrEqual(1);
        expect(kf.y).toBeGreaterThanOrEqual(0);
        expect(kf.y).toBeLessThanOrEqual(1);
      }
    }

    // Las tracks deben diferir (al menos un jugador se mueve distinto)
    let anyDiff = false;
    for (const id in attackResult.tracks) {
      const a = attackResult.tracks[id];
      const c = counterResult.tracks[id];
      if (a.length === c.length) {
        for (let i = 0; i < a.length; i++) {
          if (Math.abs(a[i].x - c[i].x) > 0.01 || Math.abs(a[i].y - c[i].y) > 0.01) {
            anyDiff = true;
            break;
          }
        }
      } else {
        anyDiff = true;
      }
      if (anyDiff) break;
    }
    expect(anyDiff).toBe(true);
  });

  it('respeta attOverride cuando no es auto', () => {
    const result = completePlay(baseTracks, 4000, 'attack', players, 'red');
    expect(result.att).toBe('red');
  });
});
