// Plantillas de jugadas prearmadas — el entrenador las carga con un toque.
// Cada plantilla: {id, name, game, desc, cat, att, ball (color), tracks, duration}
// tracks es un map id->[{t,x,y}]. Solo incluye los jugadores que se mueven + pelota.

window.PLAYS_TEMPLATES = [
  // ============ FÚTBOL 11 ============
  {
    id: 'corner-primer-palo',
    name: 'Córner al primer palo',
    game: 11,
    cat: 'Pelota parada',
    desc: 'Córner desde la derecha, centro al primer palo, definición de cabeza.',
    att: 'blue',
    duration: 4000,
    tracks: {
      // pelota: desde el córner al primer palo
      ball: [
        {t:0, x:0.06, y:0.18},
        {t:1200, x:0.30, y:0.18},
        {t:2200, x:0.34, y:0.12},
        {t:4000, x:0.34, y:0.12}
      ],
      // rematador al primer palo
      b9: [
        {t:0, x:0.45, y:0.30},
        {t:1800, x:0.36, y:0.18},
        {t:2800, x:0.34, y:0.14},
        {t:4000, x:0.34, y:0.14}
      ],
      // segundo palo (espera rebote)
      b11: [
        {t:0, x:0.55, y:0.30},
        {t:2200, x:0.55, y:0.18},
        {t:4000, x:0.55, y:0.18}
      ],
      // corta la trayectoria (defensa rival)
      r2: [
        {t:0, x:0.40, y:0.10},
        {t:1500, x:0.33, y:0.15},
        {t:4000, x:0.33, y:0.15}
      ]
    }
  },
  {
    id: 'contraataque',
    name: 'Contraataque vertical',
    game: 11,
    cat: 'Transición',
    desc: 'Robo en defensa, pase largo al delantero, gambeta y definición.',
    att: 'blue',
    duration: 5000,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.80},
        {t:800, x:0.50, y:0.50},
        {t:2000, x:0.50, y:0.20},
        {t:3500, x:0.45, y:0.10},
        {t:5000, x:0.45, y:0.10}
      ],
      // volante que recupera y pasa
      b6: [
        {t:0, x:0.50, y:0.65},
        {t:800, x:0.50, y:0.50},
        {t:2000, x:0.50, y:0.50},
        {t:5000, x:0.50, y:0.50}
      ],
      // delantero que recibe y define
      b9: [
        {t:0, x:0.50, y:0.35},
        {t:2000, x:0.50, y:0.20},
        {t:3500, x:0.45, y:0.10},
        {t:5000, x:0.45, y:0.10}
      ],
      // wing que acompaña
      b7: [
        {t:0, x:0.20, y:0.50},
        {t:2500, x:0.30, y:0.25},
        {t:5000, x:0.35, y:0.15}
      ],
      // defensa rival que intenta alcanzar
      r4: [
        {t:0, x:0.50, y:0.30},
        {t:2000, x:0.50, y:0.25},
        {t:4000, x:0.47, y:0.15},
        {t:5000, x:0.47, y:0.15}
      ]
    }
  },
  {
    id: 'salida-arquero',
    name: 'Salida desde el arquero',
    game: 11,
    cat: 'Salida',
    desc: 'Arquero abre a lateral, sube por banda, centro al área.',
    att: 'blue',
    duration: 5500,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.92},
        {t:1000, x:0.18, y:0.78},
        {t:2500, x:0.12, y:0.40},
        {t:4000, x:0.45, y:0.15},
        {t:5500, x:0.45, y:0.15}
      ],
      // arquero que arranca la jugada
      b1: [
        {t:0, x:0.50, y:0.92},
        {t:800, x:0.40, y:0.88},
        {t:1500, x:0.50, y:0.92},
        {t:5500, x:0.50, y:0.92}
      ],
      // lateral derecho recibe y sube
      b2: [
        {t:0, x:0.18, y:0.78},
        {t:1000, x:0.18, y:0.78},
        {t:2500, x:0.12, y:0.40},
        {t:3500, x:0.15, y:0.30},
        {t:5500, x:0.18, y:0.25}
      ],
      // delantero al área
      b9: [
        {t:0, x:0.50, y:0.35},
        {t:3000, x:0.45, y:0.20},
        {t:4000, x:0.45, y:0.15},
        {t:5500, x:0.45, y:0.15}
      ],
      // mediocampista ofrece salida
      b8: [
        {t:0, x:0.50, y:0.60},
        {t:2000, x:0.35, y:0.55},
        {t:5500, x:0.40, y:0.45}
      ]
    }
  },
  {
    id: 'presion-alta',
    name: 'Presión alta (rival)',
    game: 11,
    cat: 'Defensiva',
    desc: 'Delanteros presionan la salida del rival. Forzán error y recuperan.',
    att: 'red',
    duration: 4500,
    tracks: {
      // pelota del rival intentando salir
      ball: [
        {t:0, x:0.50, y:0.10},
        {t:1000, x:0.30, y:0.20},
        {t:2000, x:0.30, y:0.20},
        {t:3000, x:0.50, y:0.45},
        {t:4500, x:0.50, y:0.45}
      ],
      // delantero azul presiona al arquero rival
      b9: [
        {t:0, x:0.50, y:0.30},
        {t:1000, x:0.50, y:0.15},
        {t:2500, x:0.30, y:0.25},
        {t:4500, x:0.30, y:0.30}
      ],
      // segundo delantero corta la salida
      b10: [
        {t:0, x:0.40, y:0.30},
        {t:1000, x:0.30, y:0.20},
        {t:2500, x:0.30, y:0.25},
        {t:4500, x:0.30, y:0.30}
      ],
      // volante recupera el balón robado
      b6: [
        {t:0, x:0.50, y:0.50},
        {t:2000, x:0.40, y:0.40},
        {t:3000, x:0.50, y:0.45},
        {t:4500, x:0.50, y:0.45}
      ],
      // defensa rival intenta salir
      r4: [
        {t:0, x:0.50, y:0.20},
        {t:1000, x:0.30, y:0.20},
        {t:2500, x:0.30, y:0.20},
        {t:4500, x:0.30, y:0.20}
      ]
    }
  },
  {
    id: 'tiki-taka',
    name: 'Tiki-taka (triangulación)',
    game: 11,
    cat: 'Ofensiva',
    desc: 'Toques cortos en mediocampo, triangulación, salida por banda.',
    att: 'blue',
    duration: 6000,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.60},
        {t:1200, x:0.35, y:0.55},
        {t:2400, x:0.50, y:0.45},
        {t:3600, x:0.65, y:0.40},
        {t:4800, x:0.80, y:0.25},
        {t:6000, x:0.80, y:0.25}
      ],
      b6: [
        {t:0, x:0.50, y:0.60},
        {t:1200, x:0.40, y:0.55},
        {t:6000, x:0.45, y:0.50}
      ],
      b8: [
        {t:0, x:0.35, y:0.55},
        {t:1200, x:0.35, y:0.55},
        {t:2400, x:0.50, y:0.45},
        {t:6000, x:0.55, y:0.40}
      ],
      b10: [
        {t:0, x:0.50, y:0.45},
        {t:2400, x:0.50, y:0.45},
        {t:3600, x:0.65, y:0.40},
        {t:6000, x:0.70, y:0.30}
      ],
      b7: [
        {t:0, x:0.20, y:0.50},
        {t:3600, x:0.65, y:0.40},
        {t:4800, x:0.80, y:0.25},
        {t:6000, x:0.80, y:0.25}
      ]
    }
  },
  {
    id: 'banda-centro',
    name: 'Banda y centro al área',
    game: 11,
    cat: 'Ofensiva',
    desc: 'Lateral profunda por banda, centro atrás, define el mediocampista.',
    att: 'blue',
    duration: 5000,
    tracks: {
      ball: [
        {t:0, x:0.85, y:0.60},
        {t:1500, x:0.88, y:0.25},
        {t:3000, x:0.55, y:0.30},
        {t:4000, x:0.55, y:0.30},
        {t:5000, x:0.55, y:0.30}
      ],
      // lateral que sube y centra
      b2: [
        {t:0, x:0.85, y:0.78},
        {t:1500, x:0.88, y:0.25},
        {t:3000, x:0.80, y:0.35},
        {t:5000, x:0.80, y:0.40}
      ],
      // delantero al primer palo (distrae)
      b9: [
        {t:0, x:0.50, y:0.30},
        {t:2000, x:0.42, y:0.18},
        {t:5000, x:0.42, y:0.18}
      ],
      // mediocampista que llega para definir el centro atrás
      b8: [
        {t:0, x:0.50, y:0.50},
        {t:2500, x:0.55, y:0.35},
        {t:4000, x:0.55, y:0.30},
        {t:5000, x:0.55, y:0.30}
      ],
      // defensa rival cubre
      r3: [
        {t:0, x:0.45, y:0.20},
        {t:2500, x:0.48, y:0.18},
        {t:5000, x:0.48, y:0.18}
      ]
    }
  },

  // ============ FÚTBOL 5 ============
  {
    id: 'f5-pivot',
    name: 'F5: Pase al pivote',
    game: 5,
    cat: 'Fútbol 5',
    desc: 'Salida corta, pase al pivote, giro y definición.',
    att: 'blue',
    duration: 3500,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.75},
        {t:800, x:0.50, y:0.55},
        {t:1800, x:0.50, y:0.35},
        {t:3000, x:0.45, y:0.18},
        {t:3500, x:0.45, y:0.18}
      ],
      // arquero que arranca
      b0: [
        {t:0, x:0.50, y:0.88},
        {t:800, x:0.50, y:0.82},
        {t:3500, x:0.50, y:0.82}
      ],
      // pivote recibe y define
      b4: [
        {t:0, x:0.50, y:0.45},
        {t:1800, x:0.50, y:0.35},
        {t:3000, x:0.45, y:0.18},
        {t:3500, x:0.45, y:0.18}
      ],
      // compañero acompaña
      b3: [
        {t:0, x:0.30, y:0.60},
        {t:2000, x:0.35, y:0.40},
        {t:3500, x:0.40, y:0.30}
      ],
      // defensa rival
      r1: [
        {t:0, x:0.35, y:0.35},
        {t:2000, x:0.45, y:0.30},
        {t:3500, x:0.45, y:0.25}
      ]
    }
  },
  {
    id: 'f5-rotacion',
    name: 'F5: Rotación y desmarque',
    game: 5,
    cat: 'Fútbol 5',
    desc: 'Rotación de jugadores, desmarque de apoyo, triangulación corta.',
    att: 'blue',
    duration: 4000,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.65},
        {t:1000, x:0.30, y:0.55},
        {t:2000, x:0.70, y:0.45},
        {t:3000, x:0.50, y:0.25},
        {t:4000, x:0.50, y:0.25}
      ],
      b2: [
        {t:0, x:0.70, y:0.70},
        {t:1000, x:0.30, y:0.55},
        {t:2000, x:0.50, y:0.55},
        {t:4000, x:0.55, y:0.40}
      ],
      b3: [
        {t:0, x:0.30, y:0.55},
        {t:1000, x:0.30, y:0.55},
        {t:2000, x:0.70, y:0.45},
        {t:4000, x:0.70, y:0.35}
      ],
      b4: [
        {t:0, x:0.50, y:0.45},
        {t:2000, x:0.50, y:0.40},
        {t:3000, x:0.50, y:0.25},
        {t:4000, x:0.50, y:0.25}
      ],
      // defensa rival que sigue la rotación
      r3: [
        {t:0, x:0.50, y:0.30},
        {t:2000, x:0.55, y:0.30},
        {t:4000, x:0.55, y:0.25}
      ]
    }
  },
  {
    id: 'f5-contra',
    name: 'F5: Contraataque rápido',
    game: 5,
    cat: 'Fútbol 5',
    desc: 'Robo en defensa, transición vertical rápida, 2vs1 y definición.',
    att: 'blue',
    duration: 3000,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.80},
        {t:600, x:0.40, y:0.60},
        {t:1500, x:0.55, y:0.30},
        {t:2500, x:0.50, y:0.15},
        {t:3000, x:0.50, y:0.15}
      ],
      b3: [
        {t:0, x:0.30, y:0.60},
        {t:600, x:0.40, y:0.60},
        {t:1500, x:0.45, y:0.40},
        {t:3000, x:0.50, y:0.35}
      ],
      b4: [
        {t:0, x:0.50, y:0.45},
        {t:1500, x:0.55, y:0.30},
        {t:2500, x:0.50, y:0.15},
        {t:3000, x:0.50, y:0.15}
      ],
      // defensa rival mal parada
      r2: [
        {t:0, x:0.45, y:0.40},
        {t:1000, x:0.50, y:0.35},
        {t:2500, x:0.50, y:0.20},
        {t:3000, x:0.50, y:0.20}
      ]
    }
  },

  // ============ FÚTBOL 8 ============
  {
    id: 'f8-salida-banda',
    name: 'F8: Salida por banda',
    game: 8,
    cat: 'Fútbol 8',
    desc: 'Salida desde atrás con lateral, centro al área, remate.',
    att: 'blue',
    duration: 4500,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.85},
        {t:1000, x:0.20, y:0.65},
        {t:2200, x:0.15, y:0.35},
        {t:3500, x:0.50, y:0.18},
        {t:4500, x:0.50, y:0.18}
      ],
      // arquero arranca
      b0: [
        {t:0, x:0.50, y:0.90},
        {t:1000, x:0.40, y:0.85},
        {t:4500, x:0.50, y:0.88}
      ],
      // lateral sube por banda
      b1: [
        {t:0, x:0.25, y:0.72},
        {t:1000, x:0.20, y:0.65},
        {t:2200, x:0.15, y:0.35},
        {t:3500, x:0.20, y:0.30},
        {t:4500, x:0.25, y:0.30}
      ],
      // delantero al área
      b7: [
        {t:0, x:0.50, y:0.30},
        {t:2500, x:0.50, y:0.20},
        {t:3500, x:0.50, y:0.18},
        {t:4500, x:0.50, y:0.18}
      ],
      // mediocampista acompaña
      b5: [
        {t:0, x:0.50, y:0.55},
        {t:2200, x:0.40, y:0.40},
        {t:4500, x:0.45, y:0.30}
      ],
      // defensa rival
      r2: [
        {t:0, x:0.40, y:0.25},
        {t:2200, x:0.45, y:0.20},
        {t:4500, x:0.48, y:0.18}
      ]
    }
  },
  {
    id: 'f8-contra-3v2',
    name: 'F8: Contraataque 3v2',
    game: 8,
    cat: 'Fútbol 8',
    desc: 'Recupero, salida rápida con 3 atacantes vs 2 defensores, definición.',
    att: 'blue',
    duration: 4000,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.75},
        {t:800, x:0.50, y:0.50},
        {t:2000, x:0.35, y:0.25},
        {t:3200, x:0.50, y:0.12},
        {t:4000, x:0.50, y:0.12}
      ],
      // recuperador y pasador
      b5: [
        {t:0, x:0.50, y:0.60},
        {t:800, x:0.50, y:0.50},
        {t:2000, x:0.50, y:0.40},
        {t:4000, x:0.50, y:0.35}
      ],
      // delantero por izquierda
      b7: [
        {t:0, x:0.35, y:0.40},
        {t:1500, x:0.35, y:0.25},
        {t:3200, x:0.45, y:0.15},
        {t:4000, x:0.50, y:0.12}
      ],
      // wing por derecha
      b6: [
        {t:0, x:0.65, y:0.45},
        {t:2000, x:0.55, y:0.30},
        {t:4000, x:0.55, y:0.20}
      ],
      // 2 defensores rivales
      r2: [
        {t:0, x:0.40, y:0.25},
        {t:2000, x:0.40, y:0.20},
        {t:4000, x:0.45, y:0.15}
      ],
      r3: [
        {t:0, x:0.60, y:0.25},
        {t:2000, x:0.55, y:0.20},
        {t:4000, x:0.55, y:0.18}
      ]
    }
  },
  {
    id: 'f8-presion-salida',
    name: 'F8: Presión a la salida rival',
    game: 8,
    cat: 'Fútbol 8',
    desc: 'Delanteros presionan salida del rival, forzan error, recuperan y definen.',
    att: 'blue',
    duration: 4500,
    tracks: {
      ball: [
        {t:0, x:0.50, y:0.12},
        {t:1200, x:0.30, y:0.22},
        {t:2500, x:0.50, y:0.40},
        {t:3500, x:0.50, y:0.18},
        {t:4500, x:0.50, y:0.18}
      ],
      // delantero presiona al arquero
      b7: [
        {t:0, x:0.50, y:0.30},
        {t:1200, x:0.40, y:0.20},
        {t:2500, x:0.50, y:0.40},
        {t:4500, x:0.50, y:0.35}
      ],
      // mediocampista corta la salida
      b5: [
        {t:0, x:0.40, y:0.45},
        {t:1200, x:0.30, y:0.30},
        {t:2500, x:0.50, y:0.40},
        {t:3500, x:0.50, y:0.25},
        {t:4500, x:0.50, y:0.25}
      ],
      // defensa rival intenta salir
      r3: [
        {t:0, x:0.30, y:0.25},
        {t:1200, x:0.30, y:0.22},
        {t:2500, x:0.40, y:0.30},
        {t:4500, x:0.40, y:0.30}
      ],
      // arquero rival
      r0: [
        {t:0, x:0.50, y:0.10},
        {t:1200, x:0.45, y:0.12},
        {t:4500, x:0.50, y:0.10}
      ]
    }
  }
];
