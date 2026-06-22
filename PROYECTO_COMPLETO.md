

================================================================
=== ARCHIVO: src/app/page.tsx ===
================================================================
'use client'

/**
 * Pizarra Pro — app de táctica de fútbol.
 *
 * La lógica (canvas, grabación, reproducción interpolada, IA que completa la
 * jugada, posesión de pelota, dibujo de flechas, jugadas guardadas) vive en
 * `/public/pizarra-pro.html` como app autocontenida. La cargamos en un iframe
 * a pantalla completa: así preservamos toda la funcionalidad probada y desde
 * aquí podemos seguir iterando el HTML.
 *
 * El iframe ocupa exactamente el viewport (sin scroll) y deja que la app
 * maneje su propio layout mobile-first (100dvh, overflow hidden).
 */
export default function Home() {
  return (
    <iframe
      src="/pizarra-pro.html"
      title="Pizarra Pro — Táctica de fútbol"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        border: 'none',
        display: 'block',
        margin: 0,
        padding: 0,
      }}
      allow="clipboard-write"
    />
  )
}


================================================================
=== ARCHIVO: src/app/layout.tsx ===
================================================================
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizarra Pro — Táctica de fútbol con IA",
  description: "Pizarra táctica para entrenadores: grabá jugadas, reproducilas a velocidad real y dejá que la IA complete los movimientos del resto del equipo. Fútbol 5, 8 y 11.",
  keywords: ["pizarra táctica", "fútbol", "entrenador", "tactica", "IA", "jugadas", "formaciones"],
  authors: [{ name: "Pizarra Pro" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Pizarra Pro",
    description: "Táctica de fútbol con IA: grabá, reproducí y completá jugadas.",
    siteName: "Pizarra Pro",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}


================================================================
=== ARCHIVO: src/app/api/checkout/route.ts ===
================================================================
import { NextRequest, NextResponse } from 'next/server';

// Endpoint para crear una Stripe Checkout Session.
// Funciona en dos modos:
// 1. DEMO (sin STRIPE_SECRET_KEY): devuelve un plan simulado para que el flujo de la app funcione.
// 2. PRODUCCIÓN (con STRIPE_SECRET_KEY): crea una Checkout Session real y devuelve la URL.

const PLAN_CONFIG: Record<string, {
  name: string;
  amount: number; // en centavos
  currency: string;
  interval: 'month' | 'year';
  trial: boolean;
}> = {
  'pro-yearly': {
    name: 'Pizarra Pro Anual',
    amount: 249900, // ARS 2.499
    currency: 'ars',
    interval: 'year',
    trial: true,
  },
  'pro-monthly': {
    name: 'Pizarra Pro Mensual',
    amount: 49900, // ARS 499
    currency: 'ars',
    interval: 'month',
    trial: false,
  },
  'club': {
    name: 'Pizarra Pro Club (5 entrenadores)',
    amount: 19900, // USD 199 — B2B en USD
    currency: 'usd',
    interval: 'year',
    trial: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const config = PLAN_CONFIG[plan];
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // MODO DEMO: sin credenciales de Stripe configuradas.
    // Devolvemos una respuesta simulada para que el flujo de la app funcione.
    if (!stripeKey || stripeKey === 'demo') {
      return NextResponse.json({
        demo: true,
        plan,
        message: 'Modo demo: activación simulada. Configurá STRIPE_SECRET_KEY en .env para cobrar de verdad.',
        redirectUrl: null,
      });
    }

    // MODO PRODUCCIÓN: crear Checkout Session real en Stripe.
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: config.currency,
            product_data: { name: config.name },
            unit_amount: config.amount,
            recurring: { interval: config.interval },
          },
          quantity: 1,
        },
      ],
      ...(config.trial && { subscription_data: { trial_period_days: 7 } }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pizarra-pro.html?upgrade=success&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pizarra-pro.html?upgrade=cancel`,
      metadata: { plan },
    });

    return NextResponse.json({ redirectUrl: session.url, plan });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}

// GET: estado del endpoint (para verificar configuración)
export async function GET() {
  const hasKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'demo';
  return NextResponse.json({
    configured: hasKey,
    mode: hasKey ? 'production' : 'demo',
    message: hasKey
      ? 'Stripe configurado. Los pagos son reales.'
      : 'Modo demo. Configurá STRIPE_SECRET_KEY en .env para activar pagos reales.',
  });
}


================================================================
=== ARCHIVO: public/manifest.json ===
================================================================
{
  "name": "Pizarra Pro — Táctica con IA",
  "short_name": "Pizarra Pro",
  "description": "Pizarra táctica de fútbol con IA. Grabá jugadas, animá y dejá que la IA complete el movimiento del rival.",
  "start_url": "/pizarra-pro.html",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0E1416",
  "theme_color": "#0E1416",
  "categories": ["sports", "productivity", "education"],
  "lang": "es",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "shortcuts": [
    {
      "name": "Nueva jugada",
      "short_name": "Nuevo",
      "description": "Empezar a grabar una jugada nueva",
      "url": "/pizarra-pro.html?action=new",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Mis jugadas",
      "short_name": "Jugadas",
      "description": "Ver jugadas guardadas",
      "url": "/pizarra-pro.html?action=plays",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ]
}


================================================================
=== ARCHIVO: public/sw.js ===
================================================================
// Service Worker — Pizarra Pro PWA
// Cachea el shell de la app para offline (entrenadores en cancha sin señal)
const CACHE = 'pizarra-pro-v1';
const ASSETS = [
  '/pizarra-pro.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/gif.js',
  '/gif.worker.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install: pre-cachear assets esenciales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para HTML (siempre fresco), cache-first para assets estáticos
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // HTML: network-first con fallback a cache (para que offline cargue la última versión)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/pizarra-pro.html')))
    );
    return;
  }

  // Fonts y otros assets: cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes('fonts'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});


================================================================
=== ARCHIVO: public/templates.js ===
================================================================
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


================================================================
=== ARCHIVO: public/pizarra-pro.html (LA APP PRINCIPAL) ===
================================================================
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#0E1416">
<title>Pizarra Pro — Táctica de fútbol con IA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="icon" type="image/png" href="/icon-512.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Pizarra Pro">
<script src="/gif.js"></script>
<script src="/templates.js"></script>
<style>
  :root{
    /* Paleta profesional — dark mode */
    --bg:#0E1416;
    --panel:#161D21;
    --panel2:#1F282D;
    --line:#2A3539;
    --line-soft:#222C30;
    --chalk:#E8EDF0;
    --muted:#9AA7AD;
    --muted-2:#5E6B72;
    --amber:#FBBF24;
    --rec:#EF4444;
    --blue:#3B82F6;
    --blue-soft:#60A5FA;
    --red:#EF4444;
    --violet:#A78BFA;
    --ok:#22D3A6;
    --accent:#22D3A6;
    --accent-press:#1BB089;
    --r:16px;
    --shadow-card:0 2px 8px rgba(0,0,0,.28), 0 1px 2px rgba(0,0,0,.2);
    --shadow-float:0 8px 24px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.25);
  }
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{height:100%}
  body{
    font-family:'Inter',-apple-system,'Segoe UI',Roboto,sans-serif;
    background:var(--bg);
    color:var(--chalk);
    display:flex;flex-direction:column;
    height:100dvh;overflow:hidden;
    user-select:none;-webkit-user-select:none;
    -webkit-font-smoothing:antialiased;
    font-feature-settings:"tnum","cv01";
  }
  button{font-family:inherit;color:inherit}

  /* ================= HEADER ================= */
  header{
    flex:0 0 auto;background:var(--panel);border-bottom:1px solid var(--line-soft);
    padding:10px 14px 10px;display:flex;flex-direction:column;gap:10px;
    padding-top:max(10px, env(safe-area-inset-top));
  }
  .hrow{display:flex;align-items:center;gap:10px;height:36px}
  .logo{display:flex;align-items:center;gap:8px;margin-right:auto}
  .logo .b{
    width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#0F9D77);
    display:flex;align-items:center;justify-content:center;font-size:15px;
    box-shadow:0 2px 8px rgba(34,211,166,.3);
  }
  .logo h1{font-size:15px;font-weight:800;letter-spacing:-.3px}
  .logo h1 em{font-style:normal;color:var(--accent);font-weight:900}
  .logo .pro-badge{
    font-size:9px;font-weight:800;letter-spacing:.5px;color:var(--accent);
    border:1px solid var(--accent);border-radius:4px;padding:1px 5px;margin-left:4px;
  }
  .logo .pro-badge.free{color:var(--muted);border-color:var(--line)}
  .iconBtn{
    width:36px;height:36px;border-radius:10px;border:1px solid var(--line);
    background:var(--panel2);font-size:16px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:transform .12s, background .15s;
  }
  .iconBtn:active{transform:scale(.92)}
  .iconBtn:disabled{opacity:.35;cursor:default}
  .seg{
    display:flex;background:var(--panel2);border:1px solid var(--line);
    border-radius:12px;padding:3px;gap:3px;
  }
  .seg button{
    flex:1;border:none;background:none;border-radius:9px;
    padding:8px 4px;font-size:12px;font-weight:700;letter-spacing:.2px;
    color:var(--muted);cursor:pointer;transition:.15s;
  }
  .seg button.on{background:var(--chalk);color:#0E1416;font-weight:800}

  /* ================= STATUS ================= */
  #statusBar{flex:0 0 auto;display:flex;justify-content:center;min-height:28px;padding:6px 12px 0}
  .pill{
    display:none;align-items:center;gap:7px;border-radius:999px;
    padding:5px 13px;font-size:11px;font-weight:700;letter-spacing:.6px;
  }
  .pill.show{display:flex}
  .pill.rec{background:var(--rec);color:#fff}
  .pill.rec i{width:7px;height:7px;border-radius:50%;background:#fff;animation:bl 1s infinite}
  .pill.play{background:var(--blue);color:#fff}
  .pill.pause{background:var(--amber);color:#0E1416}
  .pill.ai{background:var(--violet);color:#fff}
  @keyframes bl{50%{opacity:.15}}

  /* ================= FIELD ================= */
  #fieldWrap{flex:1 1 auto;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;padding:10px 14px 8px}
  #fieldCanvas{
    touch-action:none;border-radius:14px;
    box-shadow:0 12px 32px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.06);
  }
  /* riel de herramientas flotante — limpio, consistente */
  #rail{
    position:absolute;right:10px;top:50%;transform:translateY(-50%);
    display:flex;flex-direction:column;gap:8px;z-index:5;
  }
  .railBtn{
    width:42px;height:42px;border-radius:13px;border:1px solid var(--line);
    background:rgba(22,29,33,.92);backdrop-filter:blur(8px);
    font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;
    box-shadow:var(--shadow-card);transition:transform .12s;
  }
  .railBtn:active{transform:scale(.92)}
  .railBtn.on{background:var(--accent);border-color:var(--accent);color:#0E1416}
  .railBtn:disabled{opacity:.35}
  .railBtn .lock{
    position:absolute;top:-4px;right:-4px;background:var(--amber);color:#0E1416;
    font-size:9px;font-weight:900;border-radius:999px;padding:1px 4px;border:2px solid var(--bg);
  }
  .railBtn{position:relative}
  /* sub-barra dibujo */
  #drawBar{
    position:absolute;left:10px;bottom:10px;z-index:5;
    display:none;gap:8px;align-items:center;
    background:rgba(22,29,33,.95);border:1px solid var(--line);
    border-radius:14px;padding:7px;backdrop-filter:blur(8px);box-shadow:var(--shadow-card);
  }
  #drawBar.show{display:flex}
  .dBtn{
    width:36px;height:36px;border-radius:10px;border:1px solid var(--line);
    background:var(--panel2);font-size:15px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
  }
  .dBtn.col{border-width:2px}
  .dBtn.col.on{outline:2px solid var(--chalk);outline-offset:1px}
  .dBtn:active{transform:scale(.92)}

  /* ================= TRANSPORT ================= */
  #controls{
    flex:0 0 auto;background:var(--panel);border-top:1px solid var(--line-soft);
    padding:10px 14px calc(12px + env(safe-area-inset-bottom));
  }
  #scrubRow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  #chipSpeed{
    border:1px solid var(--line);background:var(--panel2);border-radius:999px;
    padding:6px 11px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;
    color:var(--chalk);
  }
  #chipLoop{
    border:1px solid var(--line);background:var(--panel2);border-radius:999px;
    padding:6px 11px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;
    flex:0 0 auto;color:var(--chalk);
  }
  #chipLoop.on{background:var(--accent);color:#0E1416;border-color:var(--accent)}
  .floatBtn{
    position:absolute;left:10px;top:10px;z-index:5;
    display:none;align-items:center;gap:6px;
    background:var(--accent);color:#0E1416;border:none;border-radius:999px;
    padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;
    box-shadow:var(--shadow-float);
  }
  .floatBtn.show{display:flex}
  .floatBtn:active{transform:scale(.94)}
  #scrubRow .t{font-variant-numeric:tabular-nums;font-size:10.5px;color:var(--muted);min-width:34px;text-align:center;font-weight:600}
  input[type=range]{flex:1;appearance:none;-webkit-appearance:none;height:26px;background:transparent}
  input[type=range]::-webkit-slider-runnable-track{
    height:5px;border-radius:3px;
    background:linear-gradient(to right,var(--accent) var(--fill,0%),#2A3539 var(--fill,0%));
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
    background:var(--chalk);margin-top:-6.5px;box-shadow:0 2px 6px rgba(0,0,0,.5);
  }
  input[type=range]:disabled::-webkit-slider-thumb{background:#4A565B}

  #btnRow{display:flex;align-items:center;justify-content:space-around;gap:4px}
  .ctl{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;font-size:10px;font-weight:600;color:var(--muted);cursor:pointer;min-width:52px}
  .ctl .ico{
    width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:var(--panel2);border:1px solid var(--line);font-size:18px;color:var(--chalk);transition:transform .1s;
  }
  .ctl.primary .ico{
    width:56px;height:56px;font-size:22px;background:var(--chalk);color:#0E1416;border:none;
    box-shadow:0 4px 16px rgba(232,237,240,.18);
  }
  .ctl.recOn .ico{background:var(--rec);border:none;color:#fff;box-shadow:0 0 0 5px rgba(239,68,68,.22)}
  .ctl:disabled{opacity:.3}
  .ctl:active:not(:disabled) .ico{transform:scale(.9)}
  .ctl.primary .ico:active{transform:scale(.92)}

  /* barra de preview IA */
  #aiBar{display:none;align-items:center;gap:8px}
  #aiBar.show{display:flex}
  #aiBar .segMini{
    display:flex;background:var(--panel2);border:1px solid var(--line);
    border-radius:11px;padding:3px;gap:3px;flex:1;
  }
  #aiBar .segMini button{
    flex:1;border:none;background:none;border-radius:8px;padding:9px 4px;
    font-size:11.5px;font-weight:700;color:var(--muted);cursor:pointer;
  }
  #aiBar .segMini button.on{background:var(--violet);color:#fff}
  .pillBtn{
    border:none;border-radius:12px;padding:11px 14px;font-size:12.5px;font-weight:800;
    letter-spacing:.3px;cursor:pointer;
  }
  .pillBtn.ok{background:var(--accent);color:#0E1416}
  .pillBtn.no{background:var(--panel2);border:1px solid var(--line);color:var(--chalk)}
  .pillBtn:active{transform:scale(.95)}

  /* ================= SHEETS ================= */
  #sheetBg{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(2px);display:none;z-index:50}
  #sheetBg.open{display:block}
  .sheet{
    position:fixed;left:0;right:0;bottom:0;z-index:60;background:var(--panel);
    border-radius:22px 22px 0 0;border-top:1px solid var(--line);
    transform:translateY(106%);transition:transform .28s cubic-bezier(.32,1,.45,1);
    max-height:88dvh;display:flex;flex-direction:column;
    box-shadow:0 -10px 40px rgba(0,0,0,.4);
  }
  .sheet.open{transform:translateY(0)}
  .sheet .grab{width:40px;height:4px;border-radius:3px;background:var(--line);margin:10px auto 4px}
  .sheet h2{font-size:13px;font-weight:800;letter-spacing:.8px;text-align:center;padding:7px 16px 12px}
  .sheet .body{overflow-y:auto;padding:0 16px calc(20px + env(safe-area-inset-bottom))}

  .opt{
    display:flex;align-items:center;gap:12px;background:var(--panel2);border:1px solid var(--line);
    border-radius:14px;padding:13px 14px;margin-bottom:9px;cursor:pointer;
    transition:transform .12s, border-color .15s;
  }
  .opt:active{transform:scale(.985)}
  .opt.sel{border-color:var(--accent);background:#1F282D}
  .opt .ic{width:40px;height:40px;border-radius:11px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:19px}
  .opt .tx{flex:1;min-width:0}
  .opt .tx b{display:block;font-size:14px;font-weight:700}
  .opt .tx small{color:var(--muted);font-size:12px;line-height:1.4;display:block;margin-top:2px}
  .opt .ck{color:var(--accent);font-size:17px;opacity:0;flex:0 0 auto}
  .opt.sel .ck{opacity:1}

  .secTitle{font-size:10.5px;font-weight:700;letter-spacing:1px;color:var(--muted);margin:14px 2px 8px;text-transform:uppercase}
  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .fChip{
    border:1px solid var(--line);background:var(--panel2);border-radius:11px;
    padding:10px 14px;font-size:12.5px;font-weight:700;cursor:pointer;color:var(--chalk);
  }
  .fChip.sel{background:var(--accent);color:#0E1416;border-color:var(--accent)}
  .fChip:disabled{opacity:.3}

  .teamTabs{display:flex;gap:8px;margin-bottom:4px}
  .teamTab{
    flex:1;border:1px solid var(--line);background:var(--panel2);border-radius:12px;
    padding:11px;font-size:12.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--chalk);
  }
  .teamTab .sw{width:13px;height:13px;border-radius:50%}
  .teamTab.on{border-color:var(--chalk);background:#2A3539}

  .teamRow{display:flex;align-items:center;gap:12px;background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:11px 14px;margin-bottom:9px}
  .teamRow .sw{width:15px;height:15px;border-radius:50%;flex:0 0 auto}
  .teamRow b{flex:1;font-size:14px;font-weight:600}
  .stepBtn{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:var(--panel);font-size:18px;font-weight:700;cursor:pointer;color:var(--chalk)}
  .stepBtn:disabled{opacity:.25}
  .countN{min-width:24px;text-align:center;font-weight:800;font-size:15px}

  .bigBtn{
    width:100%;border:none;border-radius:14px;padding:15px;font-size:13px;font-weight:800;
    letter-spacing:.4px;background:var(--accent);color:#0E1416;cursor:pointer;margin-top:6px;
    transition:transform .12s;
  }
  .bigBtn.violet{background:var(--violet);color:#fff}
  .bigBtn.alt{background:var(--panel2);border:1px solid var(--line);color:var(--chalk)}
  .bigBtn:active{transform:scale(.985)}
  .hint{font-size:11.5px;color:var(--muted);text-align:center;line-height:1.5;padding:6px 6px 12px}

  .playItem{display:flex;align-items:center;gap:11px;background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:12px 13px;margin-bottom:9px}
  .playItem .tx{flex:1;min-width:0}
  .playItem .tx b{font-size:13.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}
  .playItem .tx small{color:var(--muted);font-size:11px}
  .miniBtn{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:8px 11px;font-size:11.5px;font-weight:700;cursor:pointer;flex:0 0 auto;color:var(--chalk)}
  .miniBtn.warn{color:var(--rec)}
  input[type=text],input[type=number]{
    width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:12px;
    padding:13px;color:var(--chalk);font-size:14px;margin-bottom:10px;outline:none;font-family:inherit;
  }
  input:focus{border-color:var(--accent)}
  .empty{text-align:center;color:var(--muted);font-size:13px;padding:24px 8px;line-height:1.55}
  .row2{display:flex;gap:10px}
  .row2>*{flex:1}

  /* ================= PAYWALL ================= */
  .planCard{
    background:var(--panel2);border:2px solid var(--line);border-radius:16px;
    padding:16px;margin-bottom:10px;cursor:pointer;transition:.15s;position:relative;
  }
  .planCard.sel{border-color:var(--accent);background:#223038}
  .planCard.popular{border-color:var(--violet)}
  .planCard.popular::before{
    content:'MÁS POPULAR';position:absolute;top:-9px;right:14px;
    background:var(--violet);color:#fff;font-size:9px;font-weight:800;letter-spacing:.5px;
    padding:3px 8px;border-radius:999px;
  }
  .planCard .ph{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px}
  .planCard .pn{font-size:14px;font-weight:800}
  .planCard .pp{font-size:20px;font-weight:800;color:var(--accent)}
  .planCard .pp small{font-size:11px;color:var(--muted);font-weight:600}
  .planCard .pd{font-size:11.5px;color:var(--muted);line-height:1.4}
  .planCard .ps{font-size:11px;color:var(--accent);font-weight:700;margin-top:6px}
  .featList{list-style:none;margin:10px 0 0;padding:0}
  .featList li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--chalk);padding:5px 0;line-height:1.4}
  .featList li::before{content:'✓';color:var(--accent);font-weight:800;flex:0 0 auto}
  .featList li.locked{color:var(--muted-2)}
  .featList li.locked::before{content:'🔒';color:var(--muted-2)}

  /* ================= TOAST + ONBOARDING ================= */
  #toast{
    position:fixed;left:50%;bottom:150px;transform:translateX(-50%) translateY(16px);
    background:var(--chalk);color:#0E1416;border-radius:999px;padding:10px 17px;
    font-size:12px;font-weight:700;opacity:0;pointer-events:none;transition:.22s;z-index:95;
    box-shadow:var(--shadow-float);max-width:92vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

  #onboard{
    position:fixed;inset:0;z-index:100;background:rgba(8,12,14,.9);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;padding:20px;
  }
  #onboard .card{
    background:var(--panel);border:1px solid var(--line);border-radius:22px;
    padding:28px 22px;max-width:360px;width:100%;text-align:center;
    box-shadow:0 24px 60px rgba(0,0,0,.6);
  }
  #onboard .card .em{
    width:64px;height:64px;border-radius:18px;margin:0 auto 14px;
    background:linear-gradient(135deg,var(--accent),#0F9D77);
    display:flex;align-items:center;justify-content:center;font-size:32px;
    box-shadow:0 8px 24px rgba(34,211,166,.35);
  }
  #onboard h3{font-size:20px;font-weight:800;letter-spacing:-.3px;margin-bottom:6px}
  #onboard .sub{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.4}
  #onboard ol{list-style:none;text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:20px}
  #onboard li{display:flex;gap:12px;align-items:flex-start;font-size:13.5px;line-height:1.45;color:var(--chalk)}
  #onboard li .n{
    flex:0 0 auto;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#0E1416;
    font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;margin-top:1px;
  }
  #onboard li b{font-weight:700}
  #onboard .dots{display:flex;justify-content:center;gap:6px;margin-bottom:16px}
  #onboard .dots span{width:6px;height:6px;border-radius:50%;background:var(--line)}
  #onboard .dots span.on{background:var(--accent);width:18px}
  @media (prefers-reduced-motion:reduce){.sheet{transition:none}.pill.rec i{animation:none}}

  /* ================= CONTROL DE MINUTOS ================= */
  #matchTimer{
    background:var(--panel2);border:1px solid var(--line);border-radius:14px;
    padding:14px;margin-bottom:12px;text-align:center;
  }
  #matchTimer .clock{font-size:32px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:1px}
  #matchTimer .lbl{font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:2px}
  #matchTimer .btns{display:flex;gap:8px;justify-content:center;margin-top:10px}
  #matchTimer .btns button{
    border:1px solid var(--line);background:var(--panel);border-radius:10px;
    padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--chalk);
  }
  #matchTimer .btns button.primary{background:var(--accent);color:#0E1416;border:none}
  #matchTimer .btns button.danger{color:var(--rec)}
  .rosterItem{
    display:flex;align-items:center;gap:10px;background:var(--panel2);
    border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:7px;
    cursor:pointer;transition:border-color .15s;
  }
  .rosterItem.active{border-color:var(--accent)}
  .rosterItem .sw{
    width:11px;height:11px;border-radius:50%;flex:0 0 auto;background:var(--muted-2);
  }
  .rosterItem.active .sw{background:var(--accent);box-shadow:0 0 8px rgba(34,211,166,.6)}
  .rosterItem .num{
    width:28px;height:28px;border-radius:8px;background:var(--bg);color:var(--chalk);
    font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;
  }
  .rosterItem .name{flex:1;font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rosterItem .min{
    font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--chalk);flex:0 0 auto;
  }
  .rosterItem .badge{
    font-size:9px;font-weight:800;padding:2px 6px;border-radius:5px;flex:0 0 auto;letter-spacing:.5px;
  }
  .rosterItem .badge.ok{background:#22D3A622;color:var(--accent)}
  .rosterItem .badge.warn{background:#FBBF2422;color:var(--amber)}
  .rosterItem .badge.low{background:#EF444422;color:var(--rec)}
  .rosterItem .del{
    background:none;border:none;color:var(--muted-2);font-size:16px;cursor:pointer;
    flex:0 0 auto;padding:4px 8px;
  }
  .rosterItem .del:active{color:var(--rec)}
  .addPlayerRow{display:flex;gap:8px;margin:10px 0}
  .addPlayerRow input{flex:1;margin:0}
  .addPlayerRow button{
    border:none;background:var(--accent);color:#0E1416;border-radius:12px;
    padding:0 16px;font-weight:800;font-size:13px;cursor:pointer;flex:0 0 auto;
  }
  .fairnessHint{
    background:#22D3A611;border:1px solid #22D3A633;border-radius:12px;padding:10px 12px;
    margin:10px 0;font-size:12px;color:var(--accent);line-height:1.4;
  }
  .fairnessHint.warn{background:#FBBF2411;border-color:#FBBF2433;color:var(--amber)}

  /* ================= AUTH (login/registro/recuperar) ================= */
  #authModal{
    position:fixed;inset:0;z-index:110;background:rgba(8,12,14,.92);backdrop-filter:blur(8px);
    display:none;align-items:center;justify-content:center;padding:20px;
  }
  #authModal.show{display:flex}
  #authModal .card{
    background:var(--panel);border:1px solid var(--line);border-radius:22px;
    padding:28px 22px;max-width:360px;width:100%;
    box-shadow:0 24px 60px rgba(0,0,0,.6);
  }
  #authModal .em{
    width:60px;height:60px;border-radius:16px;margin:0 auto 14px;
    background:linear-gradient(135deg,var(--accent),#0F9D77);
    display:flex;align-items:center;justify-content:center;font-size:28px;
    box-shadow:0 8px 24px rgba(34,211,166,.35);
  }
  #authModal h3{font-size:19px;font-weight:800;letter-spacing:-.3px;text-align:center;margin-bottom:4px}
  #authModal .sub{font-size:12.5px;color:var(--muted);text-align:center;margin-bottom:18px;line-height:1.4}
  #authForm{display:flex;flex-direction:column;gap:10px}
  #authForm .field{position:relative}
  #authForm .field small{
    position:absolute;left:14px;top:8px;font-size:9.5px;color:var(--muted-2);
    letter-spacing:.5px;text-transform:uppercase;font-weight:700;pointer-events:none;
  }
  #authForm input{
    width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:12px;
    padding:22px 14px 8px;color:var(--chalk);font-size:14px;outline:none;font-family:inherit;
  }
  #authForm input:focus{border-color:var(--accent)}
  #authForm button[type=submit]{
    border:none;border-radius:12px;padding:14px;font-size:13px;font-weight:800;
    background:var(--accent);color:#0E1416;cursor:pointer;margin-top:6px;letter-spacing:.3px;
  }
  #authForm button[type=submit]:active{transform:scale(.98)}
  .authSwitch{text-align:center;font-size:12px;color:var(--muted);margin-top:14px}
  .authSwitch a{color:var(--accent);font-weight:700;text-decoration:none;cursor:pointer}
  .authLinks{display:flex;justify-content:space-between;margin-top:10px;font-size:11.5px}
  .authLinks a{color:var(--muted);text-decoration:none;cursor:pointer}
  .authLinks a:hover{color:var(--chalk)}
  .authError{
    background:#EF444411;border:1px solid #EF444433;border-radius:10px;
    padding:9px 12px;font-size:12px;color:var(--rec);margin-bottom:8px;display:none;
  }
  .authError.show{display:block}
  .authSuccess{
    background:#22D3A611;border:1px solid #22D3A633;border-radius:10px;
    padding:9px 12px;font-size:12px;color:var(--accent);margin-bottom:8px;display:none;
  }
  .authSuccess.show{display:block}
  .userPill{
    display:flex;align-items:center;gap:6px;background:var(--panel2);border:1px solid var(--line);
    border-radius:999px;padding:5px 10px 5px 7px;cursor:pointer;
  }
  .userPill .av{
    width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0F9D77);
    color:#0E1416;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;
  }
  .userPill .un{font-size:11.5px;font-weight:600;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .userMenu{
    position:fixed;top:60px;right:14px;z-index:80;background:var(--panel2);
    border:1px solid var(--line);border-radius:12px;padding:6px;min-width:160px;
    box-shadow:var(--shadow-float);display:none;
  }
  .userMenu.show{display:block}
  .userMenu button{
    display:flex;width:100%;align-items:center;gap:9px;background:none;border:none;
    color:var(--chalk);font-size:13px;font-weight:600;padding:9px 10px;border-radius:8px;cursor:pointer;
    text-align:left;
  }
  .userMenu button:active{background:var(--panel)}
  .userMenu button.danger{color:var(--rec)}

  /* ================= PRESENTACIÓN ================= */
  /* Pantalla completa sin botones, para proyectar en vestuario */
  body.presenting header,
  body.presenting #controls,
  body.presenting #rail,
  body.presenting #drawBar,
  body.presenting #undoFloat,
  body.presenting #statusBar{display:none !important}
  body.presenting #fieldWrap{padding:8px}
  body.presenting #fieldCanvas{box-shadow:none;border-radius:8px}
  body.presenting #presentExit{
    position:fixed;top:max(14px,env(safe-area-inset-top));right:14px;z-index:200;
    width:44px;height:44px;border-radius:50%;border:none;
    background:rgba(0,0,0,.45);color:#fff;font-size:20px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);
    opacity:.5;transition:opacity .2s;
  }
  body.presenting #presentExit:active{opacity:1;transform:scale(.92)}
  body.presenting #presentExit:hover{opacity:1}
  #presentExit{display:none}

  /* ================= FOCUS MODE (durante play/pause) ================= */
  /* Atenua UI para que la cancha sea la protagonista, como apps premium */
  body.focus header,
  body.focus #rail{opacity:.25;transition:opacity .3s}
  body.focus #scrubRow,
  body.focus #btnRow{opacity:.55;transition:opacity .3s}
  body.focus #fieldWrap:hover ~ header,
  body.focus #fieldWrap:hover ~ #rail{opacity:1}
  /* al tocar cualquier zona de UI, vuelve a opacidad completa */
  body.focus header:hover,
  body.focus #rail:hover,
  body.focus #controls:hover{opacity:1 !important}
</style>
</head>
<body>

<header>
  <div class="hrow">
    <div class="logo">
      <span class="b">⚽</span>
      <h1>Pizarra <em>Pro</em></h1>
      <span class="pro-badge free" id="planBadge">FREE</span>
    </div>
    <div id="userPill" class="userPill" style="display:none">
      <div class="av" id="userAvatar">?</div>
      <span class="un" id="userName">Usuario</span>
    </div>
    <button class="iconBtn" id="hLogin" title="Iniciar sesión">👤</button>
    <button class="iconBtn" id="hHome" title="Inicio (Landing)">🏠</button>
    <button class="iconBtn" id="hUpgrade" title="Mejorar a Pro">👑</button>
    <button class="iconBtn" id="hMinutes" title="Control de minutos (inferiores)">⏱️</button>
    <button class="iconBtn" id="hTemplates" title="Plantillas de jugadas">🎴</button>
    <button class="iconBtn" id="hShare" title="Compartir jugada (PRO)">🔗</button>
    <button class="iconBtn" id="hExport" title="Exportar a GIF">🎬</button>
    <button class="iconBtn" id="hPlays" title="Mis jugadas">📂</button>
    <button class="iconBtn" id="hHelp" title="Ayuda">❔</button>
  </div>
  <div class="seg" id="gameSeg">
    <button data-g="5" class="on">Fútbol 5</button>
    <button data-g="8">Fútbol 8</button>
    <button data-g="11">Fútbol 11</button>
  </div>
</header>

<div id="statusBar">
  <div class="pill rec" id="pRec"><i></i>GRABANDO · <span id="recTime">0.0s</span></div>
  <div class="pill play" id="pPlay">▶ REPRODUCIENDO</div>
  <div class="pill pause" id="pPause">⏸ PAUSADO · arrastrá la barra</div>
  <div class="pill ai" id="pAI">✨ VISTA PREVIA IA</div>
</div>

<div id="fieldWrap">
  <canvas id="fieldCanvas"></canvas>
  <button id="undoFloat" class="floatBtn">↶ Deshacer</button>
  <div id="rail">
    <button class="railBtn" id="rPresent" title="Modo presentación (vestuario)">🖥️</button>
    <button class="railBtn" id="rDraw" title="Dibujar flechas">✏️</button>
    <button class="railBtn" id="rForm" title="Formaciones">📐</button>
    <button class="railBtn" id="rTeams" title="Equipos">👥</button>
    <button class="railBtn" id="rAI" title="IA">✨</button>
  </div>
  <div id="drawBar">
    <button class="dBtn col on" id="dWhite" style="background:#f3f6f1"></button>
    <button class="dBtn col" id="dAmber" style="background:#ffb020"></button>
    <button class="dBtn" id="dUndo" title="Deshacer">↶</button>
    <button class="dBtn" id="dClear" title="Borrar todo">🗑</button>
    <button class="dBtn" id="dExit" title="Listo">✓</button>
  </div>
</div>

<div id="controls">
  <div id="scrubRow">
    <button id="chipLoop" title="Repetir en bucle">🔁</button>
    <button id="chipSpeed">⏱ <span id="speedLabel">1x</span></button>
    <span class="t" id="tCur">0.0s</span>
    <input type="range" id="scrub" min="0" max="1000" value="0" disabled>
    <span class="t" id="tTot">0.0s</span>
  </div>
  <div id="btnRow">
    <button class="ctl" id="bRec"><span class="ico">⏺</span><span id="bRecL">Grabar</span></button>
    <button class="ctl primary" id="bPlay" disabled><span class="ico">▶</span><span id="bPlayL">Reproducir</span></button>
    <button class="ctl" id="bStop" disabled><span class="ico">⏹</span>Detener</button>
    <button class="ctl" id="bReset"><span class="ico">↺</span>Limpiar</button>
    <button class="ctl" id="bSave" disabled><span class="ico">💾</span>Guardar</button>
  </div>
  <div id="aiBar">
    <button class="pillBtn no" id="aiNo">✕</button>
    <div class="segMini">
      <button id="aiSeeOrig">Tu jugada</button>
      <button id="aiSeeAI" class="on">Con IA</button>
    </div>
    <button class="pillBtn no" id="aiReplay">↻</button>
    <button class="pillBtn ok" id="aiYes">✓ Aplicar</button>
  </div>
</div>

<!-- ============ SHEETS ============ -->
<div id="sheetBg"></div>

<div class="sheet" id="shSpeed">
  <div class="grab"></div><h2>VELOCIDAD DE REPRODUCCIÓN</h2>
  <div class="body" id="speedList"></div>
</div>

<div class="sheet" id="shTeams">
  <div class="grab"></div><h2>EQUIPOS</h2>
  <div class="body">
    <div class="teamRow">
      <span class="sw" style="background:var(--blue)"></span><b>Azul</b>
      <button class="stepBtn" id="t1m">−</button><span class="countN" id="t1n">5</span><button class="stepBtn" id="t1p">+</button>
    </div>
    <div class="teamRow">
      <span class="sw" style="background:var(--red)"></span><b>Rojo</b>
      <button class="stepBtn" id="t2m">−</button><span class="countN" id="t2n">5</span><button class="stepBtn" id="t2p">+</button>
    </div>
    <p class="hint">Tocá dos veces a un jugador en la cancha para ponerle nombre y número.</p>
    <button class="bigBtn" id="teamsApply">APLICAR</button>
  </div>
</div>

<div class="sheet" id="shForm">
  <div class="grab"></div><h2>FORMACIONES</h2>
  <div class="body">
    <div class="teamTabs">
      <button class="teamTab on" id="ftBlue"><span class="sw" style="background:var(--blue)"></span>Azul</button>
      <button class="teamTab" id="ftRed"><span class="sw" style="background:var(--red)"></span>Rojo</button>
    </div>
    <div class="secTitle" id="formModeLbl">FÚTBOL 5</div>
    <div class="chips" id="formChips"></div>
    <p class="hint" id="formHint"></p>
  </div>
</div>

<div class="sheet" id="shAI">
  <div class="grab"></div><h2>✨ ASISTENTE TÁCTICO IA</h2>
  <div class="body">
    <div class="secTitle">EQUIPO QUE ATACA</div>
    <div class="chips" id="attChips" style="margin-bottom:10px"></div>

    <div class="secTitle">ESTILO DE JUEGO</div>
    <div class="chips" id="styleChips" style="margin-bottom:14px"></div>

    <div id="aiHasPlay">
      <div class="opt" id="aiComplete" style="border-color:var(--violet)">
        <span class="ic" style="background:#9d6bff22">🧠</span>
        <span class="tx"><b>Completar mi jugada</b>
        <small>Mantiene exactamente lo que grabaste y la IA mueve al resto: desmarques de tus compañeros, presión y coberturas del rival, arqueros que se acomodan.</small></span>
      </div>
    </div>
    <div id="aiNoPlay" class="empty" style="display:none">
      Todavía no grabaste nada.<br>Grabá una jugada moviendo la pelota y 2 o 3 jugadores clave… la IA hace el resto.
    </div>

    <div class="secTitle">O EMPEZÁ DESDE CERO</div>
    <div class="opt" id="aiDemo">
      <span class="ic" style="background:#ffb02022">🎲</span>
      <span class="tx"><b>Generar jugada de ejemplo</b>
      <small>Crea un ataque completo según el estilo elegido, listo para ver, editar y guardar.</small></span>
    </div>
    <p class="hint">Después de la vista previa podés comparar "Tu jugada" vs "Con IA" antes de aplicar.</p>
  </div>
</div>

<div class="sheet" id="shSave">
  <div class="grab"></div><h2>GUARDAR JUGADA</h2>
  <div class="body">
    <input type="text" id="playName" placeholder="Ej: Córner al primer palo" maxlength="40">
    <button class="bigBtn" id="saveOk">GUARDAR</button>
    <p class="hint" style="margin-top:8px">Quedan guardadas en este dispositivo. Cerrá y abrí la app y siguen ahí.</p>
  </div>
</div>

<div class="sheet" id="shPlays">
  <div class="grab"></div><h2>MIS JUGADAS</h2>
  <div class="body" id="playsList"></div>
</div>

<div class="sheet" id="shPlayer">
  <div class="grab"></div><h2>EDITAR JUGADOR</h2>
  <div class="body">
    <div id="plPhotoWrap" style="text-align:center;margin-bottom:12px">
      <label for="plPhoto" style="cursor:pointer;display:inline-block">
        <div id="plPhotoPreview" style="width:72px;height:72px;border-radius:50%;background:var(--panel2);border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 6px;overflow:hidden;background-size:cover;background-position:center">👤</div>
        <small style="color:var(--accent);font-weight:700;font-size:11px">📷 Tocá para subir foto</small>
      </label>
      <input type="file" id="plPhoto" accept="image/*" style="display:none">
      <button id="plPhotoDel" style="display:none;background:none;border:none;color:var(--rec);font-size:11px;cursor:pointer;margin-top:4px;font-weight:600">Quitar foto</button>
    </div>
    <div class="row2">
      <input type="text" id="plName" placeholder="Nombre (ej: Messi)" maxlength="14">
      <input type="number" id="plNum" placeholder="N°" min="0" max="99" style="max-width:90px">
    </div>
    <button class="bigBtn" id="plOk">LISTO</button>
  </div>
</div>

<div class="sheet" id="shPlans">
  <div class="grab"></div><h2>✨ PASÁ A PRO</h2>
  <div class="body">
    <p class="hint" style="text-align:left;padding:0 4px 14px">Desbloqueá la IA ilimitada, exportación a video y biblioteca sin límite. Cancelás cuando quieras.</p>

    <div class="planCard popular sel" data-plan="pro-yearly">
      <div class="ph">
        <span class="pn">Pro Anual</span>
        <span class="pp">$2.499<small>/año</small></span>
      </div>
      <div class="pd">Equivale a $208/mes. Ahorrás 58% vs el mensual.</div>
      <div class="ps">🚀 7 días gratis · después te cobramos</div>
    </div>

    <div class="planCard" data-plan="pro-monthly">
      <div class="ph">
        <span class="pn">Pro Mensual</span>
        <span class="pp">$499<small>/mes</small></span>
      </div>
      <div class="pd">Flexible. Ideal para probar una temporada.</div>
    </div>

    <div class="planCard" data-plan="club">
      <div class="ph">
        <span class="pn">Club / Escuela</span>
        <span class="pp">$199<small>/año</small></span>
      </div>
      <div class="pd">Hasta 5 entrenadores + biblioteca compartida. Para academias y clubes.</div>
    </div>

    <div class="secTitle" style="margin-top:18px">CON PRO DESBLOQUEÁS</div>
    <ul class="featList">
      <li>IA táctica ilimitada (simula al rival)</li>
      <li>Exportar jugadas a video/GIF</li>
      <li>Jugadas guardadas ilimitadas</li>
      <li>Todas las formaciones (40+)</li>
      <li>Compartir jugada por link con tu plantel</li>
      <li>Multi-equipo (hasta 3)</li>
      <li>Sin publicidad</li>
    </ul>
    <div class="secTitle">EN FREE QUEDÁ</div>
    <ul class="featList">
      <li class="locked">Pizarra completa + grabación</li>
      <li class="locked">3 jugadas guardadas</li>
      <li class="locked">1 jugada IA por día</li>
      <li class="locked">Exportar imagen estática</li>
    </ul>

    <button class="bigBtn" id="plansCta" style="margin-top:14px">PROBAR 7 DÍAS GRATIS</button>
    <p class="hint" style="margin-top:8px">Podés cancelar cuando quieras. Cobramos cuando termina el trial.</p>
  </div>
</div>

<div class="sheet" id="shMinutes">
  <div class="grab"></div><h2>⏱️ CONTROL DE MINUTOS</h2>
  <div class="body" id="minutesBody"></div>
</div>

<div class="sheet" id="shTemplates">
  <div class="grab"></div><h2>🎴 PLANTILLAS DE JUGADAS</h2>
  <div class="body" id="templatesList">
    <p class="hint" style="text-align:left;padding:0 4px 14px">Cargá una jugada lista para ver, editar o guardar. Ideal para arrancar rápido.</p>
  </div>
</div>

<div id="authModal">
  <div class="card">
    <div class="em">⚽</div>
    <h3 id="authTitle">Iniciar sesión</h3>
    <p class="sub" id="authSub">Entrá para guardar tus jugadas en la nube y sincronizar entre dispositivos.</p>
    <div class="authError" id="authError"></div>
    <div class="authSuccess" id="authSuccess"></div>
    <form id="authForm" autocomplete="on">
      <div id="nameField" class="field" style="display:none">
        <small>Nombre</small>
        <input type="text" id="authName" placeholder="Tu nombre" maxlength="30" autocomplete="name">
      </div>
      <div class="field">
        <small>Email</small>
        <input type="email" id="authEmail" placeholder="tu@email.com" required autocomplete="email">
      </div>
      <div id="passField" class="field">
        <small>Contraseña</small>
        <input type="password" id="authPass" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="current-password">
      </div>
      <button type="submit" id="authSubmit">ENTRAR</button>
    </form>
    <p class="authSwitch" id="authSwitch">
      ¿No tenés cuenta? <a id="authSwitchLink">Registrate gratis</a>
    </p>
    <div class="authLinks" id="authLinks">
      <a id="authForgot">¿Olvidaste tu contraseña?</a>
    </div>
  </div>
</div>

<div class="userMenu" id="userMenu">
  <button id="umPlays">📂 Mis jugadas</button>
  <button id="umUpgrade">👑 Mi plan</button>
  <button id="umLogout" class="danger">🚪 Cerrar sesión</button>
</div>

<div id="toast"></div>
<button id="presentExit" title="Salir de presentación">✕</button>

<div id="onboard">
  <div class="card">
    <div class="em">⚽</div>
    <h3>Pizarra Pro</h3>
    <p class="sub">Táctica de fútbol con IA. Dibujá, animá y dejá que la IA complete la jugada.</p>
    <div class="dots"><span class="on"></span><span></span><span></span></div>
    <ol>
      <li><span class="n">1</span><span>Elegí <b>Fútbol 5, 8 u 11</b>. <b>Doble-tap</b> sobre un jugador → la pelota vuela a su pie. <b>Mantener presionado</b> → editarlo.</span></li>
      <li><span class="n">2</span><span><b>Grabar</b> → mové pelota y jugadores → <b>IA → Completar</b>: el resto se mueve solo.</span></li>
      <li><span class="n">3</span><span>Reproducí, dibujá flechas y guardá. ¿Dudas? Tocá <b>❔</b> cuando quieras.</span></li>
    </ol>
    <button class="bigBtn" id="obOk">EMPEZAR</button>
  </div>
</div>

<script>
'use strict';
/* ============================================================
   PIZARRA PRO v2
   - Modos Fútbol 5 / 8 / 11 con formaciones reales
   - Grabación con tiempo real + reproducción interpolada (fluida)
   - IA "completar jugada": respeta lo grabado y mueve al resto
   - Dibujo de flechas, edición de jugadores, jugadas guardadas
============================================================ */

// ---------------- Estado ----------------
const S = {
  mode:'idle',            // idle|rec|play|pause
  game:5,                 // 5|8|11
  speed:1,
  team1:5, team2:5,
  form1:'1-2-1', form2:'1-2-1',
  players:[],             // {id,team,num,name,gk,ball,x,y}
  tracks:{}, duration:0,
  recStart:0, playT:0, lastFrame:0,
  dragging:null,
  carrier:null,           // id del jugador que lleva la pelota
  fx:[], fxLoop:false, curFx:null, // estelas en vivo al mover
  drawings:[],            // {color, pts:[{x,y}]}
  drawMode:false, drawColor:'#f3f6f1', curStroke:null,
  preview:null,           // {tracks, duration}
  prevShow:'ai',
  aiStyle:'balanced',
  attTeam:'auto',
  saved:[],
  editing:null,
  lastTap:{t:0,id:null},
  loop:false,
  recHistory:[],
  plan:'free',            // free | pro
  aiUsedToday:0,
  aiDate:'',
};

const SPEEDS=[
  {v:.5,n:'Lento',d:'Para analizar detalle por detalle',i:'🐢'},
  {v:1,n:'Normal',d:'Velocidad real de la grabación',i:'▶️'},
  {v:2,n:'Rápido',d:'El doble de velocidad',i:'⚡'},
  {v:4,n:'Muy rápido',d:'Repaso veloz de toda la jugada',i:'🚀'},
  {v:8,n:'Relámpago',d:'Repasá 5 jugadas en segundos',i:'⚡⚡'},
];

const STYLES=[
  {id:'balanced', n:'Equilibrado', i:'⚖️'},
  {id:'attack',   n:'Ofensivo',    i:'🔥'},
  {id:'wings',    n:'Por bandas',  i:'↔️'},
  {id:'defense',  n:'Defensivo',   i:'🛡️'},
  {id:'counter',  n:'Contraataque', i:'⚡'},
  {id:'press',    n:'Presión alta', i:'🎯'},
  {id:'buildup',  n:'Salida arco',  i:'🥅'},
];

const FORMATIONS={
  5:['1-2-1','2-2','1-1-2','3-1'],
  8:['3-3-1','2-3-2','3-2-2','2-4-1','3-1-3'],
  11:['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2','3-4-3'],
};
const DEFAULT_FORM={5:'1-2-1',8:'3-3-1',11:'4-3-3'};

// ---------------- Canvas ----------------
const cv=document.getElementById('fieldCanvas');
const ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;

function resize(){
  const wrap=document.getElementById('fieldWrap');
  const aw=wrap.clientWidth-18, ah=wrap.clientHeight-12;
  const ratio = S.game===5 ? 0.72 : S.game===8 ? 0.68 : 0.64; // F5 más "cuadrada"
  let h=ah,w=h*ratio;
  if(w>aw){w=aw;h=w/ratio}
  DPR=Math.min(window.devicePixelRatio||1,2);
  cv.width=w*DPR;cv.height=h*DPR;
  cv.style.width=w+'px';cv.style.height=h+'px';
  W=w;H=h;ctx.setTransform(DPR,0,0,DPR,0,0);
  draw();
}
addEventListener('resize',resize);

// ---------------- Formaciones / jugadores ----------------
function parseForm(code,count){
  // code '4-3-3' -> filas atrás→adelante. válida si suma+arquero == count
  const rows=code.split('-').map(Number);
  if(rows.reduce((a,b)=>a+b,0)+1!==count) return null;
  return rows;
}
function formationPositions(code,count,isBlue){
  let rows=parseForm(code,count);
  if(!rows){ // genérica
    const n=count-1, per=Math.ceil(n/3);
    rows=[];let left=n;
    while(left>0){rows.push(Math.min(per,left));left-=per}
  }
  const pos=[[0.5,0.93]]; // arquero
  // todos en campo propio: la línea más adelantada queda detrás de la mitad
  const yBack=0.82, yFront=S.game===5?0.62:0.57;
  rows.forEach((cnt,r)=>{
    const y= rows.length===1? (yBack+yFront)/2 : yBack-(yBack-yFront)*r/(rows.length-1);
    for(let j=0;j<cnt;j++){
      const x=(j+1)/(cnt+1);
      pos.push([0.5+(x-0.5)*0.92, y]);
    }
  });
  return isBlue?pos:pos.map(([x,y])=>[1-x,1-y]);
}

function buildPlayers(keepMeta){
  const meta={};
  if(keepMeta) S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  S.players=[];
  const f1=formationPositions(S.form1,S.team1,true);
  for(let i=0;i<S.team1;i++){
    const id='b'+i;
    S.players.push({id,team:'blue',num:meta[id]?.num??(i+1),name:meta[id]?.name||'',photo:meta[id]?.photo||null,gk:i===0,x:f1[i][0],y:f1[i][1]});
  }
  const f2=formationPositions(S.form2,S.team2,false);
  for(let i=0;i<S.team2;i++){
    const id='r'+i;
    S.players.push({id,team:'red',num:meta[id]?.num??(i+1),name:meta[id]?.name||'',photo:meta[id]?.photo||null,gk:i===0,x:f2[i][0],y:f2[i][1]});
  }
  S.players.push({id:'ball',team:'ball',ball:true,num:0,name:'',gk:false,x:.5,y:.5});
}

function applyFormation(team,code){
  if(team==='blue')S.form1=code; else S.form2=code;
  const count=team==='blue'?S.team1:S.team2;
  const f=formationPositions(code,count,team==='blue');
  let i=0;
  S.players.forEach(p=>{if(p.team===team){p.x=f[i][0];p.y=f[i][1];i++}});
  clearPlay(true);
  draw();
}

// ---------------- Dibujo del campo ----------------
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function draw(){
  ctx.clearRect(0,0,W,H);
  drawPitch();
  drawStrokes();
  drawTrails();
  for(const p of S.players){if(!p.ball)drawPlayer(p)}
  const b=S.players.find(p=>p.ball); if(b)drawBall(b);
}
function L(a,b,c,d){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke()}
function C(x,y,r,f){ctx.beginPath();ctx.arc(x,y,r,0,7);f?ctx.fill():ctx.stroke()}

function drawPitch(){
  // césped tipo broadcast: rayas de corte diagonales visibles + degradado sutil
  const stripes=S.game===11?10:S.game===8?8:6;
  // fondo base verde profundo
  ctx.fillStyle='#1A5334';
  ctx.fillRect(0,0,W,H);
  // rayas de corte (alternando tonos, horizontales, tipo cancha de TV)
  for(let i=0;i<stripes;i++){
    ctx.fillStyle=i%2?'#1E5E3A':'#18502E';
    ctx.fillRect(0,i*H/stripes,W,H/stripes+1);
  }
  // degradado radial sutil (centro más iluminado, bordes más oscuros = efecto stadium)
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.15,W/2,H/2,H*0.7);
  vg.addColorStop(0,'rgba(255,255,255,.06)');
  vg.addColorStop(0.6,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,.35)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);

  // líneas blancas nítidas tipo broadcast
  ctx.strokeStyle='rgba(242,244,243,.92)';
  ctx.lineWidth=Math.max(1.5,W*0.0045);
  const m=W*0.045;
  ctx.strokeRect(m,m,W-2*m,H-2*m);
  L(m,H/2,W-m,H/2);
  C(W/2,H/2,W*(S.game===5?0.16:0.13),false);
  ctx.fillStyle='rgba(242,244,243,.92)';C(W/2,H/2,3,true);

  // áreas (proporciones por modalidad)
  const big= S.game===5?{w:.62,h:.16}: S.game===8?{w:.56,h:.15}:{w:.52,h:.14};
  const sm = S.game===5?{w:.30,h:.06}:{w:.26,h:.058};
  const bw=W*big.w,bh=H*big.h,sw=W*sm.w,sh=H*sm.h;
  ctx.strokeRect(W/2-bw/2,m,bw,bh); ctx.strokeRect(W/2-sw/2,m,sw,sh);
  ctx.strokeRect(W/2-bw/2,H-m-bh,bw,bh); ctx.strokeRect(W/2-sw/2,H-m-sh,sw,sh);
  ctx.fillStyle='rgba(242,244,243,.92)';
  C(W/2,m+bh*0.72,3,true);C(W/2,H-m-bh*0.72,3,true);
  // semicírculo del área (8 y 11)
  if(S.game!==5){
    ctx.beginPath();ctx.arc(W/2,m+bh,W*0.10,0.25*Math.PI,0.75*Math.PI);ctx.stroke();
    ctx.beginPath();ctx.arc(W/2,H-m-bh,W*0.10,1.25*Math.PI,1.75*Math.PI);ctx.stroke();
  }
  // arcos
  ctx.lineWidth=Math.max(3,W*0.008);
  const gw=sw*0.8;
  L(W/2-gw/2,m,W/2+gw/2,m);
  L(W/2-gw/2,H-m,W/2+gw/2,H-m);
}

function playerR(){
  const base=S.game===11?0.036:S.game===8?0.041:0.047;
  return Math.max(12,W*base);
}
function drawPlayer(p){
  const r=playerR();
  let x=p.x*W, y=p.y*H;
  // dinamismo: bob vertical mientras se mueve (simula carrera)
  const moving=(S.mode==='play'||S.mode==='pause')&&p.spd>0.0008;
  if(moving){y+=Math.sin(S.playT*0.018+p.id.length)*r*0.09}
  // color base del equipo (arquero usa ámbar para distinguirse)
  const isGK=p.gk;
  const baseCol=isGK?'#FBBF24':(p.team==='blue'?'#3B82F6':'#EF4444');
  const darkCol=isGK?'#B45309':(p.team==='blue'?'#1E40AF':'#991B1B');
  // sombra real marcada (contacto con el piso) — ficha sobre la mesa
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.5)';
  ctx.beginPath();ctx.ellipse(x,y+r*0.75,r*0.85,r*0.32,0,0,7);ctx.fill();
  ctx.restore();
  // disco: si tiene foto, dibujar foto enmascarada en círculo; si no, gradiente 3D
  if(p.photo){
    // fondo del color del equipo detrás (por si la foto no cubre todo)
    ctx.fillStyle=baseCol;
    ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    // foto enmascarada en círculo
    ctx.save();
    ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();
    try{
      if(!p._img)p._img=new Image();
      if(p._img.src!==p.photo)p._img.src=p.photo;
      if(p._img.complete&&p._img.naturalWidth>0){
        // dibujar cubriendo el círculo (cover)
        const iw=p._img.naturalWidth,ih=p._img.naturalHeight;
        const sc=Math.max(r*2/iw,r*2/ih);
        const dw=iw*sc,dh=ih*sc;
        ctx.drawImage(p._img,x-dw/2,y-dh/2,dw,dh);
      }
    }catch(e){}
    ctx.restore();
    // borde del color del equipo (para distinguir de qué equipo es)
    ctx.lineWidth=2.5;
    ctx.strokeStyle=baseCol;
    ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();
  } else {
    // sin foto: gradiente radial 3D (oscuro abajo, claro arriba)
    const g=ctx.createRadialGradient(x-r*0.3,y-r*0.4,r*0.1,x,y,r);
    g.addColorStop(0,baseCol);
    g.addColorStop(0.7,baseCol);
    g.addColorStop(1,darkCol);
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    // borde fino oscuro (separa de la cancha, más sutil que blanco brillante)
    ctx.lineWidth=1;
    ctx.strokeStyle='rgba(0,0,0,.45)';
    ctx.stroke();
    // highlight superior brillante (volumen 3D)
    const hl=ctx.createRadialGradient(x-r*0.35,y-r*0.4,r*0.05,x-r*0.2,y-r*0.25,r*0.75);
    hl.addColorStop(0,'rgba(255,255,255,.55)');
    hl.addColorStop(0.6,'rgba(255,255,255,.08)');
    hl.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=hl;
    ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
  }
  // carrier: anillo blanco (tiene la pelota)
  if(S.carrier===p.id&&S.mode!=='play'&&S.mode!=='pause'){
    ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r+4,0,7);ctx.stroke()
  }
  // dragging: anillo acento
  if(S.dragging===p){ctx.strokeStyle='#22D3A6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r+5,0,7);ctx.stroke()}
  // dinamismo: indicador de dirección (flecha hacia donde se mueve)
  if(moving){
    const ang=Math.atan2(p.vy,p.vx);
    ctx.save();
    ctx.translate(x+Math.cos(ang)*r*1.15, y+Math.sin(ang)*r*1.15);
    ctx.rotate(ang);
    ctx.fillStyle=p.team==='blue'?'#93C5FD':'#FCA5A5';
    ctx.beginPath();
    ctx.moveTo(r*0.45,0);
    ctx.lineTo(-r*0.1,-r*0.28);
    ctx.lineTo(-r*0.1,r*0.28);
    ctx.closePath();ctx.fill();
    ctx.restore();
  }
  // número (tabular, peso 800, blanco con sombra sutil)
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.font=`800 ${r*0.92}px 'Inter',sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(p.gk&&!p.name?'A':p.num,x,y+2);
  ctx.fillStyle='#fff';
  ctx.fillText(p.gk&&!p.name?'A':p.num,x,y+1);
  // nombre debajo
  if(p.name){
    ctx.font=`700 ${Math.max(9,r*0.6)}px 'Inter',sans-serif`;
    ctx.fillStyle='rgba(255,255,255,.96)';
    ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.lineJoin='round';
    ctx.strokeText(p.name,x,y+r*1.75);
    ctx.fillText(p.name,x,y+r*1.75);
  }
}
function drawBall(b){
  const r=playerR()*0.58;
  let x=b.x*W, y=b.y*H;
  // dinamismo: bob sutil de la pelota mientras viaja
  const moving=(S.mode==='play'||S.mode==='pause')&&b.spd>0.0008;
  if(moving){y+=Math.sin(S.playT*0.025)*r*0.06}
  // sombra
  ctx.fillStyle='rgba(0,0,0,.4)';
  ctx.beginPath();ctx.ellipse(x,y+r*0.85,r*0.75,r*0.26,0,0,7);ctx.fill();
  // balón ámbar para alta visibilidad sobre verde
  const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,r*0.15,x,y,r);
  g.addColorStop(0,'#FDE68A');g.addColorStop(1,'#FBBF24');
  ctx.fillStyle=g;C(x,y,r,true);
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=1.2;C(x,y,r,false);
  // dinamismo: patrón rotante (spin de la pelota mientras viaja)
  const spin=(S.mode==='play'||S.mode==='pause')?S.playT*0.014:0;
  ctx.fillStyle='rgba(30,30,30,.7)';
  for(let i=0;i<5;i++){
    const a=i/5*6.283-1.57+spin;
    C(x+Math.cos(a)*r*0.55, y+Math.sin(a)*r*0.55, r*0.15, true);
  }
  C(x,y,r*0.28,true);
  if(S.dragging===b){ctx.strokeStyle='#22D3A6';ctx.lineWidth=3;C(x,y,r+5,false)}
}
function shade(hex,pct){
  const n=parseInt(hex.slice(1),16),a=Math.round(2.55*pct);
  const R=Math.min(255,Math.max(0,(n>>16)+a)),G=Math.min(255,Math.max(0,(n>>8&255)+a)),B=Math.min(255,Math.max(0,(n&255)+a));
  return `rgb(${R},${G},${B})`;
}

// estelas (en grabación se ve todo lo grabado; al reproducir, hasta el momento actual)
function drawTrails(){
  const tr=activeTracks();
  if(tr&&S.mode!=='idle'){
    const upTo=S.mode==='rec'?Infinity:S.playT;
    if(upTo>0)for(const id in tr){
      const kf=tr[id];if(!kf||kf.length<2)continue;
      if(pathLen(kf)<0.05)continue; // sólo los que se mueven
      const p=S.players.find(q=>q.id===id);if(!p)continue;
      ctx.strokeStyle=p.ball?'rgba(251,191,36,.65)':p.team==='blue'?'rgba(59,130,246,.5)':'rgba(239,68,68,.5)';
      ctx.lineWidth=2.4;ctx.setLineDash(p.ball?[7,7]:[]);
      ctx.beginPath();let st=false;
      for(const k of kf){
        if(k.t>upTo)break;
        const x=k.x*W,y=k.y*H;
        st?ctx.lineTo(x,y):(ctx.moveTo(x,y),st=true);
      }
      ctx.stroke();ctx.setLineDash([]);
    }
  }
  drawFx();
}

// estelas en vivo: al mover algo queda su recorrido unos segundos y se desvanece
const FXFADE=2400;
function pushFx(p){
  if(S.mode==='play')return;
  if(!S.curFx||S.curFx.id!==p.id){
    S.curFx={id:p.id,ball:!!p.ball,team:p.team,pts:[]};
    S.fx.push(S.curFx);
  }
  S.curFx.pts.push({x:p.x,y:p.y,t:performance.now()});
  ensureFxLoop();
}
function ensureFxLoop(){
  if(S.fxLoop)return;S.fxLoop=true;
  const step=()=>{
    const now=performance.now();
    S.fx=S.fx.filter(s=>s.pts.length&&now-s.pts[s.pts.length-1].t<FXFADE);
    if(!S.fx.length||S.mode==='play'){S.fxLoop=false;draw();return}
    draw();requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function drawFx(){
  if(!S.fx.length)return;
  const now=performance.now();
  for(const s of S.fx){
    ctx.lineWidth=3;ctx.lineCap='round';
    ctx.setLineDash(s.ball?[7,7]:[]);
    const col=s.ball?'251,191,36':s.team==='blue'?'59,130,246':'239,68,68';
    for(let i=1;i<s.pts.length;i++){
      const a=s.pts[i-1],b=s.pts[i];
      const al=Math.max(0,1-(now-b.t)/FXFADE)*0.8;
      if(al<=0)continue;
      ctx.strokeStyle=`rgba(${col},${al})`;
      ctx.beginPath();ctx.moveTo(a.x*W,a.y*H);ctx.lineTo(b.x*W,b.y*H);ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}
function pathLen(kf){let d=0;for(let i=1;i<kf.length;i++)d+=Math.hypot(kf[i].x-kf[i-1].x,kf[i].y-kf[i-1].y);return d}

// trazos del entrenador (flechas)
function drawStrokes(){
  const all=S.curStroke?[...S.drawings,S.curStroke]:S.drawings;
  for(const s of all){
    if(s.pts.length<2)continue;
    ctx.strokeStyle=s.color;ctx.lineWidth=3.2;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(s.pts[0].x*W,s.pts[0].y*H);
    for(let i=1;i<s.pts.length;i++)ctx.lineTo(s.pts[i].x*W,s.pts[i].y*H);
    ctx.stroke();
    // punta de flecha
    const n=s.pts.length,a=s.pts[Math.max(0,n-4)],b=s.pts[n-1];
    const ang=Math.atan2((b.y-a.y)*H,(b.x-a.x)*W),hl=11;
    ctx.fillStyle=s.color;ctx.beginPath();
    ctx.moveTo(b.x*W,b.y*H);
    ctx.lineTo(b.x*W-hl*Math.cos(ang-0.45),b.y*H-hl*Math.sin(ang-0.45));
    ctx.lineTo(b.x*W-hl*Math.cos(ang+0.45),b.y*H-hl*Math.sin(ang+0.45));
    ctx.closePath();ctx.fill();
  }
}

// ---------------- Input ----------------
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function ptr(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/W,y:(e.clientY-r.top)/H}}
function ballObj(){return S.players.find(p=>p.ball)}
function attachR(){return (playerR()*1.8)/W}
function nearestPlayer(x,y,r){
  let best=null,bd=r;
  for(const p of S.players){
    if(p.ball)continue;
    const d=Math.hypot(p.x-x,p.y-y);
    if(d<bd){bd=d;best=p}
  }
  return best;
}
// offset de la pelota respecto al jugador que la posee (en su propio campo de coordenadas 0..1)
// La pelota queda adelante del jugador, hacia el arco rival.
function ballAtFoot(pl){
  const dxN=0, dyN=playerR()*1.25/H*(pl.team==='blue'?-1:1);
  return{x:clamp(pl.x+dxN,0.02,0.98),y:clamp(pl.y+dyN,0.02,0.98)};
}
function attachBall(pl){
  if(!pl||pl.ball)return;
  const same=S.carrier===pl.id;
  S.carrier=pl.id;
  const b=ballObj(),o=ballAtFoot(pl);
  b.x=o.x;b.y=o.y;
  if(S.mode==='rec')addKey(b);
  if(!same)toast('⚽ La lleva '+(pl.team==='blue'?'Azul':'Rojo')+' '+(pl.name||pl.num));
  draw();
}
// radio de asignación de pelota al soltar o pisar (generoso: fácil con el dedo)
function attachR(){return (playerR()*2.4)/W}
function hit(pos){
  const b=ballObj();
  const rB=(playerR()*0.62)/W*2.6; // agarre generoso para la pelota
  const rP=playerR()/W*1.7;
  // si hay un jugador MUY cerca del toque, gana (edición)
  let best=null,bd=rP;
  for(const p of S.players){
    if(p.ball)continue;
    const d=Math.hypot(p.x-pos.x,p.y-pos.y);
    if(d<bd){best=p;bd=d}
  }
  const dB=Math.hypot(b.x-pos.x,b.y-pos.y);
  if(dB<rB){
    // tocás la pelota: si no hay dueño, o el toque es justo sobre ella (no sobre un jugador), la agarrás
    if(!best || dB<bd*0.8) return b;
  }
  return best;
}

let _longPressT=null,_lpStart=null;
function clearLongPress(){if(_longPressT){clearTimeout(_longPressT);_longPressT=null}}
cv.addEventListener('pointerdown',e=>{
  const pos=ptr(e);
  if(S.drawMode){
    S.curStroke={color:S.drawColor,pts:[pos]};
    cv.setPointerCapture(e.pointerId);draw();return;
  }
  if(S.mode==='play')return;
  const p=hit(pos);
  if(p){
    // doble-tap en jugador → pelota vuela a su pie (rápido, sin arrastrar)
    const now=performance.now();
    if(!p.ball&&S.lastTap.id===p.id&&now-S.lastTap.t<320){
      S.lastTap={t:0,id:null};
      clearLongPress();
      attachBall(p);
      // si está grabando, ya se registró el key en attachBall
      return;
    }
    S.lastTap={t:now,id:p.id};
    S.dragging=p;S.curFx=null;cv.setPointerCapture(e.pointerId);
    if(S.mode==='rec'){pushUndo();addKey(p)}
    // long-press (500ms sin moverse) → editar jugador
    _lpStart={x:pos.x,y:pos.y,id:p.id};
    clearLongPress();
    _longPressT=setTimeout(()=>{
      if(S.dragging===p){
        S.dragging=null;
        openPlayerEdit(p);
        draw();
      }
    },500);
    draw();
  }
});
cv.addEventListener('pointermove',e=>{
  const pos=ptr(e);
  if(S.drawMode&&S.curStroke){
    const lp=S.curStroke.pts[S.curStroke.pts.length-1];
    if(Math.hypot(pos.x-lp.x,pos.y-lp.y)>0.006)S.curStroke.pts.push(pos);
    draw();return;
  }
  // cancelar long-press si se mueve más de un umbral
  if(_lpStart&&Math.hypot(pos.x-_lpStart.x,pos.y-_lpStart.y)>0.012){clearLongPress();_lpStart=null}
  if(!S.dragging)return;
  const d=S.dragging;
  if(d.ball&&S.carrier)S.carrier=null; // tomar la pelota del pie = empieza un pase
  d.x=clamp(pos.x,0.02,0.98);
  d.y=clamp(pos.y,0.02,0.98);
  if(S.carrier===d.id){ // lleva la pelota pegada al pie (parent-child: SIEMPRE recalculada desde el jugador)
    const b=ballObj(),o=ballAtFoot(d);
    b.x=o.x;b.y=o.y;
    if(S.mode==='rec')addKey(b,true);
  } else if(!d.ball){
    // jugador moviéndose SIN la pelota: si la pisa (pelota suelta), la toma al instante
    const b=ballObj();
    if(Math.hypot(b.x-d.x,b.y-d.y)<attachR()*0.9 && S.mode!=='play'){
      attachBall(d);
    }
  }
  if(S.mode==='rec')addKey(d,true);
  else pushFx(d);
  draw();
});
function endPtr(){
  clearLongPress();_lpStart=null;
  if(S.drawMode&&S.curStroke){
    if(S.curStroke.pts.length>2)S.drawings.push(S.curStroke);
    S.curStroke=null;draw();return;
  }
  const d=S.dragging;
  if(d){
    if(d.ball){ // pelota soltada sobre un jugador → se la asignás (pase recibido)
      const tgt=nearestPlayer(d.x,d.y,attachR());
      if(tgt)attachBall(tgt);
    }else if(!S.carrier){ // jugador que pisa una pelota suelta, la toma
      const b=ballObj();
      if(Math.hypot(b.x-d.x,b.y-d.y)<attachR())attachBall(d);
    }
    if(S.mode==='rec'){
      addKey(d);
      if(S.carrier===d.id)addKey(ballObj());
    }
  }
  S.dragging=null;S.curFx=null;draw();
}
cv.addEventListener('pointerup',endPtr);
cv.addEventListener('pointercancel',endPtr);

// ---------------- Grabación ----------------
let lastKeyT={};
function addKey(p,thr){
  const t=performance.now()-S.recStart;
  if(thr&&lastKeyT[p.id]&&t-lastKeyT[p.id]<40)return;
  lastKeyT[p.id]=t;
  S.tracks[p.id].push({t,x:p.x,y:p.y});
  S.duration=Math.max(S.duration,t);
  document.getElementById('recTime').textContent=(t/1000).toFixed(1)+'s';
}
function startRec(){
  discardPreview(true);
  S.tracks={};S.duration=0;lastKeyT={};S.recHistory=[];
  S.recStart=performance.now();
  for(const p of S.players)S.tracks[p.id]=[{t:0,x:p.x,y:p.y}];
  setMode('rec');toast('⏺ Mové la pelota y tus jugadores clave');
}
function stopRec(){
  const t=performance.now()-S.recStart;
  S.duration=Math.max(S.duration,t,600);
  // Simplificar tracks con Douglas-Peucker: el arrastre del dedo deja 100+ puntos
  // con jitter; RDP los reduce a los 5-15 que importan, dejando una trayectoria
  // limpia que Catmull-Rom interpola suavemente.
  for(const id in S.tracks){
    const kf=simplifyTrack(S.tracks[id]);
    S.tracks[id]=kf;
  }
  for(const p of S.players){
    const kf=S.tracks[p.id],last=kf[kf.length-1];
    if(last.t<S.duration)kf.push({t:S.duration,x:last.x,y:last.y});
  }
  S.playT=0;setMode('idle');
  toast('Jugada grabada · '+(S.duration/1000).toFixed(1)+'s — probá ✨ IA');
}
// Ramer-Douglas-Peucker para keyframes temporales. ε en coordenadas 0..1.
function simplifyTrack(kf){
  if(kf.length<3)return kf.slice();
  const eps=0.012; // ~1.2% del ancho del campo
  const rdp=(s,e)=>{
    let dmax=0,idx=0;
    const a=kf[s],b=kf[e];
    for(let i=s+1;i<e;i++){
      const p=kf[i];
      // distancia perpendicular de p a la línea a-b
      const dx=b.x-a.x,dy=b.y-a.y;
      const len=Math.hypot(dx,dy)||1;
      const d=Math.abs(dy*p.x-dx*p.y+b.x*a.y-b.y*a.x)/len;
      if(d>dmax){dmax=d;idx=i}
    }
    if(dmax>eps){
      const left=rdp(s,idx),right=rdp(idx,e);
      return left.slice(0,-1).concat(right);
    }
    return [a,b];
  };
  return rdp(0,kf.length-1);
}

// ---------------- Reproducción ----------------
// Catmull-Rom CENTRIPETAL (α=0.5): la única variante que NO produce loops ni
// overshoot cuando los keyframes están a distancias desiguales (jugadores que
// frenan, cambian de ritmo). Yuksel 2011. Maneja puntos repetidos (evita NaN).
function catmullRom(p0,p1,p2,p3,u){
  const d2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy};
  let dt0=Math.pow(d2(p0,p1),0.25);
  let dt1=Math.pow(d2(p1,p2),0.25);
  let dt2=Math.pow(d2(p2,p3),0.25);
  // safety: puntos repetidos → división por cero. Usar vecino.
  if(dt1<1e-5)dt1=1;
  if(dt0<1e-5)dt0=dt1;
  if(dt2<1e-5)dt2=dt1;
  // tangentes en parametrización centripetal, reescaladas a [0,1]
  let t1x=(p1.x-p0.x)/dt0-(p2.x-p0.x)/(dt0+dt1)+(p2.x-p1.x)/dt1;
  let t1y=(p1.y-p0.y)/dt0-(p2.y-p0.y)/(dt0+dt1)+(p2.y-p1.y)/dt1;
  let t2x=(p2.x-p1.x)/dt1-(p3.x-p1.x)/(dt1+dt2)+(p3.x-p2.x)/dt2;
  let t2y=(p2.y-p1.y)/dt1-(p3.y-p1.y)/(dt1+dt2)+(p3.y-p2.y)/dt2;
  t1x*=dt1; t1y*=dt1; t2x*=dt1; t2y*=dt1;
  // polinomio cúbico p(u) = c0 + c1·u + c2·u² + c3·u³ con p(0)=p1, p(1)=p2
  const u2=u*u, u3=u2*u;
  const x=p1.x + t1x*u + (-3*p1.x+3*p2.x-2*t1x-t2x)*u2 + (2*p1.x-2*p2.x+t1x+t2x)*u3;
  const y=p1.y + t1y*u + (-3*p1.y+3*p2.y-2*t1y-t2y)*u2 + (2*p1.y-2*p2.y+t1y+t2y)*u3;
  return {x,y};
}
function posAt(kf,t){
  const n=kf.length;
  if(n===1||t<=kf[0].t)return kf[0];
  if(t>=kf[n-1].t)return kf[n-1];
  let i=1;while(kf[i].t<t)i++;
  const p1=kf[i-1],p2=kf[i];
  // extremos: extrapolar por reflexión para no perder tangente natural
  const p0=kf[i-2]?kf[i-2]:{x:2*p1.x-p2.x,y:2*p1.y-p2.y};
  const p3=kf[i+1]?kf[i+1]:{x:2*p2.x-p1.x,y:2*p2.y-p1.y};
  const u=(t-p1.t)/Math.max(1,p2.t-p1.t);
  const q=catmullRom(p0,p1,p2,p3,u);
  return{x:clamp(q.x,0.02,0.98),y:clamp(q.y,0.02,0.98)};
}
function activeTracks(){
  if(S.preview&&S.prevShow==='ai')return S.preview.tracks;
  return Object.keys(S.tracks).length?S.tracks:null;
}
function curDuration(){return S.preview&&S.prevShow==='ai'?S.preview.duration:S.duration}

// Easing temporal: los jugadores aceleran al arrancar y frenan al llegar.
// No es lineal — se siente natural, como un jugador real corriendo.
function easeInOutQuad(tn){
  return tn<0.5 ? 2*tn*tn : 1-2*(1-tn)*(1-tn);
}
function applyFrame(t, useEasing){
  const tr=activeTracks();if(!tr)return;
  const D=curDuration();
  // Mezclar 55% lineal + 45% eased: sutil pero se nota (acelera al inicio, frena al final)
  let tEff=t;
  if(useEasing && D>200){
    const tn=t/D;
    tEff=(0.55*tn + 0.45*easeInOutQuad(tn))*D;
  }
  const LOOK=60; // ms lookback para calcular velocidad
  for(const p of S.players){
    const kf=tr[p.id];
    if(kf&&kf.length){
      const q=posAt(kf,tEff);
      const qPrev=posAt(kf,Math.max(0,tEff-LOOK));
      p.prevX=p.x; p.prevY=p.y;
      p.x=q.x; p.y=q.y;
      p.vx=q.x-qPrev.x; p.vy=q.y-qPrev.y;
      p.spd=Math.hypot(p.vx,p.vy);
    }
  }
  draw();
  const sc=document.getElementById('scrub');
  const pct=D?t/D*1000:0; // la barra muestra tiempo lineal (natural al scrollear)
  sc.value=pct;sc.style.setProperty('--fill',(pct/10)+'%');
  document.getElementById('tCur').textContent=(t/1000).toFixed(1)+'s';
}
function loop(now){
  if(S.mode!=='play')return;
  const dt=now-S.lastFrame;S.lastFrame=now;
  S.playT+=dt*S.speed;
  const D=curDuration();
  if(S.playT>=D){
    if(S.loop){
      S.playT=0;applyFrame(0,true);requestAnimationFrame(loop);return;
    }
    S.playT=D;applyFrame(D,true);setMode('idle');
    document.getElementById('bPlayL').textContent='Repetir';
    return;
  }
  applyFrame(S.playT,true);
  requestAnimationFrame(loop);
}
function play(){
  if(!hasPlay())return;
  if(S.mode==='pause'){setMode('play');S.lastFrame=performance.now();requestAnimationFrame(loop);return}
  if(S.playT>=curDuration())S.playT=0;
  setMode('play');S.lastFrame=performance.now();requestAnimationFrame(loop);
}
const pause=()=>{if(S.mode==='play')setMode('pause')};
function stopPlay(){S.playT=0;applyFrame(0);setMode('idle')}
function hasPlay(){return curDuration()>0&&!!activeTracks()}

const scrub=document.getElementById('scrub');
scrub.addEventListener('input',()=>{
  if(!hasPlay())return;
  if(S.mode==='play')setMode('pause');
  S.playT=scrub.value/1000*curDuration();
  applyFrame(S.playT);
});

// ---------------- IA: completar jugada ----------------
const dirOf=team=>team==='blue'?-1:1; // blue ataca hacia arriba (y decrece)

function completePlay(baseTracks,duration,style,attOverride){
  const SAMPLE=220;
  const ids=Object.keys(baseTracks);
  const start={},active={};
  ids.forEach(id=>{start[id]=baseTracks[id][0];active[id]=pathLen(baseTracks[id])>0.06});

  const ball=baseTracks['ball'];
  const ballMoved=ball&&pathLen(ball)>0.06;

  // referencia de juego: la pelota, o si no se movió, el jugador más activo
  let refTrack=ball&&ball.length?ball:[{t:0,x:.5,y:.5}];
  if(!ballMoved){
    let bl=0;
    S.players.forEach(p=>{
      if(p.ball)return;
      const l=pathLen(baseTracks[p.id]||[]);
      if(l>bl){bl=l;refTrack=baseTracks[p.id]}
    });
  }
  const ballAt=t=>posAt(refTrack,t);

  // ¿quién ataca? 1) lo que elija el usuario, 2) hacia dónde va la pelota,
  // 3) qué equipo avanzó más, 4) quién tiene la pelota más cerca
  let att=(attOverride&&attOverride!=='auto')?attOverride:null;
  if(!att&&ballMoved){
    const dy=ball[ball.length-1].y-ball[0].y;
    if(Math.abs(dy)>0.05)att=dy<0?'blue':'red'; // sube → ataca azul
  }
  if(!att){
    const adv={blue:0,red:0};
    S.players.forEach(p=>{
      if(p.ball)return;const kf=baseTracks[p.id];if(!kf)return;
      const d=(kf[0].y-kf[kf.length-1].y)*(p.team==='blue'?1:-1);
      adv[p.team]+=Math.max(0,d);
    });
    if(Math.abs(adv.blue-adv.red)>0.02)att=adv.blue>adv.red?'blue':'red';
  }
  if(!att){
    const b0=ballAt(0);let bd=9;
    S.players.forEach(p=>{
      if(p.ball||p.gk)return;
      const d=Math.hypot(start[p.id].x-b0.x,start[p.id].y-b0.y);
      if(d<bd){bd=d;att=p.team}
    });
  }
  att=att||'blue';
  const def=att==='blue'?'red':'blue';
  const dAtt=dirOf(att);

  // presor: defensor más cercano a la pelota al inicio (no arquero)
  let presser=null,pd=9;
  S.players.forEach(p=>{
    if(p.team!==def||p.gk||p.ball)return;
    const b0=ballAt(0),d=Math.hypot(start[p.id].x-b0.x,start[p.id].y-b0.y);
    if(d<pd){pd=d;presser=p.id}
  });

  // corredores especiales del equipo atacante (estilo)
  let winger=null,striker=null;
  if(style==='attack'||style==='wings'||style==='balanced'||style==='counter'||style==='buildup'){
    const b0=ballAt(0),side=b0.x<0.5?'L':'R';
    let wBest=0;
    S.players.forEach(p=>{
      if(p.team!==att||p.gk||active[p.id])return;
      const sx=start[p.id].x;
      const sameSide=side==='L'?sx<0.5:sx>=0.5;
      const wide=Math.abs(sx-0.5);
      if(sameSide&&wide>wBest){wBest=wide;winger=p.id}
    });
    let sBest=9;
    S.players.forEach(p=>{
      if(p.team!==att||p.gk||active[p.id]||p.id===winger)return;
      const gy=att==='blue'?0:1;
      const d=Math.abs(start[p.id].y-gy);
      if(d<sBest){sBest=d;striker=p.id}
    });
  }

  const depth= style==='attack'?0.26 : style==='defense'?0.07 : style==='wings'?0.16
            : style==='counter'?0.42 : style==='press'?0.05 : style==='buildup'?0.12 : 0.16;
  const out={};
  const steps=Math.max(2,Math.ceil(duration/SAMPLE));

  for(const p of S.players){
    const id=p.id;
    if(active[id]||p.ball&&ballMoved){out[id]=baseTracks[id];continue}
    if(p.ball){ // pelota quieta: queda donde está
      out[id]=baseTracks[id]||[{t:0,x:p.x,y:p.y},{t:duration,x:p.x,y:p.y}];continue;
    }
    const a=start[id],kf=[];
    for(let s=0;s<=steps;s++){
      const t=Math.min(duration,s*SAMPLE);
      const b=ballAt(t);
      const prog=clamp(((ballAt(0).y-b.y)*dAtt*-1)/0.55,0,1); // avance de la pelota 0→1
      let x,y;

      if(p.gk){ // arquero: se desplaza lateralmente siguiendo la pelota, pegado a su arco
        x=0.5+(b.x-0.5)*0.28;
        y=p.team==='blue'?clamp(a.y,0.87,0.94):clamp(a.y,0.06,0.13);
        // Salida desde arquero: el arquero del equipo atacante sale un poco con la pelota al inicio
        if(style==='buildup' && p.team===att && prog<0.15){
          y=a.y + dAtt*0.04*(0.15-prog)/0.15;
        }
      }
      else if(p.team===att){
        // compañero de apoyo
        x=a.x+(b.x-a.x)*0.22;
        y=a.y + dAtt*depth*prog;

        // ---- CONTRAATAQUE: el delantero pica al vacío, los demás corren rápido en apoyo ----
        if(style==='counter'){
          if(id===striker){ // delantero pica al área rápido, al espacio
            const gy=att==='blue'?0.15:0.85;
            const gx=b.x<0.5?0.62:0.38; // al palo contrario de donde va la pelota
            x=a.x+(gx-a.x)*Math.min(1,prog*1.8);
            y=a.y+(gy-a.y)*Math.min(1,prog*1.6);
          } else if(id!==winger){ // mediocampistas corren en apoyo vertical, rápido
            y=a.y + dAtt*(depth+0.08)*Math.min(1,prog*1.3);
            x=a.x+(b.x-a.x)*0.35;
          }
        }

        // ---- PRESIÓN ALTA: los atacantes presionan al rival con la pelota (no aplica mucho acá, es ofensivo) ----
        // (presion lo usan los defensores rivales, ver bloque defensor abajo)
        if(style==='press'){
          // delanteros del equipo atacante hacen pressing sobre la defensa rival
          y=a.y + dAtt*0.05*prog; // se quedan arriba esperando robo
        }

        // ---- SALIDA DESDE EL ARCO: defensores se abren, mediocampistas se ofrecen ----
        if(style==='buildup'){
          if(prog<0.3){ // fase inicial: abrir la salida
            const wide=Math.abs(a.x-0.5);
            x=a.x+(a.x<0.5?-0.15:0.15)*wide*prog/0.3;
            y=a.y + dAtt*0.05*(prog/0.3);
          } else { // fase de progresión: subir con la pelota
            x=a.x+(b.x-a.x)*0.2;
            y=a.y + dAtt*depth*((prog-0.3)/0.7);
          }
        }

        if(id===winger){ // desborde por banda
          const tx=ballAt(0).x<0.5?0.10:0.90;
          x=a.x+(tx-a.x)*Math.min(1,prog*1.5);
          y=a.y + dAtt*(depth+0.16)*prog;
        }
        if(id===striker && style!=='counter'){ // ataque al área / primer palo
          const gy=att==='blue'?0.12:0.88;
          x=a.x+(0.5+(b.x-0.5)*0.4-a.x)*prog;
          y=a.y+(gy-a.y)*Math.min(1,prog*1.25);
        }
        if(style==='wings'&&id!==winger&&Math.abs(a.x-0.5)>0.18){
          x=a.x+( (a.x<0.5?0.13:0.87) -a.x)*0.5*prog;
        }
        // no pisar la pelota
        const dball=Math.hypot(x-b.x,y-b.y);
        if(dball<0.085){const f=(0.085-dball);x+= (x-b.x)/Math.max(0.01,dball)*f;y+=(y-b.y)/Math.max(0.01,dball)*f}
      }
      else{ // defensor: el bloque bascula hacia la pelota y se repliega; el más cercano presiona
        const retreat=def==='blue'?0.10:-0.10; // hacia su propio arco
        x=a.x+(b.x-a.x)*0.30;
        y=a.y+retreat*prog;
        if(style==='defense'){
          x=a.x+(b.x-a.x)*0.18+(0.5-a.x)*0.18;
          y=a.y+retreat*1.4*prog;
        }

        // ---- PRESIÓN ALTA: la defensa entera sube y presiona muy agresivamente ----
        if(style==='press'){
          if(id===presser){ // presionador directo: sale rápido al portador
            const reach=Math.min(1,0.4+prog*1.4);
            x=a.x+(b.x-a.x)*reach;
            y=a.y+(b.y-a.y)*reach;
          } else { // compañeros: suben la línea, reducen espacio
            x=a.x+(b.x-a.x)*0.45;
            y=a.y + (def==='blue'?0.18:-0.18)*prog; // suben la línea defensiva
          }
        }

        // ---- CONTRAATAQUE: la defensa queda mal parada, reacciona tarde (se replega lento) ----
        if(style==='counter'){
          // defensa desordenada, replegando con delay
          x=a.x+(b.x-a.x)*0.15;
          y=a.y + retreat*0.6*prog; // replegan más lento (quedaron mal parados)
          if(id===presser){ // el más cercano intenta alcanzar al delantero
            const reach=Math.min(0.8,prog*1.2);
            x=a.x+(b.x-a.x)*reach;
            y=a.y+(b.y-a.y)*reach*0.7;
          }
        }

        if(id===presser && style!=='press' && style!=='counter'){ // presionador estándar
          const off=def==='blue'?0.055:-0.055;
          const reach=Math.min(1,0.25+prog*1.1);
          x=a.x+(b.x-a.x)*reach;
          y=a.y+(b.y+off-a.y)*reach;
        }
      }
      kf.push({t,x:clamp(x,0.03,0.97),y:clamp(y,0.03,0.97)});
    }
    out[id]=kf;
  }
  return {tracks:out, att};
}

function previewComplete(){
  if(!Object.keys(S.tracks).length||S.duration<=0){toast('Primero grabá una jugada');return}
  if(!canUseAI()){
    closeSheets();
    toast('🧠 Usaste tu IA gratis de hoy — pasá a PRO para ilimitada');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  registerAIUse();
  const res=completePlay(S.tracks,S.duration,S.aiStyle,S.attTeam);
  S.preview={tracks:res.tracks,duration:S.duration};
  S.prevShow='ai';
  closeSheets();updatePrevSeg();
  document.getElementById('pAI').classList.add('show');
  document.getElementById('btnRow').style.display='none';
  document.getElementById('aiBar').classList.add('show');
  stopPlay();applyFrame(0);play();
  toast('✨ Ataca '+(res.att==='blue'?'AZUL 🔵':'ROJO 🔴')+' — compará y aplicá');
  updateUI();
}
function applyPreview(){
  if(!S.preview)return;
  S.tracks=S.preview.tracks;S.duration=S.preview.duration;
  discardPreview(true);
  stopPlay();toast('✓ Mejora aplicada a tu jugada');updateUI();
}
function discardPreview(silent){
  if(!S.preview&&silent)return finishPrevUI();
  S.preview=null;
  finishPrevUI();
  if(!silent){stopPlay();toast('Se mantiene tu jugada original')}
}
function finishPrevUI(){
  document.getElementById('pAI').classList.remove('show');
  document.getElementById('aiBar').classList.remove('show');
  document.getElementById('btnRow').style.display='flex';
  updateUI();
}
function updatePrevSeg(){
  document.getElementById('aiSeeOrig').classList.toggle('on',S.prevShow==='orig');
  document.getElementById('aiSeeAI').classList.toggle('on',S.prevShow==='ai');
}
document.getElementById('aiSeeOrig').onclick=()=>{S.prevShow='orig';updatePrevSeg();stopPlay();play()};
document.getElementById('aiSeeAI').onclick=()=>{S.prevShow='ai';updatePrevSeg();stopPlay();play()};
document.getElementById('aiReplay').onclick=()=>{stopPlay();play()};
document.getElementById('aiYes').onclick=applyPreview;
document.getElementById('aiNo').onclick=()=>discardPreview(false);

// ---- jugada de ejemplo ----
function demoPlay(){
  discardPreview(true);
  buildPlayers(true);applyFormationsQuiet();
  const D=6200,side=Math.random()<0.5?-1:1; // -1 izq, 1 der
  const sx=0.5+side*0.34;
  const tr={};
  for(const p of S.players)tr[p.id]=[{t:0,x:p.x,y:p.y}];
  // pelota: salida → banda → centro al área → definición
  const ball=tr['ball'];
  ball.length=0;
  ball.push({t:0,x:.5,y:.58},{t:900,x:.5,y:.50},{t:2300,x:clamp(sx+side*0.08,0.08,0.92),y:.38},
            {t:3300,x:clamp(sx+side*0.10,0.06,0.94),y:.26},{t:4400,x:.52,y:.15},{t:5400,x:.5,y:.055});
  // corredores azules: lateral/volante por banda + delantero
  const blues=S.players.filter(p=>p.team==='blue'&&!p.gk);
  let wing=blues.reduce((a,b)=>(side>0?b.x>a.x:b.x<a.x)?b:a,blues[0]);
  let str=blues.filter(p=>p!==wing).reduce((a,b)=>b.y<a.y?b:a,blues.filter(p=>p!==wing)[0]||blues[0]);
  if(wing){const k=tr[wing.id];k.push({t:2400,x:clamp(sx+side*0.12,0.06,0.94),y:.40},{t:3600,x:clamp(sx+side*0.13,0.05,0.95),y:.24})}
  if(str&&str!==wing){const k=tr[str.id];k.push({t:2600,x:.5,y:.30},{t:4600,x:.53,y:.16},{t:5300,x:.5,y:.10})}
  // cerrar tracks
  for(const id in tr){const k=tr[id],l=k[k.length-1];if(l.t<D)k.push({t:D,x:l.x,y:l.y})}
  const full=completePlay(tr,D,S.aiStyle,'blue').tracks;
  S.tracks=tr;S.duration=D; // "tu jugada" = guion base (pelota+corredores)
  S.preview={tracks:full,duration:D};
  S.prevShow='ai';updatePrevSeg();
  closeSheets();
  document.getElementById('pAI').classList.add('show');
  document.getElementById('btnRow').style.display='none';
  document.getElementById('aiBar').classList.add('show');
  stopPlay();applyFrame(0);play();
  toast('🎲 Jugada de ejemplo (estilo '+STYLES.find(s=>s.id===S.aiStyle).n.toLowerCase()+')');
  updateUI();
}
function applyFormationsQuiet(){
  const f1=formationPositions(S.form1,S.team1,true);let i=0;
  S.players.forEach(p=>{if(p.team==='blue'){p.x=f1[i][0];p.y=f1[i][1];i++}});
  const f2=formationPositions(S.form2,S.team2,false);i=0;
  S.players.forEach(p=>{if(p.team==='red'){p.x=f2[i][0];p.y=f2[i][1];i++}});
}

// ---------------- Guardar / cargar ----------------
const SAVED_KEY='pizarraPro.saved.v1';
function loadSaved(){try{const r=localStorage.getItem(SAVED_KEY);if(r)S.saved=JSON.parse(r)}catch(e){}}
function persistSaved(){try{localStorage.setItem(SAVED_KEY,JSON.stringify(S.saved))}catch(e){}}
function renderPlays(){
  const list=document.getElementById('playsList');list.innerHTML='';
  if(!S.saved.length){
    list.innerHTML='<div class="empty">Todavía no guardaste jugadas.<br>Grabá una y tocá 💾 Guardar.</div>';return;
  }
  S.saved.forEach((pl,i)=>{
    const el=document.createElement('div');el.className='playItem';
    el.innerHTML=`<span style="font-size:21px">📋</span>
      <span class="tx"><b>${esc(pl.name)}</b><small>F${pl.game} · ${pl.t1}v${pl.t2} · ${(pl.duration/1000).toFixed(1)}s</small></span>
      <button class="miniBtn" data-a="d" data-i="${i}" title="Duplicar">⧉</button>
      <button class="miniBtn" data-a="l" data-i="${i}">Cargar</button>
      <button class="miniBtn warn" data-a="x" data-i="${i}">✕</button>`;
    list.appendChild(el);
  });
  list.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(b.dataset.a==='x'){S.saved.splice(i,1);persistSaved();renderPlays();toast('Jugada eliminada')}
    else if(b.dataset.a==='d'){
      const orig=S.saved[i];
      const copy=JSON.parse(JSON.stringify(orig));
      copy.name=(orig.name||'Jugada')+' (copia)';
      S.saved.push(copy);
      persistSaved();renderPlays();
      toast('⧉ Duplicada: '+copy.name+' — cargala para editar');
    }
    else loadPlay(i);
  });
}
const esc=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML};
function loadPlay(i){
  const pl=S.saved[i];
  discardPreview(true);
  S.game=pl.game;S.team1=pl.t1;S.team2=pl.t2;S.form1=pl.f1;S.form2=pl.f2;
  syncGameSeg();buildPlayers();
  S.players.forEach(p=>{const m=pl.meta[p.id];if(m){p.name=m.name;p.num=m.num;if(m.photo)p.photo=m.photo;else p.photo=null}});
  S.tracks=JSON.parse(JSON.stringify(pl.tracks));
  S.duration=pl.duration;S.drawings=JSON.parse(JSON.stringify(pl.drawings||[]));
  S.carrier=null;S.fx=[];
  S.playT=0;resize();applyFrame(0);setMode('idle');closeSheets();
  toast('Cargada: '+pl.name);
}
document.getElementById('saveOk').onclick=()=>{
  if(!canSavePlay()){
    closeSheets();
    toast('🔒 Alcanzaste el límite de 3 jugadas en FREE — pasá a PRO');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  const name=document.getElementById('playName').value.trim()||'Jugada '+(S.saved.length+1);
  const meta={};S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  S.saved.push({name,game:S.game,t1:S.team1,t2:S.team2,f1:S.form1,f2:S.form2,
    duration:S.duration,tracks:JSON.parse(JSON.stringify(S.tracks)),
    drawings:JSON.parse(JSON.stringify(S.drawings)),meta});
  persistSaved();
  document.getElementById('playName').value='';
  closeSheets();toast('💾 Guardada: '+name);
};

// ---------------- UI general ----------------
function setMode(m){
  S.mode=m;
  document.getElementById('pRec').classList.toggle('show',m==='rec');
  document.getElementById('pPlay').classList.toggle('show',m==='play'&&!S.preview);
  document.getElementById('pPause').classList.toggle('show',m==='pause');
  document.getElementById('undoFloat').classList.toggle('show',m==='rec');
  // Focus mode: atenuar UI durante play/pause para foco en cancha
  document.body.classList.toggle('focus',(m==='play'||m==='pause')&&!S.preview);
  updateUI();
}
function updateUI(){
  const has=hasPlay(),rec=S.mode==='rec',pl=S.mode==='play',pa=S.mode==='pause',pv=!!S.preview;
  const bR=document.getElementById('bRec');
  bR.classList.toggle('recOn',rec);
  bR.querySelector('.ico').textContent=rec?'⏹':'⏺';
  document.getElementById('bRecL').textContent=rec?'Detener':(Object.keys(S.tracks).length?'Regrabar':'Grabar');
  bR.disabled=pl||pa||pv;

  const bP=document.getElementById('bPlay');
  bP.disabled=!has||rec;
  bP.querySelector('.ico').textContent=pl?'⏸':'▶';
  document.getElementById('bPlayL').textContent=pl?'Pausar':(pa?'Continuar':'Reproducir');

  document.getElementById('bStop').disabled=!(pl||pa);
  document.getElementById('bSave').disabled=!Object.keys(S.tracks).length||rec||pv;
  document.getElementById('bReset').disabled=rec;

  scrub.disabled=!has||rec;
  document.getElementById('tTot').textContent=(curDuration()/1000).toFixed(1)+'s';
  if(!has){document.getElementById('tCur').textContent='0.0s';scrub.value=0;scrub.style.setProperty('--fill','0%')}

  document.getElementById('rDraw').disabled=pl||rec;
  document.getElementById('rForm').disabled=pl||pa||rec||pv;
  document.getElementById('rTeams').disabled=pl||pa||rec||pv;
  document.getElementById('rAI').disabled=pl&&!pv||rec;
  document.getElementById('hExport').disabled=!has||rec||pl;
  document.getElementById('hShare').disabled=!has||rec;
}

document.getElementById('bRec').onclick=()=>S.mode==='rec'?stopRec():startRec();
document.getElementById('bPlay').onclick=()=>S.mode==='play'?pause():play();
document.getElementById('bStop').onclick=stopPlay;
document.getElementById('bReset').onclick=()=>{
  discardPreview(true);clearPlay();S.drawings=[];S.carrier=null;S.fx=[];
  buildPlayers(true);applyFormationsQuiet();setMode('idle');draw();
  document.getElementById('bPlayL').textContent='Reproducir';
  toast('Pizarra limpia');
};
document.getElementById('bSave').onclick=()=>openSheet('shSave');
function clearPlay(silent){S.tracks={};S.duration=0;S.playT=0;if(!silent)updateUI()}

// rail
document.getElementById('rDraw').onclick=()=>{
  if(S.mode==='rec'){toast('Terminá la grabación para dibujar');return}
  S.drawMode=!S.drawMode;
  document.getElementById('rDraw').classList.toggle('on',S.drawMode);
  document.getElementById('drawBar').classList.toggle('show',S.drawMode);
  toast(S.drawMode?'✏️ Dibujá flechas sobre la cancha':'Modo mover jugadores');
};
document.getElementById('dExit').onclick=()=>document.getElementById('rDraw').click();
document.getElementById('dUndo').onclick=()=>{S.drawings.pop();draw()};
document.getElementById('dClear').onclick=()=>{S.drawings=[];draw();toast('Dibujos borrados')};
document.getElementById('dWhite').onclick=()=>{S.drawColor='#f3f6f1';selCol('dWhite')};
document.getElementById('dAmber').onclick=()=>{S.drawColor='#ffb020';selCol('dAmber')};
function selCol(id){document.querySelectorAll('.dBtn.col').forEach(b=>b.classList.toggle('on',b.id===id))}

document.getElementById('rForm').onclick=()=>openSheet('shForm');
document.getElementById('rTeams').onclick=()=>openSheet('shTeams');
document.getElementById('rAI').onclick=()=>{if(S.preview){toast('Cerrá la vista previa primero (✓ o ✕)');return}openSheet('shAI')};
document.getElementById('rPresent').onclick=enterPresent;
document.getElementById('presentExit').onclick=exitPresent;
function enterPresent(){
  if(!hasPlay()){toast('Grabá o cargá una jugada antes de presentar');return}
  if(S.mode==='rec'){toast('Detené la grabación antes de presentar');return}
  document.body.classList.add('presenting');
  document.getElementById('presentExit').style.display='flex';
  // reproducir desde el inicio en loop
  S.loop=true;document.getElementById('chipLoop').classList.add('on');
  stopPlay();play();
  toast('🖥️ Modo presentación · tocá ✕ para salir');
}
function exitPresent(){
  document.body.classList.remove('presenting');
  document.getElementById('presentExit').style.display='none';
  pause();
  resize();
}
document.getElementById('hPlays').onclick=()=>openSheet('shPlays');
document.getElementById('hHelp').onclick=()=>document.getElementById('onboard').style.display='flex';
document.getElementById('hUpgrade').onclick=()=>openSheet('shPlans');
document.getElementById('hHome').onclick=()=>{try{top.location.href='/landing';}catch(e){location.href='/landing';}};
document.getElementById('chipSpeed').onclick=()=>openSheet('shSpeed');
document.getElementById('chipLoop').onclick=()=>{
  S.loop=!S.loop;
  document.getElementById('chipLoop').classList.toggle('on',S.loop);
  toast(S.loop?'🔁 Repetición en bucle':'Repetición desactivada');
};
document.getElementById('undoFloat').onclick=undoRec;
document.getElementById('hExport').onclick=()=>{
  if(S.plan==='free' && S.saved.length>=1 && S.aiUsedToday>=1){
    // allow GIF export but show upgrade nudge after 1st
  }
  exportGIF();
};

// ---- Compartir jugada por link (PRO) ----
document.getElementById('hShare').onclick=sharePlay;
document.getElementById('hTemplates').onclick=()=>{openSheet('shTemplates');renderTemplates()};
document.getElementById('hMinutes').onclick=()=>{openSheet('shMinutes');renderMinutes()};

// ---- Control de minutos (inferiores) ----
// Plantel standalone: [{id,name,num,playedMs,active}], partido: {running,startMs}
// Persistido en localStorage. Resuelve el dolor #1 de DT de kids: equidad de minutos.
const ROSTER_KEY='pizarraPro.roster.v1';
S.roster=[];
S.match={running:false,startMs:0,elapsed:0};
let _matchTick=null;
function loadRoster(){try{const r=localStorage.getItem(ROSTER_KEY);if(r){const o=JSON.parse(r);S.roster=o.roster||[];S.match=o.match||{running:false,startMs:0,elapsed:0}}}catch(e){}}
function persistRoster(){try{localStorage.setItem(ROSTER_KEY,JSON.stringify({roster:S.roster,match:S.match}))}catch(e){}}
function fmtMin(ms){const t=Math.floor(ms/60000);const s=Math.floor((ms%60000)/1000);return t+':'+String(s).padStart(2,'0')}
function tickMatch(){
  if(!S.match.running)return;
  // acumular tiempo a los jugadores activos
  const now=performance.now();
  const dt=now-S.match.startMs;
  S.match.startMs=now;
  for(const p of S.roster){if(p.active)p.playedMs+=dt}
  persistRoster();
  // refrescar solo el reloj y los minutos (no re-render todo)
  const clock=document.getElementById('matchClock');
  if(clock){
    let total=S.match.elapsed;
    for(const p of S.roster)total+=p.playedMs;
    clock.textContent=fmtMin(total);
  }
  document.querySelectorAll('.rosterItem').forEach(el=>{
    const id=el.dataset.pid;
    const p=S.roster.find(x=>x.id===id);
    if(p)el.querySelector('.min').textContent=fmtMin(p.playedMs);
  });
}
function renderMinutes(){
  const body=document.getElementById('minutesBody');
  let total=S.match.elapsed;
  for(const p of S.roster)total+=p.playedMs;
  const active=S.roster.filter(p=>p.active).length;
  // calcular equidad
  const avg=S.roster.length?total/S.roster.length:0;
  const sorted=[...S.roster].sort((a,b)=>a.playedMs-b.playedMs);
  const lowest=sorted[0];
  let html='<div id="matchTimer">';
  html+='<div class="clock" id="matchClock">'+fmtMin(total)+'</div>';
  html+='<div class="lbl">Tiempo de partido · '+active+' en cancha</div>';
  html+='<div class="btns">';
  html+='<button class="primary" id="mStart">'+(S.match.running?'⏸ Pausar':'▶ Iniciar')+'</button>';
  html+='<button id="mShare" style="background:var(--accent);color:#0E1416;border:none">📤 WhatsApp</button>';
  html+='<button id="mReset" class="danger">↺ Reset</button>';
  html+='</div></div>';
  // sugerencia de equidad
  if(S.roster.length>1 && total>30000){
    const ratio=lowest.playedMs/avg;
    if(ratio<0.6){
      html+='<div class="fairnessHint warn">⚠️ '+esc(lowest.name||('#'+lowest.num))+' jugó poco ('+fmtMin(lowest.playedMs)+'). Dale minutos ahora.</div>';
    } else {
      html+='<div class="fairnessHint">✓ Minutos equilativos. Buen trabajo.</div>';
    }
  }
  // lista de jugadores
  if(S.roster.length===0){
    html+='<p class="empty">Cargá tu plantel abajo. Después tocá ▶ Iniciar y marcá quién entra/sale durante el partido.</p>';
  } else {
    html+='<div class="secTitle">PLANTEL (tocá para entrar/salir)</div>';
    for(const p of [...S.roster].sort((a,b)=>b.playedMs-a.playedMs)){
      const ratio=avg>0?p.playedMs/avg:1;
      let badge='';
      if(total>20000){
        if(ratio<0.5)badge='<span class="badge low">POCO</span>';
        else if(ratio<0.85)badge='<span class="badge warn">BAJO</span>';
        else badge='<span class="badge ok">OK</span>';
      }
      html+='<div class="rosterItem'+(p.active?' active':'')+'" data-pid="'+p.id+'">';
      html+='<span class="sw"></span>';
      html+='<span class="num">'+(p.num||'?')+'</span>';
      html+='<span class="name">'+esc(p.name||('Jugador '+(p.num||'')))+'</span>';
      html+=badge;
      html+='<span class="min">'+fmtMin(p.playedMs)+'</span>';
      html+='<button class="del" data-del="'+p.id+'">✕</button>';
      html+='</div>';
    }
  }
  // agregar jugador
  html+='<div class="secTitle" style="margin-top:14px">AGREGAR JUGADOR</div>';
  html+='<div class="addPlayerRow">';
  html+='<input type="text" id="newPlName" placeholder="Nombre (ej: Juani)" maxlength="14">';
  html+='<input type="number" id="newPlNum" placeholder="N°" min="0" max="99" style="max-width:70px;margin:0">';
  html+='<button id="addPlBtn">+</button>';
  html+='</div>';
  html+='<p class="hint">Los minutos se guardan solos. Si salís de la app, al volver seguís donde dejaste.</p>';
  body.innerHTML=html;
  // events
  document.getElementById('mStart').onclick=()=>{
    if(S.match.running){
      S.match.running=false;
      clearInterval(_matchTick);
    } else {
      S.match.running=true;
      S.match.startMs=performance.now();
      _matchTick=setInterval(tickMatch,1000);
    }
    persistRoster();
    renderMinutes();
  };
  document.getElementById('mShare').onclick=()=>{
    if(S.roster.length===0){toast('Cargá jugadores antes de compartir');return}
    // Pausar el timer para que los minutos no cambien al compartir
    const wasRunning=S.match.running;
    if(wasRunning){document.getElementById('mStart').click()}
    // Generar texto plano para WhatsApp
    let txt='*⏱️ Minutos jugados*\n';
    txt+=' Partido: '+fmtMin(S.roster.reduce((a,p)=>a+p.playedMs,0))+'\n\n';
    const sorted=[...S.roster].sort((a,b)=>b.playedMs-a.playedMs);
    for(const p of sorted){
      const name=p.name||('Jugador '+(p.num||'?'));
      const min=fmtMin(p.playedMs);
      const ratio=S.roster.length>0?p.playedMs/(S.roster.reduce((a,x)=>a+x.playedMs,0)/S.roster.length||1):1;
      const mark=ratio<0.5?'🔴':ratio<0.85?'🟡':'🟢';
      txt+=mark+' #'+(p.num||'?')+' '+name+': '+min+'\n';
    }
    txt+='\n_Pizarra Pro_';
    // WhatsApp: usar wa.me si hay app, si no copiar al portapapeles
    const waUrl='https://wa.me/?text='+encodeURIComponent(txt);
    if(navigator.share){
      navigator.share({title:'Minutos jugados',text}).catch(()=>{
        window.open(waUrl,'_blank');
      });
    } else {
      // Copiar al portapapeles y abrir WhatsApp
      navigator.clipboard.writeText(txt).then(()=>{
        toast('📋 Copiado — abriendo WhatsApp...');
        setTimeout(()=>window.open(waUrl,'_blank'),500);
      }).catch(()=>{
        window.open(waUrl,'_blank');
      });
    }
  };
  document.getElementById('mReset').onclick=()=>{
    if(!confirm('¿Resetear todos los minutos a 0?'))return;
    S.match.running=false;S.match.elapsed=0;clearInterval(_matchTick);
    for(const p of S.roster){p.playedMs=0;p.active=false}
    persistRoster();renderMinutes();
  };
  document.getElementById('addPlBtn').onclick=()=>{
    const name=document.getElementById('newPlName').value.trim().slice(0,14);
    const num=parseInt(document.getElementById('newPlNum').value)||S.roster.length+1;
    S.roster.push({id:'p'+Date.now(),name,num,playedMs:0,active:false});
    persistRoster();renderMinutes();
    setTimeout(()=>{const i=document.getElementById('newPlName');if(i)i.focus()},100);
  };
  body.querySelectorAll('.rosterItem').forEach(el=>{
    el.onclick=(e)=>{
      if(e.target.dataset.del){
        const id=e.target.dataset.del;
        S.roster=S.roster.filter(p=>p.id!==id);
        persistRoster();renderMinutes();return;
      }
      const p=S.roster.find(x=>x.id===el.dataset.pid);
      if(p){p.active=!p.active;persistRoster();renderMinutes()}
    };
  });
}

// ---- Plantillas de jugadas ----
function renderTemplates(){
  const list=document.getElementById('templatesList');
  if(typeof PLAYS_TEMPLATES==='undefined'){list.innerHTML='<p class="empty">No se pudieron cargar las plantillas.</p>';return}
  // Agrupar por categoría
  const byCat={};
  PLAYS_TEMPLATES.forEach(t=>{(byCat[t.cat]=byCat[t.cat]||[]).push(t)});
  let html='<p class="hint" style="text-align:left;padding:0 4px 14px">Cargá una jugada lista para ver, editar o guardar.</p>';
  for(const cat in byCat){
    html+=`<div class="secTitle">${esc(cat)}</div>`;
    byCat[cat].forEach(t=>{
      html+=`<div class="opt" data-tpl="${t.id}" style="cursor:pointer">
        <span class="ic" style="background:${t.att==='blue'?'#3B82F622':'#EF444422'}">${t.att==='blue'?'🔵':'🔴'}</span>
        <span class="tx"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span>
        <span class="ck" style="opacity:1">▶</span>
      </div>`;
    });
  }
  html+='<p class="hint" style="margin-top:14px">Las plantillas cargan en su modalidad (F5, F8 o F11). Podés editarlas, pasarlas a IA o guardarlas.</p>';
  list.innerHTML=html;
  list.querySelectorAll('.opt').forEach(el=>{
    el.onclick=()=>loadTemplate(el.dataset.tpl);
  });
}
function loadTemplate(id){
  const t=PLAYS_TEMPLATES.find(p=>p.id===id);
  if(!t){toast('Plantilla no encontrada');return}
  closeSheets();
  // Cambiar al game de la plantilla si no coincide
  if(S.game!==t.game){
    S.game=t.game;S.team1=t.game;S.team2=t.game;
    S.form1=t.game===5?'1-2-1':t.game===8?'3-3-1':'4-3-3';
    S.form2=S.form1;
    syncGameSeg();buildPlayers();
  } else {
    buildPlayers(true);
    applyFormationsQuiet();
  }
  discardPreview(true);
  // Construir tracks completas: los jugadores que no están en la plantilla quedan quietos
  S.tracks={};
  for(const p of S.players){
    if(t.tracks[p.id]){
      S.tracks[p.id]=JSON.parse(JSON.stringify(t.tracks[p.id]));
    } else {
      S.tracks[p.id]=[{t:0,x:p.x,y:p.y},{t:t.duration,x:p.x,y:p.y}];
    }
  }
  S.duration=t.duration;
  S.playT=0;
  S.carrier=null;S.fx=[];S.drawings=[];
  setMode('idle');
  resize();applyFrame(0);
  // Auto-reproducir
  setTimeout(()=>{play();},400);
  toast('🎴 '+t.name+' — reproduciendo');
}
function sharePlay(){
  if(!hasPlay()){toast('Grabá una jugada antes de compartir');return}
  if(S.plan!=='pro'){
    closeSheets();
    toast('🔒 Compartir por link es PRO — pasate y compartí con tu plantel');
    setTimeout(()=>openSheet('shPlans'),300);
    return;
  }
  // Codificar la jugada en base64 para embeber en el URL (sin backend)
  const meta={};S.players.forEach(p=>meta[p.id]={name:p.name,num:p.num,photo:p.photo||null});
  const payload={
    n:'Jugada compartida',
    g:S.game,t1:S.team1,t2:S.team2,f1:S.form1,f2:S.form2,
    d:S.duration,
    t:S.tracks,
    dr:S.drawings||[],
    m:meta
  };
  try{
    const json=JSON.stringify(payload);
    // Usar btoa con UTF-8 safe
    const b64=btoa(unescape(encodeURIComponent(json)));
    const url=location.origin+'/pizarra-pro.html?play='+b64;
    if(navigator.share){
      navigator.share({title:'Pizarra Pro — Jugada táctica',text:'Mirá esta jugada:',url}).catch(()=>{});
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(url).then(()=>{
        toast('🔗 Link copiado — pegalo en WhatsApp');
      }).catch(()=>{
        // Fallback del fallback: mostrar input
        prompt('Copiá este link:',url);
      });
    }
  }catch(e){
    toast('No pudimos generar el link (jugada muy grande)');
  }
}
// Al cargar, si hay ?play= en el URL, cargar la jugada compartida
function loadSharedPlay(){
  const params=new URLSearchParams(location.search);
  const playData=params.get('play');
  if(!playData)return false;
  try{
    const json=decodeURIComponent(escape(atob(playData)));
    const p=JSON.parse(json);
    discardPreview(true);
    S.game=p.g||5;S.team1=p.t1||5;S.team2=p.t2||5;S.form1=p.f1||'1-2-1';S.form2=p.f2||'1-2-1';
    syncGameSeg();buildPlayers();
    if(p.m)S.players.forEach(pl=>{const m=p.m[pl.id];if(m){pl.name=m.name||'';pl.num=m.num||pl.num}});
    S.tracks=p.t||{};S.duration=p.d||0;S.drawings=p.dr||[];
    S.carrier=null;S.fx=[];S.playT=0;
    resize();applyFrame(0);setMode('idle');
    // Auto-reproducir la jugada compartida
    setTimeout(()=>{play();},500);
    toast('🔗 Jugada compartida cargada — reproduciendo');
    return true;
  }catch(e){
    toast('No pudimos cargar la jugada compartida');
    return false;
  }
}

// ---- Paywall / planes ----
const FREE_AI_DAILY=1;
const FREE_SAVED_MAX=3;
function aiTodayDate(){return new Date().toISOString().slice(0,10)}
function resetAiCounterIfNewDay(){
  const today=aiTodayDate();
  if(S.aiDate!==today){S.aiDate=today;S.aiUsedToday=0}
}
function canUseAI(){
  if(S.plan==='pro')return true;
  resetAiCounterIfNewDay();
  return S.aiUsedToday<FREE_AI_DAILY;
}
function registerAIUse(){
  resetAiCounterIfNewDay();
  S.aiUsedToday++;
  persistPlan();
}
function canSavePlay(){
  if(S.plan==='pro')return true;
  return S.saved.length<FREE_SAVED_MAX;
}
const PLAN_KEY='pizarraPro.plan.v1';
function persistPlan(){try{localStorage.setItem(PLAN_KEY,JSON.stringify({plan:S.plan,aiUsedToday:S.aiUsedToday,aiDate:S.aiDate}))}catch(e){}}
function loadPlan(){try{const r=localStorage.getItem(PLAN_KEY);if(r){const o=JSON.parse(r);S.plan=o.plan||'free';S.aiUsedToday=o.aiUsedToday||0;S.aiDate=o.aiDate||''}}catch(e){}}
function updatePlanBadge(){
  const b=document.getElementById('planBadge');
  if(S.plan==='pro'){b.textContent='PRO';b.classList.remove('free')}
  else{b.textContent='FREE';b.classList.add('free')}
}
// selección de plan en el sheet
document.querySelectorAll('#shPlans .planCard').forEach(card=>{
  card.onclick=()=>{
    document.querySelectorAll('#shPlans .planCard').forEach(c=>c.classList.remove('sel'));
    card.classList.add('sel');
  };
});
document.getElementById('plansCta').onclick=async()=>{
  const sel=document.querySelector('#shPlans .planCard.sel');
  const plan=sel?sel.dataset.plan:'pro-yearly';
  const btn=document.getElementById('plansCta');
  const orig=btn.textContent;
  btn.textContent='PROCESANDO…';btn.disabled=true;
  try{
    const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});
    const data=await res.json();
    if(data.error){toast('Error: '+data.error);return}
    if(data.redirectUrl){
      // Modo producción: redirigir a Stripe Checkout
      window.top.location.href=data.redirectUrl;
    } else {
      // Modo demo: activar trial simulado
      S.plan='pro';persistPlan();updatePlanBadge();closeSheets();
      toast('✨ 7 días PRO gratis activados — disfrutá la IA ilimitada');
    }
  }catch(e){
    toast('No pudimos procesar el pago. Intentá de nuevo.');
  }finally{
    btn.textContent=orig;btn.disabled=false;
  }
};

function pushUndo(){
  if(S.mode!=='rec')return;
  S.recHistory.push({
    tracks:JSON.parse(JSON.stringify(S.tracks)),
    duration:S.duration,
    carrier:S.carrier
  });
  if(S.recHistory.length>30)S.recHistory.shift();
}
function undoRec(){
  if(S.mode!=='rec'||!S.recHistory.length){toast('Nada para deshacer');return}
  const s=S.recHistory.pop();
  S.tracks=s.tracks;S.duration=s.duration;S.carrier=s.carrier;
  document.getElementById('recTime').textContent=(S.duration/1000).toFixed(1)+'s';
  draw();toast('↶ Movimiento deshecho');
}
function exportGIF(){
  if(typeof GIF==='undefined'){toast('No pude cargar el codificador GIF. Revisá tu conexión.');return}
  if(!hasPlay()){toast('Grabá una jugada primero');return}
  if(S.mode==='play')setMode('pause');
  const D=curDuration();
  const fps=14,N=Math.max(2,Math.min(Math.round(D/1000*fps),100));
  const scale=Math.min(1,360/W);
  const w=Math.round(W*scale),h=Math.round(H*scale);
  const gif=new GIF({workers:1,quality:12,width:w,height:h,
    workerScript:'/gif.worker.js'});
  const saved=S.players.map(p=>({id:p.id,x:p.x,y:p.y}));
  const savedT=S.playT;
  const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;
  const tctx=tmp.getContext('2d');
  for(let i=0;i<N;i++){
    const t=D*(i/(N-1||1));
    applyFrame(t,true); // easing para que el GIF se vea igual que la reproducción
    tctx.drawImage(cv,0,0,w,h);
    gif.addFrame(tmp,{delay:Math.round(1000/fps)});
  }
  S.players.forEach(p=>{const s=saved.find(q=>q.id===p.id);if(s){p.x=s.x;p.y=s.y}});
  S.playT=savedT;
  if(S.mode==='pause'||S.mode==='idle')applyFrame(savedT);
  toast('🎬 Generando GIF… tardá unos segundos');
  gif.on('finished',blob=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download='pizarra-pro-jugada.gif';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    toast('🎬 GIF listo — descargado');
  });
  gif.render();
}

// segmento de modalidad
document.querySelectorAll('#gameSeg button').forEach(b=>b.onclick=()=>{
  const g=+b.dataset.g;if(g===S.game)return;
  if(S.mode!=='idle'){toast('Detené la reproducción/grabación primero');return}
  discardPreview(true);
  S.game=g;S.team1=g;S.team2=g;
  S.form1=DEFAULT_FORM[g];S.form2=DEFAULT_FORM[g];
  syncGameSeg();clearPlay(true);S.drawings=[];S.carrier=null;S.fx=[];
  buildPlayers();resize();updateUI();
  toast('Fútbol '+g+' · '+DEFAULT_FORM[g]);
});
function syncGameSeg(){
  document.querySelectorAll('#gameSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.g===S.game));
}

// sheets
const bg=document.getElementById('sheetBg');
function openSheet(id){
  closeSheets();bg.classList.add('open');
  document.getElementById(id).classList.add('open');
  if(id==='shPlays')renderPlays();
  if(id==='shForm')renderFormSheet();
  if(id==='shAI')renderAISheet();
  if(id==='shTeams'){S._t1=S.team1;S._t2=S.team2;syncTeams()}
}
function closeSheets(){bg.classList.remove('open');document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('open'))}
bg.onclick=closeSheets;

// velocidad
function renderSpeeds(){
  const l=document.getElementById('speedList');l.innerHTML='';
  SPEEDS.forEach(s=>{
    const el=document.createElement('div');
    el.className='opt'+(S.speed===s.v?' sel':'');
    el.innerHTML=`<span class="ic" style="background:#ffb02022">${s.i}</span>
      <span class="tx"><b>${s.n} · ${s.v}x</b><small>${s.d}</small></span><span class="ck">✔</span>`;
    el.onclick=()=>{S.speed=s.v;document.getElementById('speedLabel').textContent=s.v+'x';renderSpeeds();closeSheets();toast('Velocidad '+s.v+'x')};
    l.appendChild(el);
  });
}

// equipos
function syncTeams(){
  document.getElementById('t1n').textContent=S._t1;
  document.getElementById('t2n').textContent=S._t2;
  document.getElementById('t1m').disabled=S._t1<=3;document.getElementById('t1p').disabled=S._t1>=11;
  document.getElementById('t2m').disabled=S._t2<=3;document.getElementById('t2p').disabled=S._t2>=11;
}
S._t1=5;S._t2=5;
document.getElementById('t1m').onclick=()=>{S._t1=Math.max(3,S._t1-1);syncTeams()};
document.getElementById('t1p').onclick=()=>{S._t1=Math.min(11,S._t1+1);syncTeams()};
document.getElementById('t2m').onclick=()=>{S._t2=Math.max(3,S._t2-1);syncTeams()};
document.getElementById('t2p').onclick=()=>{S._t2=Math.min(11,S._t2+1);syncTeams()};
document.getElementById('teamsApply').onclick=()=>{
  S.team1=S._t1;S.team2=S._t2;
  if(!parseForm(S.form1,S.team1))S.form1='auto';
  if(!parseForm(S.form2,S.team2))S.form2='auto';
  discardPreview(true);clearPlay(true);S.carrier=null;S.fx=[];
  buildPlayers(true);setMode('idle');draw();closeSheets();
  toast(`Equipos: ${S.team1} vs ${S.team2}`);
};

// formaciones
let formTeam='blue';
document.getElementById('ftBlue').onclick=()=>{formTeam='blue';renderFormSheet()};
document.getElementById('ftRed').onclick=()=>{formTeam='red';renderFormSheet()};
function renderFormSheet(){
  document.getElementById('ftBlue').classList.toggle('on',formTeam==='blue');
  document.getElementById('ftRed').classList.toggle('on',formTeam==='red');
  document.getElementById('formModeLbl').textContent='FÚTBOL '+S.game+' · EQUIPO '+(formTeam==='blue'?'AZUL':'ROJO');
  const count=formTeam==='blue'?S.team1:S.team2;
  const cur=formTeam==='blue'?S.form1:S.form2;
  const box=document.getElementById('formChips');box.innerHTML='';
  let any=false;
  FORMATIONS[S.game].forEach(code=>{
    const ok=!!parseForm(code,count);
    const b=document.createElement('button');
    b.className='fChip'+(cur===code?' sel':'');
    b.textContent=code;b.disabled=!ok;if(ok)any=true;
    b.onclick=()=>{applyFormation(formTeam,code);renderFormSheet();toast('Formación '+code+' aplicada')};
    box.appendChild(b);
  });
  document.getElementById('formHint').textContent=any?
    'Aplicar una formación reubica al equipo y borra la jugada en curso.':
    `Con ${count} jugadores no hay formaciones estándar de Fútbol ${S.game}. Ajustá la cantidad en 👥.`;
}

// IA sheet
function renderAISheet(){
  const ab=document.getElementById('attChips');ab.innerHTML='';
  [['auto','🤖 Auto'],['blue','🔵 Azul'],['red','🔴 Rojo']].forEach(([id,lbl])=>{
    const b=document.createElement('button');
    b.className='fChip'+(S.attTeam===id?' sel':'');
    b.textContent=lbl;
    b.onclick=()=>{S.attTeam=id;renderAISheet()};
    ab.appendChild(b);
  });
  const box=document.getElementById('styleChips');box.innerHTML='';
  STYLES.forEach(s=>{
    const b=document.createElement('button');
    b.className='fChip'+(S.aiStyle===s.id?' sel':'');
    b.textContent=s.i+' '+s.n;
    b.onclick=()=>{S.aiStyle=s.id;renderAISheet()};
    box.appendChild(b);
  });
  const has=Object.keys(S.tracks).length>0&&S.duration>0;
  document.getElementById('aiHasPlay').style.display=has?'block':'none';
  document.getElementById('aiNoPlay').style.display=has?'none':'block';
}
document.getElementById('aiComplete').onclick=previewComplete;
document.getElementById('aiDemo').onclick=demoPlay;

// edición jugador
let _plPhotoTemp=null;
function openPlayerEdit(p){
  S.editing=p;
  document.getElementById('plName').value=p.name||'';
  document.getElementById('plNum').value=p.num;
  _plPhotoTemp=null;
  const prev=document.getElementById('plPhotoPreview');
  const delBtn=document.getElementById('plPhotoDel');
  if(p.photo){
    prev.style.backgroundImage='url('+p.photo+')';
    prev.textContent='';
    delBtn.style.display='block';
  } else {
    prev.style.backgroundImage='';
    prev.textContent='👤';
    delBtn.style.display='none';
  }
  openSheet('shPlayer');
}
document.getElementById('plPhoto').onchange=(e)=>{
  const f=e.target.files[0];
  if(!f)return;
  if(f.size>800*1024){toast('La foto es muy grande (máx 800KB)');return}
  const reader=new FileReader();
  reader.onload=(ev)=>{
    _plPhotoTemp=ev.target.result;
    const prev=document.getElementById('plPhotoPreview');
    prev.style.backgroundImage='url('+_plPhotoTemp+')';
    prev.textContent='';
    document.getElementById('plPhotoDel').style.display='block';
  };
  reader.readAsDataURL(f);
};
document.getElementById('plPhotoDel').onclick=()=>{
  _plPhotoTemp='';
  const prev=document.getElementById('plPhotoPreview');
  prev.style.backgroundImage='';
  prev.textContent='👤';
  document.getElementById('plPhotoDel').style.display='none';
};
document.getElementById('plOk').onclick=()=>{
  if(S.editing){
    S.editing.name=document.getElementById('plName').value.trim().slice(0,14);
    const n=parseInt(document.getElementById('plNum').value);
    if(!isNaN(n))S.editing.num=clamp(n,0,99);
    if(_plPhotoTemp!==null){
      if(_plPhotoTemp==='')delete S.editing.photo;
      else S.editing.photo=_plPhotoTemp;
    }
  }
  _plPhotoTemp=null;
  S.editing=null;closeSheets();draw();
};

// toast + onboarding
let toastT;
function toast(m){
  const t=document.getElementById('toast');
  t.textContent=m;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400);
}
document.getElementById('obOk').onclick=()=>{document.getElementById('onboard').style.display='none'};

// ---------------- Auth (login/registro/recuperar) ----------------
// Demo: usuarios guardados en localStorage. Listo para migrar a Supabase/Auth real.
const USERS_KEY='pizarraPro.users.v1';
const SESSION_KEY='pizarraPro.session.v1';
S.user=null;
let _authMode='login'; // login | register | forgot
function loadUsers(){try{return JSON.parse(localStorage.getItem(USERS_KEY)||'[]')}catch(e){return[]}}
function saveUsers(u){try{localStorage.setItem(USERS_KEY,JSON.stringify(u))}catch(e){}}
function loadSession(){try{const s=localStorage.getItem(SESSION_KEY);if(s)S.user=JSON.parse(s)}catch(e){}}
function saveSession(){try{localStorage.setItem(SESSION_KEY,JSON.stringify(S.user))}catch(e){}}
function clearSession(){try{localStorage.removeItem(SESSION_KEY)}catch(e){}S.user=null}
function hash(s){ // hash simple (no seguro, solo demo. En prod: bcrypt server-side)
  let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return String(h)
}
function initials(name){return(name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?'}

function openAuth(mode){
  _authMode=mode||'login';
  const title=document.getElementById('authTitle');
  const sub=document.getElementById('authSub');
  const submit=document.getElementById('authSubmit');
  const nameField=document.getElementById('nameField');
  const passField=document.getElementById('passField');
  const switchP=document.getElementById('authSwitch');
  const links=document.getElementById('authLinks');
  const err=document.getElementById('authError');
  const suc=document.getElementById('authSuccess');
  err.classList.remove('show');suc.classList.remove('show');
  document.getElementById('authForm').reset();
  if(_authMode==='login'){
    title.textContent='Iniciar sesión';
    sub.textContent='Entrá para guardar tus jugadas en la nube y sincronizar entre dispositivos.';
    submit.textContent='ENTRAR';
    nameField.style.display='none';
    passField.style.display='block';
    switchP.innerHTML='¿No tenés cuenta? <a id="authSwitchLink">Registrate gratis</a>';
    links.style.display='flex';
  } else if(_authMode==='register'){
    title.textContent='Crear cuenta';
    sub.textContent='Gratis. Guardá jugadas, sincronizá y desbloqueá la IA.';
    submit.textContent='CREAR CUENTA';
    nameField.style.display='block';
    passField.style.display='block';
    switchP.innerHTML='¿Ya tenés cuenta? <a id="authSwitchLink">Iniciar sesión</a>';
    links.style.display='none';
  } else if(_authMode==='forgot'){
    title.textContent='Recuperar contraseña';
    sub.textContent='Te enviamos un link a tu email para restablecerla.';
    submit.textContent='ENVIAR LINK';
    nameField.style.display='none';
    passField.style.display='none';
    switchP.innerHTML='¿Ya te acordás? <a id="authSwitchLink">Volver a iniciar sesión</a>';
    links.style.display='none';
  }
  document.getElementById('authModal').classList.add('show');
  const sl=document.getElementById('authSwitchLink');
  if(sl)sl.onclick=()=>openAuth(_authMode==='login'?'register':'login');
}
function closeAuth(){document.getElementById('authModal').classList.remove('show')}
function authError(msg){const e=document.getElementById('authError');e.textContent=msg;e.classList.add('show')}
function authSuccess(msg){const e=document.getElementById('authSuccess');e.textContent=msg;e.classList.add('show')}
function refreshUserUI(){
  const pill=document.getElementById('userPill');
  const loginBtn=document.getElementById('hLogin');
  if(S.user){
    pill.style.display='flex';
    loginBtn.style.display='none';
    document.getElementById('userAvatar').textContent=initials(S.user.name||S.user.email);
    document.getElementById('userName').textContent=S.user.name||S.user.email.split('@')[0];
  } else {
    pill.style.display='none';
    loginBtn.style.display='flex';
  }
}
document.getElementById('hLogin').onclick=()=>openAuth('login');
document.getElementById('authForgot').onclick=()=>openAuth('forgot');
document.getElementById('authForm').onsubmit=(e)=>{
  e.preventDefault();
  const email=document.getElementById('authEmail').value.trim().toLowerCase();
  const pass=document.getElementById('authPass').value;
  const name=document.getElementById('authName').value.trim();
  document.getElementById('authError').classList.remove('show');
  document.getElementById('authSuccess').classList.remove('show');
  if(_authMode==='forgot'){
    authSuccess('📧 Te enviamos un link a '+email+'. Revisá tu casilla.');
    setTimeout(()=>{closeAuth();toast('📧 Link de recuperación enviado')},1800);
    return;
  }
  if(_authMode==='register'){
    if(name.length<2){authError('Decinos tu nombre (mínimo 2 caracteres)');return}
    if(pass.length<6){authError('La contraseña tiene que tener al menos 6 caracteres');return}
    const users=loadUsers();
    if(users.find(u=>u.email===email)){authError('Ya existe una cuenta con ese email. Iniciá sesión.');return}
    const u={id:'u'+Date.now(),name,email,passHash:hash(pass),created:Date.now()};
    users.push(u);saveUsers(users);
    S.user={id:u.id,name:u.name,email:u.email};saveSession();
    authSuccess('✓ Cuenta creada. ¡Bienvenido, '+name+'!');
    setTimeout(()=>{closeAuth();refreshUserUI();toast('✓ Sesión iniciada — bienvenido, '+name)},1200);
    return;
  }
  // login
  const users=loadUsers();
  const u=users.find(x=>x.email===email);
  if(!u||u.passHash!==hash(pass)){authError('Email o contraseña incorrectos');return}
  S.user={id:u.id,name:u.name,email:u.email};saveSession();
  closeAuth();refreshUserUI();
  toast('✓ Hola de nuevo, '+u.name);
};
document.getElementById('userPill').onclick=(e)=>{
  e.stopPropagation();
  document.getElementById('userMenu').classList.toggle('show');
};
document.addEventListener('click',()=>document.getElementById('userMenu').classList.remove('show'));
document.getElementById('umPlays').onclick=()=>{document.getElementById('userMenu').classList.remove('show');openSheet('shPlays')};
document.getElementById('umUpgrade').onclick=()=>{document.getElementById('userMenu').classList.remove('show');openSheet('shPlans')};
document.getElementById('umLogout').onclick=()=>{
  document.getElementById('userMenu').classList.remove('show');
  clearSession();refreshUserUI();
  toast('Sesión cerrada');
};

// ---------------- Init ----------------
loadSaved();
loadPlan();
loadRoster();
loadSession();
buildPlayers();
resize();
setMode('idle');
renderSpeeds();
updatePlanBadge();
refreshUserUI();
// Si hay una jugada compartida en el URL (?play=...), cargarla y reproducirla
loadSharedPlay();

// ---- PWA: Service Worker + Install prompt ----
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  // mostrar toast de instalación después de un rato
  setTimeout(()=>{
    if(deferredPrompt && !localStorage.getItem('pizarraPro.installDismissed')){
      showInstallToast();
    }
  },8000);
});
function showInstallToast(){
  const t=document.getElementById('toast');
  t.innerHTML='📲 <button id="installYes" style="background:none;border:none;color:var(--accent);font-weight:800;cursor:pointer;text-decoration:underline">Instalar app</button>';
  t.style.maxWidth='none';t.style.whiteSpace='normal';
  t.classList.add('show');
  clearTimeout(toastT);
  document.getElementById('installYes').onclick=async()=>{
    if(!deferredPrompt)return;
    deferredPrompt.prompt();
    const {outcome}=await deferredPrompt.userChoice;
    deferredPrompt=null;
    t.classList.remove('show');
    if(outcome==='accepted')localStorage.setItem('pizarraPro.installDismissed','1');
  };
  toastT=setTimeout(()=>t.classList.remove('show'),6000);
}
window.addEventListener('appinstalled',()=>{
  localStorage.setItem('pizarraPro.installDismissed','1');
  toast('✓ App instalada — encontrala en tu pantalla de inicio');
});
</script>
</body>
</html>


================================================================
=== ARCHIVO: src/app/landing/page.tsx (LANDING COMERCIAL) ===
================================================================
'use client'

/**
 * Pizarra Pro — Landing comercial.
 *
 * Vive en /landing para no pisar la app principal (que está en / vía iframe).
 * Es una página de venta: copy persuasivo, dark mode profesional, paleta de la
 * app (menta #22D3A6 como acento, NO indigo/azul como primario).
 *
 * Estructura:
 *   1. Sticky header (logo + Probar gratis)
 *   2. Hero (headline + 2 CTAs + mockup de cancha en canvas)
 *   3. Cómo funciona (3 pasos)
 *   4. Features (grid de 6)
 *   5. Diferenciador (vs TacticalPad / Coach Tactic Board)
 *   6. Pricing (3 planes, central destacado)
 *   7. Testimonial (placeholder)
 *   8. Footer (links + copyright + Hecho en Argentina 🇦🇷)
 */

import { Inter } from 'next/font/google'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Brain,
  Trophy,
  Film,
  Repeat,
  MonitorDown,
  HardDrive,
  Check,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  PencilLine,
  Bot,
  Share2,
  Zap,
  Star,
  ShieldCheck,
} from 'lucide-react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

/* ─────────────────────────  PALETA  ───────────────────────── */
const C = {
  bg: '#0E1416',
  surface: '#161D21',
  surface2: '#1F282D',
  line: 'rgba(255,255,255,0.08)',
  text: '#E8EDF0',
  muted: '#9AA7AD',
  accent: '#22D3A6', // menta — CTA
  accentDark: '#0F9D77',
  amber: '#FBBF24',
  blue: '#3B82F6',
  red: '#EF4444',
  chalk: '#1E5E3A',
  chalkDark: '#173F2A',
} as const

/* ─────────────────────  MOCKUP CANVAS  ──────────────────────
 * Dibuja una cancha de fútbol 5 con jugadores, pelota y flechas
 * de jugada. Animación sutil: la pelota viaja por un camino y
 * hay un resplandor pulsante en el jugador con la pelota.
 */
function FieldMockup() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = 640
    const H = 420
    c.width = W * DPR
    c.height = H * DPR
    c.style.width = '100%'
    c.style.height = 'auto'
    ctx.scale(DPR, DPR)

    // posiciones de jugadores (en coords 0..1, x=horizontal, y=vertical)
    // Azul ataca hacia la derecha (x creciente), Rojo defiende.
    const blue = [
      { x: 0.18, y: 0.5 }, // arquero
      { x: 0.34, y: 0.28 },
      { x: 0.34, y: 0.72 },
      { x: 0.52, y: 0.4 },
      { x: 0.52, y: 0.6 },
    ]
    const red = [
      { x: 0.82, y: 0.5 },
      { x: 0.66, y: 0.28 },
      { x: 0.66, y: 0.72 },
      { x: 0.48, y: 0.32 },
      { x: 0.48, y: 0.68 },
    ]
    // camino de la pelota: pase del #4 azul al #5 azul (centro)
    const ballPath = [
      { x: 0.52, y: 0.4 },
      { x: 0.62, y: 0.5 },
      { x: 0.7, y: 0.55 },
    ]
    // flecha IA: movimiento sugerido del #5 azul al hueco
    const aiArrow = { from: { x: 0.52, y: 0.6 }, to: { x: 0.72, y: 0.62 } }

    const lighten = (hex: string, amt: number) => {
      const n = parseInt(hex.slice(1), 16)
      const r = Math.min(255, (n >> 16) + Math.round(255 * amt))
      const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt))
      const b = Math.min(255, (n & 0xff) + Math.round(255 * amt))
      return `rgb(${r},${g},${b})`
    }

    const drawArrow = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      dashed: boolean,
    ) => {
      ctx.save()
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 3
      if (dashed) ctx.setLineDash([7, 5])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
      // punta
      const ang = Math.atan2(y2 - y1, x2 - x1)
      const ah = 10
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4))
      ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawPlayer = (
      x: number,
      y: number,
      color: string,
      hasBall: boolean,
      t: number,
    ) => {
      const r = 14
      // sombra
      ctx.beginPath()
      ctx.ellipse(x, y + r + 3, r * 0.9, r * 0.35, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fill()
      // glow si tiene pelota
      if (hasBall) {
        const pulse = 0.6 + 0.4 * Math.sin(t / 400)
        ctx.beginPath()
        ctx.arc(x, y, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251,191,36,${0.18 * pulse})`
        ctx.fill()
      }
      // cuerpo
      const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r)
      g.addColorStop(0, lighten(color, 0.25))
      g.addColorStop(1, color)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      // borde blanco
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.stroke()
      // highlight
      ctx.beginPath()
      ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fill()
    }

    const drawBall = (x: number, y: number, t: number) => {
      const r = 7
      // sombra
      ctx.beginPath()
      ctx.ellipse(x, y + r + 2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fill()
      // glow
      const pulse = 0.5 + 0.5 * Math.sin(t / 300)
      ctx.beginPath()
      ctx.arc(x, y, r + 5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(251,191,36,${0.25 * pulse})`
      ctx.fill()
      // balón
      const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r)
      g.addColorStop(0, '#FFF7CC')
      g.addColorStop(1, C.amber)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.stroke()
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H)
      // césped con franjas
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? C.chalk : C.chalkDark
        ctx.fillRect((W / 10) * i, 0, W / 10, H)
      }
      // viñeta
      const grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75)
      grd.addColorStop(0, 'rgba(0,0,0,0)')
      grd.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)

      // líneas de tiza
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
      ctx.lineWidth = 2
      ctx.strokeRect(16, 16, W - 32, H - 32)
      // línea de medio campo
      ctx.beginPath()
      ctx.moveTo(W / 2, 16)
      ctx.lineTo(W / 2, H - 16)
      ctx.stroke()
      // círculo central
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 48, 0, Math.PI * 2)
      ctx.stroke()
      // áreas
      ctx.strokeRect(16, H / 2 - 70, 70, 140)
      ctx.strokeRect(W - 86, H / 2 - 70, 70, 140)

      // flecha IA (trazada, menta) — primero para que quede debajo
      drawArrow(aiArrow.from.x * W, aiArrow.from.y * H, aiArrow.to.x * W, aiArrow.to.y * H, C.accent, true)

      // pelota viajando
      const cycle = (t / 2600) % 1
      const seg = cycle * (ballPath.length - 1)
      const i = Math.floor(seg)
      const f = seg - i
      const a = ballPath[i]
      const b = ballPath[Math.min(i + 1, ballPath.length - 1)]
      const bx = (a.x + (b.x - a.x) * f) * W
      const by = (a.y + (b.y - a.y) * f) * H

      // jugadores azules
      blue.forEach((p, idx) => drawPlayer(p.x * W, p.y * H, C.blue, idx === 3, t))
      // jugadores rojos
      red.forEach((p) => drawPlayer(p.x * W, p.y * H, C.red, false, t))

      // pelota
      drawBall(bx, by, t)

      // etiqueta "IA" sobre la flecha
      ctx.fillStyle = C.accent
      ctx.font = '700 11px Inter, sans-serif'
      ctx.fillText('✨ IA', aiArrow.to.x * W + 10, aiArrow.to.y * H - 6)
    }

    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      draw(now - start)
      raf = requestAnimationFrame(loop)
    }
    if (reduce) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
    }
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border shadow-2xl"
      style={{
        borderColor: C.line,
        background: C.chalkDark,
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,211,166,0.15)',
      }}
    >
      <canvas ref={ref} className="block w-full" />
      {/* badge flotante "IA completando" */}
      <div
        className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur"
        style={{ background: 'rgba(14,20,22,0.7)', color: C.accent, border: `1px solid ${C.accent}` }}
      >
        <Sparkles size={13} />
        IA completando jugada…
      </div>
    </div>
  )
}

/* ─────────────────────────  HEADER  ───────────────────────── */
function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-all"
      style={{
        background: scrolled ? 'rgba(14,20,22,0.85)' : 'rgba(14,20,22,0.6)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${scrolled ? C.line : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-black"
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              color: C.bg,
              boxShadow: `0 4px 12px ${C.accent}55`,
            }}
          >
            ⚽
          </span>
          <span className="text-[15px] font-extrabold tracking-tight" style={{ color: C.text }}>
            Pizarra <span style={{ color: C.accent }}>Pro</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="ml-6 hidden items-center gap-7 md:flex">
          <a href="#como-funciona" className="text-sm font-medium transition-colors hover:text-white" style={{ color: C.muted }}>
            Cómo funciona
          </a>
          <a href="#features" className="text-sm font-medium transition-colors hover:text-white" style={{ color: C.muted }}>
            Features
          </a>
          <a href="#planes" className="text-sm font-medium transition-colors hover:text-white" style={{ color: C.muted }}>
            Planes
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="hidden text-sm font-semibold transition-colors hover:text-white sm:inline"
            style={{ color: C.muted }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
            style={{
              background: C.accent,
              color: C.bg,
              boxShadow: `0 4px 16px ${C.accent}40`,
            }}
          >
            Probar gratis
            <ArrowRight size={15} />
          </Link>
          {/* mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
            style={{ borderColor: C.line, color: C.text, background: C.surface }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden"
            style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {[
                { href: '#como-funciona', label: 'Cómo funciona' },
                { href: '#features', label: 'Features' },
                { href: '#planes', label: 'Planes' },
              ].map((i) => (
                <a
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: C.text }}
                >
                  {i.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ─────────────────────────  HERO  ─────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
      {/* glow background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(800px 400px at 70% 0%, ${C.accent}1A, transparent 70%), radial-gradient(600px 300px at 10% 20%, ${C.blue}12, transparent 70%)`,
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: `${C.accent}1F`, color: C.accent, border: `1px solid ${C.accent}55` }}
          >
            <Sparkles size={13} />
            La primera pizarra táctica con IA que completa la jugada
          </div>

          <h1
            className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: C.text }}
          >
            Táctica de fútbol con IA.{' '}
            <span style={{ color: C.accent }}>Dibujá, la IA completa.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: C.muted }}>
            Grabá tu jugada, dejá que la IA simule cómo responde el rival. Para entrenadores de
            fútbol 5, 8 y 11. En tu celu, sin instalar nada.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all hover:scale-[1.03] active:scale-95"
              style={{
                background: C.accent,
                color: C.bg,
                boxShadow: `0 8px 28px ${C.accent}40`,
              }}
            >
              Probar gratis
              <ArrowRight size={18} />
            </Link>
            <a
              href="#planes"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all hover:scale-[1.03] hover:bg-white/5 active:scale-95"
              style={{ color: C.text, border: `1px solid ${C.line}`, background: C.surface }}
            >
              Ver planes
            </a>
          </div>

          {/* trust line */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium" style={{ color: C.muted }}>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} style={{ color: C.accent }} /> Sin registro
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} style={{ color: C.accent }} /> Funciona offline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} style={{ color: C.accent }} /> Hecho en Argentina 🇦🇷
            </span>
          </div>
        </motion.div>

        {/* Right: mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <FieldMockup />
          {/* stats below mockup */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { v: '5·8·11', l: 'Fútbol' },
              { v: '0.5–8x', l: 'Velocidades' },
              { v: 'GIF', l: 'Exportá y compartí' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: C.line, background: C.surface }}
              >
                <div className="text-base font-extrabold sm:text-lg" style={{ color: C.accent }}>
                  {s.v}
                </div>
                <div className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────  CÓMO FUNCIONA  ─────────────────────── */
function HowItWorks() {
  const steps = [
    {
      icon: PencilLine,
      n: '1',
      title: 'Dibujá tu jugada',
      body: 'Arrastrá jugadores y pelota como en una pizarra real. Grabá cada movimiento con su tiempo. Fútbol 5, 8 u 11 con formaciones reales.',
    },
    {
      icon: Bot,
      n: '2',
      title: 'La IA completa el resto',
      body: 'No dibujes a 22 jugadores. La IA simula cómo se mueve el rival y cómo continúan tus compañeros a partir de lo que grabaste.',
    },
    {
      icon: Share2,
      n: '3',
      title: 'Reproducí, exportá y compartí',
      body: 'Velocidad de 0.5x a 8x, modo loop, exportá a GIF y mandalo por WhatsApp al plantel. O activá Modo Presentación para el vestuario.',
    },
  ]
  return (
    <section id="como-funciona" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Cómo funciona
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            Tres pasos. Listo para el entretiempo.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base" style={{ color: C.muted }}>
            Diseñado para que un DT arme una jugada en menos de un minuto, sin manuales.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group relative rounded-2xl border p-6 transition-all hover:scale-[1.02]"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${C.accent}1F`, color: C.accent, border: `1px solid ${C.accent}55` }}
                >
                  <s.icon size={22} />
                </span>
                <span className="text-4xl font-black" style={{ color: `${C.accent}33` }}>
                  {s.n}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: C.text }}>
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────  FEATURES  ────────────────────────── */
function Features() {
  const items = [
    { icon: Brain, title: 'IA que simula al rival', body: 'No más “y si el marcador hace esto…”. La IA mueve al rival y a tus compañeros desde lo que grabaste.' },
    { icon: Trophy, title: 'Fútbol 5, 8 y 11', body: 'Formaciones reales por modalidad. Cambiá con un toque, la cancha se adapta sola.' },
    { icon: Film, title: 'Exportar a GIF', body: 'Generá un GIF liviano y mandalo por WhatsApp. Llega a todo el plantel en un toque.' },
    { icon: Repeat, title: 'Reproducción con loop y velocidades', body: 'De 0.5x para analizar hasta 8x “Relámpago”. Loop automático para repasar.' },
    { icon: MonitorDown, title: 'Modo presentación para vestuario', body: 'Pantalla completa, sin botones, auto-loop. Conectá el celu al monitor y al vestuario.' },
    { icon: HardDrive, title: 'Jugadas guardadas en tu dispositivo', body: 'Tus jugadas viven en tu celu. Sin cuenta, sin nube, sin que se te olviden las claves.' },
  ]
  return (
    <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Features
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            Todo lo que un DT necesita. Nada que estorbe.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="group rounded-2xl border p-5 transition-all hover:scale-[1.02] hover:border-white/15"
              style={{ borderColor: C.line, background: C.surface2 }}
            >
              <span
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${C.accent}1F`, color: C.accent }}
              >
                <f.icon size={22} />
              </span>
              <h3 className="mb-1.5 text-base font-bold" style={{ color: C.text }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────  DIFERENCIADOR  ──────────────────────── */
function Differentiator() {
  const rows = [
    { f: 'IA que completa la jugada', us: true, them: false },
    { f: 'Fútbol 5, 8 y 11 en una app', us: true, them: 'Parcial' },
    { f: 'Exportar a GIF para WhatsApp', us: true, them: 'Parcial' },
    { f: 'Modo presentación vestuario', us: true, them: false },
    { f: 'Funciona offline en el celu', us: true, them: false },
    { f: 'Precio Latam (PPP)', us: true, them: false },
  ]
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Por qué Pizarra Pro
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            No dibujes a 22 jugadores. Dibujá los tuyos.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed" style={{ color: C.muted }}>
            A diferencia de <strong style={{ color: C.text }}>TacticalPad</strong> o{' '}
            <strong style={{ color: C.text }}>Coach Tactic Board</strong>, nosotros tenemos una IA que
            completa la jugada. Vos dibujás a los tuyos; la IA mueve al rival y a tus compañeros.
            Menos tiempo dibujando, más tiempo pensando.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="grid grid-cols-3 border-b text-sm font-bold" style={{ borderColor: C.line }}>
            <div className="p-4" style={{ color: C.muted }}>
              Feature
            </div>
            <div className="p-4 text-center" style={{ color: C.accent }}>
              Pizarra Pro
            </div>
            <div className="p-4 text-center" style={{ color: C.muted }}>
              Otras pizarras
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.f}
              className="grid grid-cols-3 border-b last:border-b-0 text-sm"
              style={{ borderColor: C.line, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
            >
              <div className="p-4 font-medium" style={{ color: C.text }}>
                {r.f}
              </div>
              <div className="flex items-center justify-center p-4">
                {r.us === true ? (
                  <Check size={18} style={{ color: C.accent }} />
                ) : (
                  <span style={{ color: C.muted }}>{r.us}</span>
                )}
              </div>
              <div className="flex items-center justify-center p-4">
                {r.them === true ? (
                  <Check size={18} style={{ color: C.muted }} />
                ) : r.them === false ? (
                  <X size={16} style={{ color: C.red }} />
                ) : (
                  <span style={{ color: C.amber }}>{r.them}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────  PRICING  ──────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'para siempre',
      desc: 'Para probar la pizarra y la IA sin compromiso.',
      cta: 'Empezar',
      featured: false,
      sub: '',
      features: [
        { t: 'Pizarra completa (F5, F8, F11)', on: true },
        { t: '3 jugadas guardadas', on: true },
        { t: '1 IA por día', on: true },
        { t: 'Exportar a GIF', on: false },
        { t: 'IA ilimitada', on: false },
        { t: 'Modo presentación', on: false },
      ],
    },
    {
      name: 'Pro Anual',
      price: '$2.499',
      period: '/año',
      desc: 'Para el DT que usa la pizarra cada semana. Todo desbloqueado.',
      cta: 'Probar 7 días gratis',
      featured: true,
      badge: 'MÁS POPULAR',
      sub: '7 días gratis · después $2.499/año',
      features: [
        { t: 'Todo lo de Free', on: true },
        { t: 'IA ilimitada', on: true },
        { t: 'Jugadas ilimitadas', on: true },
        { t: 'Exportar a GIF sin marca', on: true },
        { t: 'Modo presentación', on: true },
        { t: 'Velocidad 8x “Relámpago”', on: true },
      ],
    },
    {
      name: 'Club',
      price: '$199',
      period: '/año por entrenador',
      desc: 'Para escuelitas y clubes con varios DTs y biblioteca compartida.',
      cta: 'Empezar',
      featured: false,
      sub: 'Mínimo 5 entrenadores',
      features: [
        { t: 'Todo lo de Pro', on: true },
        { t: 'Hasta 5 entrenadores', on: true },
        { t: 'Biblioteca de jugadas compartida', on: true },
        { t: 'Etiquetado por categoría', on: true },
        { t: 'Soporte prioritario', on: true },
        { t: 'Factura A/B', on: true },
      ],
    },
  ]

  return (
    <section id="planes" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Planes
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            Empezá gratis. Mejorate cuando te sirva.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base" style={{ color: C.muted }}>
            Precios en pesos argentinos. Sin sorpresas, cancelás cuando quieras.
          </p>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative flex flex-col rounded-2xl border p-6 transition-all hover:scale-[1.02]"
              style={{
                borderColor: p.featured ? C.accent : C.line,
                background: p.featured ? `linear-gradient(180deg, ${C.accent}12, ${C.surface2})` : C.surface2,
                boxShadow: p.featured ? `0 16px 48px -12px ${C.accent}33` : 'none',
              }}
            >
              {p.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: C.accent, color: C.bg }}
                >
                  {p.badge}
                </div>
              )}
              <h3 className="text-lg font-extrabold" style={{ color: C.text }}>
                {p.name}
              </h3>
              <p className="mt-1 text-sm" style={{ color: C.muted }}>
                {p.desc}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight" style={{ color: C.text }}>
                  {p.price}
                </span>
                <span className="text-sm font-medium" style={{ color: C.muted }}>
                  {p.period}
                </span>
              </div>
              {p.sub && (
                <p className="mt-1 text-xs font-semibold" style={{ color: p.featured ? C.accent : C.muted }}>
                  {p.sub}
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f.t} className="flex items-start gap-2.5 text-sm">
                    {f.on ? (
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: C.accent }} />
                    ) : (
                      <X size={16} className="mt-0.5 shrink-0" style={{ color: C.muted, opacity: 0.5 }} />
                    )}
                    <span style={{ color: f.on ? C.text : C.muted, opacity: f.on ? 1 : 0.6 }}>
                      {f.t}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
                style={
                  p.featured
                    ? { background: C.accent, color: C.bg, boxShadow: `0 6px 22px ${C.accent}40` }
                    : { background: C.surface, color: C.text, border: `1px solid ${C.line}` }
                }
              >
                {p.cta}
                <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs" style={{ color: C.muted }}>
          <ShieldCheck size={14} style={{ color: C.accent }} />
          Pago seguro · Cancelás cuando quieras · Sin renovación sorpresa
        </p>
      </div>
    </section>
  )
}

/* ────────────────────  TESTIMONIAL  ───────────────────────── */
function Testimonial() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border p-8 sm:p-12"
          style={{
            borderColor: C.line,
            background: `linear-gradient(135deg, ${C.surface2}, ${C.surface})`,
          }}
        >
          {/* comilla gigante */}
          <div
            className="pointer-events-none absolute right-6 top-2 select-none font-black leading-none"
            style={{ color: `${C.accent}22`, fontSize: '120px' }}
          >
            ”
          </div>

          <div className="mb-5 flex gap-1" style={{ color: C.amber }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} fill="currentColor" stroke="none" />
            ))}
          </div>

          <blockquote
            className="relative text-xl font-semibold leading-relaxed sm:text-2xl"
            style={{ color: C.text }}
          >
            “Lo uso para explicar ajustes al entretiempo. La IA me muestra variantes que no había
            pensado.”
          </blockquote>

          <div className="mt-6 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black"
              style={{ background: `${C.accent}22`, color: C.accent, border: `1px solid ${C.accent}55` }}
            >
              MJ
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: C.text }}>
                Mariano J.
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                DT de juveniles · Buenos Aires
              </div>
            </div>
            <span
              className="ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: `${C.amber}22`, color: C.amber }}
            >
              Usuario Pro
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────────────  CTA FINAL + FOOTER  ─────────────────── */
function FinalCTA() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl p-8 text-center sm:p-14" style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` }}>
        <Zap size={32} className="mx-auto mb-3" style={{ color: C.bg }} />
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ color: C.bg }}>
          Tu próxima jugada empieza acá.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'rgba(14,20,22,0.8)' }}>
          Abrí la pizarra, dibujá, dejá que la IA complete. En 60 segundos tenés una jugada lista
          para mandar al plantel.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold transition-all hover:scale-[1.03] active:scale-95"
          style={{ background: C.bg, color: C.text, boxShadow: '0 8px 28px rgba(0,0,0,0.3)' }}
        >
          Probar gratis
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  const links = [
    { href: '#features', label: 'Producto' },
    { href: '#planes', label: 'Planes' },
    { href: '/', label: 'Ayuda' },
    { href: '/', label: 'Términos' },
    { href: '/', label: 'Privacidad' },
  ]
  return (
    <footer className="mt-auto border-t px-4 py-10 sm:px-6" style={{ borderColor: C.line, background: C.bg }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          {/* marca */}
          <div>
            <Link href="/landing" className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-black"
                style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, color: C.bg }}
              >
                ⚽
              </span>
              <span className="text-[15px] font-extrabold tracking-tight" style={{ color: C.text }}>
                Pizarra <span style={{ color: C.accent }}>Pro</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed" style={{ color: C.muted }}>
              La pizarra táctica con IA para entrenadores de fútbol 5, 8 y 11. Hecha en Argentina
              para Latinoamérica.
            </p>
          </div>

          {/* links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: C.muted }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div
          className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row"
          style={{ borderColor: C.line, color: C.muted }}
        >
          <span>© 2025 Pizarra Pro. Todos los derechos reservados.</span>
          <span className="inline-flex items-center gap-1.5">
            Hecho en Argentina
            <span className="text-base leading-none">🇦🇷</span>
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ───────────────────────  PAGE  ───────────────────────────── */
export default function LandingPage() {
  return (
    <div
      className={`${inter.variable} flex min-h-screen flex-col`}
      style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif', background: C.bg, color: C.text }}
    >
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Differentiator />
        <Pricing />
        <Testimonial />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
