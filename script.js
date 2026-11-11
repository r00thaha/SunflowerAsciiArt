'use strict';

const CW = 7, CH = 12, COARSE = matchMedia('(pointer:coarse)').matches;
const H = 192, SURF = 170;
const ROWS = 120;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const rng = s => () => (s = (s + 0x6D2B79F5) | 0, s = Math.imul(s ^ s >>> 15, s | 1), (((s ^ (s + Math.imul(s ^ s >>> 7, s | 61))) ^ s >>> 14) >>> 0) / 4294967296);

const out = document.getElementById('c'), oc = out.getContext('2d');
const off = document.createElement('canvas'), ctx = off.getContext('2d', { willReadFrequently: true });
let COLS, W, SX, SY, rnd, stars, flies, layers, props;

const LAYERS = [
  { dens: 1.1, h0: 4, h1: 12, w: 1.1, base: SURF - 1, wob: 0,  col: ['rgb(16,66,36)',  'rgb(26,92,46)']  },
  { dens: 1.4, h0: 5, h1: 16, w: 1.2, base: SURF + 1, wob: 9,  col: ['rgb(40,120,45)', 'rgb(60,152,52)']  },
  { dens: 1.5, h0: 6, h1: 21, w: 1.35, base: SURF + 4, wob: 18, col: ['rgb(88,182,60)', 'rgb(130,214,76)']  }
];

function fit() {
  const aspect = Math.max(.78, innerWidth / innerHeight);
  COLS = Math.max(90, Math.min(COARSE ? 280 : 480, Math.round(aspect * ROWS * CH / CW)));
  const eff = COLS * CW / (ROWS * CH);
  W = H * eff; SX = COLS / W; SY = ROWS / H;
  off.width = COLS; off.height = ROWS;
  out.width = COLS * CW; out.height = ROWS * CH;
  const cw = Math.min(innerWidth, innerHeight * eff);
  out.style.width = cw + 'px'; out.style.height = (cw / eff) + 'px';
  rnd = Float32Array.from({ length: COLS * ROWS }, Math.random);
  build();
}

function build() {
  const R = rng(7);
  stars = Array.from({ length: W * .5 | 0 }, (_, i) => ({ x: R() * W, y: R() * 135, sp: .8 + R() * 1.6, ph: R() * 6.28, r: .5 + R() * .45, warm: i % 4 === 0 }));
  flies = Array.from({ length: W / 14 | 0 }, () => ({ x: R() * W, y: 110 + R() * 55, ph: R() * 6.28, sp: .4 + R() * .5 }));
  layers = LAYERS.map((L, li) => {
    const v = [[], []], n = W * L.dens | 0;
    for (let i = 0; i < n; i++) {
      const x = R() * W;
      v[R() < .5 ? 0 : 1].push({
        x, h: lerp(L.h0, L.h1, Math.pow(R(), .8)),
        lean: (R() - .5) * .5,
        d: R() * 2 + Math.abs(x - W / 2) / W * 2.5 + li * .3
      });
    }
    return { ...L, v };
  });
  props = [];
  for (let i = 0, n = Math.max(3, W / 38 | 0); i < n; i++) props.push({ k: 's', x: 6 + R() * (W - 12), y: 177 + R() * 11, a: 2 + R() * 2.6, h: 1.4 + R() * 1.2 });
  for (let i = 0, n = Math.max(2, W / 80 | 0); i < n; i++) {
    const x = 10 + R() * (W - 20), y = 178 + R() * 8;
    props.push({ k: 'm', x, y, r: 3.6 + R() * 1.6 }, { k: 'm', x: x + 8 + R() * 3, y: y + 1.5, r: 2.4 + R() });
  }
  for (let i = 0, n = Math.max(2, W / 90 | 0); i < n; i++) props.push({ k: 'l', x: 8 + R() * (W - 16), y: 180 + R() * 8, a: R() * 6.28, c: R() < .5 ? 0 : 1 });
  for (let i = 0, n = Math.max(4, W / 30 | 0); i < n; i++) props.push({ k: 'd', x: 6 + R() * (W - 12), y: 176 + R() * 12, c: i % 3 });
  props.sort((a, b) => a.y - b.y);
}

const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const atlas = document.createElement('canvas');
atlas.width = 52 * CW; atlas.height = 343 * CH;
const ac = atlas.getContext('2d');
ac.font = 'bold 11px "Courier New",Courier,monospace';
ac.textAlign = 'center'; ac.textBaseline = 'middle';
ac.strokeStyle = 'rgba(0,0,0,.55)'; ac.lineWidth = 1.6; ac.lineJoin = 'round';
const built = new Uint8Array(343);
function buildRow(ci) {
  const b = ci % 7, g = (ci / 7 | 0) % 7, r = ci / 49 | 0;
  ac.fillStyle = `rgb(${r * 42.5 | 0},${g * 42.5 | 0},${b * 42.5 | 0})`;
  for (let j = 0; j < 52; j++) {
    const x = j * CW + CW / 2, y = ci * CH + CH / 2 + .5;
    ac.strokeText(AL[j], x, y); ac.fillText(AL[j], x, y);
  }
  built[ci] = 1;
}

const pools = ['ilIjtfr', 'cxzvunsoaey', 'kdbpqghFTYV', 'MWBNHKQRDEGOSAZ'].map(s => [...s].map(c => AL.indexOf(c)));

function toAscii() {
  const d = ctx.getImageData(0, 0, COLS, ROWS).data;
  for (let n = 0; n < 500; n++) rnd[Math.random() * rnd.length | 0] = Math.random();
  oc.clearRect(0, 0, out.width, out.height);
  for (let y = 0, i = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++, i++) {
      const q = i * 4, r = d[q], g = d[q + 1], b = d[q + 2];
      const lum = (r * 3 + g * 6 + b) / 10;
      if (lum < 10) continue;
      const m = Math.max(r, g, b), k = m < 200 ? Math.min(1.5, 200 / m) : 1;
      const c = v => Math.min(6, Math.round(v * k / 255 * 6));
      const ci = c(r) * 49 + c(g) * 7 + c(b);
      if (!built[ci]) buildRow(ci);
      const P = pools[lum < 60 ? 0 : lum < 110 ? 1 : lum < 170 ? 2 : 3];
      oc.drawImage(atlas, P[rnd[i] * P.length | 0] * CW, ci * CH, CW, CH, x * CW, y * CH, CW, CH);
    }
  }
}

let TT = 0;
const gustAt = T => (.75 + .45 * Math.sin(T * .37)) * (.7 + .3 * Math.sin(T * .9 + 1));
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [0, 1].map(k => u*u*u*p0[k] + 3*u*u*t*p1[k] + 3*u*t*t*p2[k] + t*t*t*p3[k]);
};
function petalPath(R, L, w) {
  ctx.beginPath(); ctx.moveTo(R * .7, 0);
  ctx.bezierCurveTo(R + L * .15, -w * 1.1, R + L * .75, -w, R + L, 0);
  ctx.bezierCurveTo(R + L * .75, w, R + L * .15, w * 1.1, R * .7, 0);
  ctx.closePath();
}
const PET = [
  { n: 26, off: 0,             len: 38, w: 6.2, c: ['rgb(150,70,0)', 'rgb(255,185,15)', 'rgb(255,232,105)'] },
  { n: 26, off: Math.PI / 26,  len: 31, w: 5.4, c: ['rgb(130,55,0)', 'rgb(255,160,10)', 'rgb(255,208,60)'] },
  { n: 18, off: .1,            len: 22, w: 4.4, c: ['rgb(110,40,0)', 'rgb(240,130,5)',  'rgb(255,180,40)'] }
];
PET.forEach(l => {
  l.list = Array.from({ length: l.n }, (_, i) => ({ i, o: ((i / l.n) * 2 * Math.PI + l.off + Math.PI) % (2 * Math.PI) - Math.PI }));
  l.list.sort((a, b) => Math.abs(b.o) - Math.abs(a.o));
});

function head(x, y, s, e) {
  const R = 13;
  for (let i = 0; i < 14; i++) {
    const o = (i / 14) * 2 * Math.PI - Math.PI;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-Math.PI / 2 + o * e * .9);
    petalPath(R * .8, 20 * (.8 + .2 * e), 3.4);
    const g = ctx.createLinearGradient(R * .8, 0, R + 20, 0);
    g.addColorStop(0, 'rgb(30,95,35)'); g.addColorStop(1, 'rgb(130,210,80)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(0,30,0,.8)'; ctx.lineWidth = .6; ctx.stroke(); ctx.restore();
  }
  PET.forEach((l, li) => {
    for (const p of l.list) {
      const j = Math.sin(p.i * 12.9898 + li * 3.1) * .5;
      const ang = -Math.PI / 2 + p.o * e + j * .05 * e + Math.sin(TT * 1.7 + p.i * .8) * .025 * e;
      const L = l.len * (1 + j * .08) * (.6 + .4 * e), w = l.w * (.55 + .45 * e);
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(ang);
      petalPath(R, L, w);
      const g = ctx.createLinearGradient(R, 0, R + L, 0);
      g.addColorStop(0, l.c[0]); g.addColorStop(.4, l.c[1]); g.addColorStop(.85, l.c[2]); g.addColorStop(1, 'rgb(255,245,170)');
      ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(90,30,0,.3)'; ctx.fillRect(0, 0, R + L + 2, w * 2); ctx.restore();
      ctx.strokeStyle = 'rgba(40,12,0,.85)'; ctx.lineWidth = .9; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,45,0,.55)';
      for (const k of [-.6, -.3, 0, .3, .6]) {
        ctx.lineWidth = k === 0 ? .7 : .4; ctx.beginPath();
        ctx.moveTo(R + L * .08, k * w * .2); ctx.quadraticCurveTo(R + L * .5, k * w * .85, R + L * .93, k * w * .12); ctx.stroke();
      }
      ctx.restore();
    }
  });
  const cr = R * s * (.5 + .5 * e);
  const rg = ctx.createRadialGradient(x - cr * .3, y - cr * .3, cr * .1, x, y, cr);
  rg.addColorStop(0, 'rgb(160,100,30)'); rg.addColorStop(1, 'rgb(40,20,8)');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, cr, 0, 7); ctx.fill();
  const N = 200;
  for (let k = 1; k <= N; k++) {
    const q = Math.sqrt(k / N), r = cr * .95 * q, th = k * 2.39996;
    ctx.fillStyle = k % 3 === 0 ? 'rgb(255,205,95)' : k % 3 === 1 ? 'rgb(205,115,30)' : 'rgb(110,55,15)';
    ctx.beginPath(); ctx.arc(x + Math.cos(th) * r, y + Math.sin(th) * r, cr * .085 * (.6 + .5 * q), 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(20,8,0,.6)'; ctx.lineWidth = .35; ctx.stroke();
  }
  ctx.strokeStyle = 'rgb(255,150,25)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, cr, 0, 7); ctx.stroke();
}

function leaf(x, y, ang, len, sc) {
  if (sc <= .02) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
  const w = len * .21, n = 26;
  ctx.beginPath(); ctx.moveTo(0, 0);
  for (let i = 1; i <= n; i++) { const t = i / n; ctx.lineTo(len * t, -Math.sin(Math.PI * Math.pow(t, .65)) * w * (i % 2 ? 1 : .84)); }
  for (let i = n; i >= 0; i--) { const t = i / n; ctx.lineTo(len * t, Math.sin(Math.PI * Math.pow(t, .65)) * w * .95 * (i % 2 ? 1 : .84)); }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, 'rgb(20,80,30)'); g.addColorStop(.6, 'rgb(75,170,60)'); g.addColorStop(1, 'rgb(150,225,95)');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(0,35,0,.7)'; ctx.lineWidth = .6; ctx.stroke();
  ctx.strokeStyle = 'rgb(200,238,150)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .96, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,45,0,.6)'; ctx.lineWidth = .5;
  for (let k = 1; k < 8; k++) {
    const t = k / 8.5, xx = len * t, d = w * Math.sin(Math.PI * t) * .9;
    ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx + len * .14, -d); ctx.moveTo(xx, 0); ctx.lineTo(xx + len * .14, d * .85); ctx.stroke();
  }
  ctx.restore();
}

const BF = [
  { o: 0,  ph: .5,  c: ['rgb(255,120,35)', 'rgb(255,205,80)'] },
  { o: 7,  ph: 2.4, c: ['rgb(70,185,255)', 'rgb(200,240,255)'] },
  { o: 14, ph: 4.3, c: ['rgb(255,110,190)', 'rgb(255,200,230)'] }
];
const CYC = 22, fr = v => v - Math.floor(v);
function butterflies(T, hx, hy, s, e) {
  if (e < .65) return;
  const al = clamp((e - .65) * 3);
  BF.forEach((b, i) => {
    const u = T + b.o, k = Math.floor(u / CYC), c = u - k * CYC;
    const orb = [hx + Math.cos(T * .6 + b.ph) * 62 + Math.sin(T * 1.7 + b.ph) * 7, hy - 8 + Math.sin(T * .9 + b.ph * 2) * 34 + Math.cos(T * 2.1 + b.ph) * 3];
    const a = fr(Math.sin(k * 12.9898 + i * 78.233) * 43758.5453) * 6.2832;
    const rr = (22 + 14 * fr(Math.sin(k * 4.1 + i) * 9731.7)) * s;
    const pp = [hx + Math.cos(a) * rr, hy + Math.sin(a) * rr];
    let p = orb, perch = false;
    if (c >= 9 && c < 11) { const q = ease((c - 9) / 2); p = [lerp(orb[0], pp[0], q), lerp(orb[1], pp[1], q)]; }
    else if (c >= 11 && c < 17) { p = pp; perch = true; }
    else if (c >= 17 && c < 18.5) { const q = ease((c - 17) / 1.5); p = [lerp(pp[0], orb[0], q), lerp(pp[1], orb[1], q)]; }
    const wf = perch ? .35 + .65 * Math.abs(Math.sin(T * 1.3 + b.ph)) : .25 + .75 * Math.abs(Math.sin(T * 13 + b.ph));
    ctx.save(); ctx.globalAlpha = al; ctx.translate(p[0], p[1]); ctx.scale(1.2, 1.2);
    ctx.rotate(perch ? 0 : Math.sin(T * 1.4 + b.ph) * .25);
    ctx.lineWidth = .6; ctx.strokeStyle = 'rgba(30,12,5,.9)';
    for (const sd of [-1, 1]) {
      ctx.fillStyle = b.c[0]; ctx.beginPath(); ctx.ellipse(sd * 4.2 * wf, -2.4, 4.4 * wf, 3.6, -sd * .5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = b.c[1]; ctx.beginPath(); ctx.ellipse(sd * 3.2 * wf, 2.4, 3.2 * wf, 2.7, sd * .4, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(sd * 5 * wf, -3, .9, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgb(30,15,8)'; ctx.beginPath(); ctx.ellipse(0, 0, .9, 4.2, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-.4, -4); ctx.lineTo(-2, -7.5); ctx.moveTo(.4, -4); ctx.lineTo(2, -7.5); ctx.stroke();
    ctx.restore();
  });
}

function drawFlower(T, F) {
  const gust = gustAt(T);
  const wv = ph => (Math.sin(T * 1.1 - ph) + .4 * Math.sin(T * 2.3 - ph * 1.7)) * gust + act * (mxs / W * 2 - 1) * .9;
  const u = clamp(F / 8), g = .5 * ease(u) + .5 * Math.sin(u * Math.PI / 2);
  const lg = ease(clamp((F - 3) / 4.5)), e = ease(clamp((F - 6) / 7));
  const s = .5 + .5 * g, hy = lerp(SURF, 52, g) + Math.sin(T * .9) * .5 * g, hx = 76 + wv(1.7) * 8 * g;
  HD.x = hx + W / 2 - 76; HD.y = hy; HD.s = s; HD.e = e;
  const P0 = [76, SURF], P3 = [hx, hy];
  const P1 = [66 + wv(.3) * 2 * g, lerp(SURF, hy, .35)], P2 = [88 + wv(1) * 5 * g, lerp(SURF, hy, .7)];
  ctx.save(); ctx.translate(W / 2 - 76, 0);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  ctx.beginPath(); ctx.moveTo(...P0); ctx.bezierCurveTo(...P1, ...P2, ...P3);
  ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 6.4 * (.7 + .3 * s); ctx.stroke();
  ctx.strokeStyle = 'rgb(70,170,60)'; ctx.lineWidth = 3.8 * (.7 + .3 * s); ctx.stroke();
  ctx.save(); ctx.translate(-.7, 0); ctx.strokeStyle = 'rgb(150,225,110)'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();

  const L1 = clamp(lg * 1.2 - .1);
  let p = bez(P0, P1, P2, P3, .42);
  leaf(p[0], p[1], lerp(3 * Math.PI / 2, Math.PI + .55, ease(lg)) + wv(1.1) * .09 * g, 58, lg);
  p = bez(P0, P1, P2, P3, .68);
  leaf(p[0], p[1], lerp(-Math.PI / 2, -.5, ease(L1)) + wv(1.4) * .09 * g, 50, L1);
  p = bez(P0, P1, P2, P3, .2);
  leaf(p[0], p[1], lerp(-Math.PI / 2, -.15, ease(L1)) + wv(.8) * .08 * g, 36, L1);
  p = bez(P0, P1, P2, P3, .8);
  leaf(p[0], p[1], lerp(3 * Math.PI / 2, Math.PI + .9, ease(L1)) + wv(1.6) * .08 * g, 30, L1);

  if (F > 10) {
    const lc = ((F - 10) % 42) / 42, u = lerp(.06, .9, clamp(lc / .92)), al = clamp(lc / .04) * clamp((.94 - lc) / .08);
    if (al > 0) {
      const q = bez(P0, P1, P2, P3, u), q2 = bez(P0, P1, P2, P3, u + .01);
      ctx.save(); ctx.globalAlpha = al; ctx.translate(q[0] + 1.2, q[1]); ctx.rotate(Math.atan2(q2[1] - q[1], q2[0] - q[0]));
      ctx.fillStyle = 'rgb(215,35,30)'; ctx.strokeStyle = 'rgb(40,12,8)'; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 2.8, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3.2, 0); ctx.lineTo(2.2, 0); ctx.stroke();
      ctx.fillStyle = 'rgb(25,12,10)';
      for (const [dx, dy] of [[-1.4, -1.4], [-1.4, 1.4], [.6, -1.1], [.6, 1.1]]) { ctx.beginPath(); ctx.arc(dx, dy, .6, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.arc(3.3, 0, 1.5, 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  ctx.save(); ctx.translate(hx, hy); ctx.rotate((wv(2) * .09 + .35 * (1 - e)) * g + lookA * e); ctx.translate(-hx + lookX * 3.5 * e, -hy + lookY * 2.5 * e);
  head(hx, hy, s, e);
  butterflies(T, hx, hy, s, e);
  ctx.restore();
  const pf = clamp((F - 9) / 3);
  if (pf > 0) for (let i = 0; i < 7; i++) {
    const ph = (T * .9 + i * 3.1) % 8, px = hx + Math.sin(i * 5.3) * 30 + Math.sin(ph * 1.6 + i) * 12 + ph * 3, py = hy + 10 + ph * 20;
    if (py > SURF - 2) continue;
    ctx.save(); ctx.globalAlpha = pf * clamp(1.2 - ph / 8); ctx.translate(px, py); ctx.rotate(ph * 2 + i); ctx.scale(.55, .55);
    petalPath(0, 12, 3.6); ctx.fillStyle = 'rgb(255,190,25)'; ctx.fill(); ctx.restore();
  }
  if (e > .6) {
    const a = T * .9, bx = hx + Math.cos(a) * (46 + 8 * Math.sin(T * .5)), by = hy - 12 + Math.sin(a * 2) * 16, fw = 1.4 + Math.abs(Math.sin(T * 50)) * 2.4;
    ctx.save(); ctx.globalAlpha = clamp((e - .6) * 3); ctx.translate(bx, by); ctx.scale(1.3, 1.3);
    ctx.fillStyle = 'rgba(225,245,255,.9)';
    ctx.beginPath(); ctx.ellipse(-1, -4, 3.2, fw, -.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.5, -4, 3.2, fw, .5, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgb(255,200,20)'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgb(25,15,5)'; ctx.fillRect(-1.8, -3, 1.3, 6); ctx.fillRect(1.2, -3, 1.3, 6); ctx.restore();
  }

  for (let i = 0; i < 36; i++) {
    const f = (i * 37.7) % 1, y = 194 - ((T * (5 + f * 7) + i * 23) % 190), x = 76 + Math.sin(i * 7.3 + T * .4) * (20 + i * 1.4);
    ctx.globalAlpha = e * .9; ctx.fillStyle = i % 2 ? 'rgb(255,215,90)' : 'rgb(255,150,60)';
    ctx.beginPath(); ctx.arc(x, y, .9, 0, 7); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

let t0 = performance.now(), last = 0, mx = 0, mxs = 0, act = 0, over = false;
const ptr = { x: 0, y: 0 }, HD = { x: 0, y: 0, s: 1, e: 0 };
let lookA = 0, lookX = 0, lookY = 0, fx = [], ripples = [], fxT = 0, fT0 = null, stage = 0, sprouts = [];

function drawBackdrop(T) {
  ctx.fillStyle = '#000'; ctx.fillRect(-2, 0, W + 4, H);
  for (const s of stars) {
    const tw = .5 + .5 * Math.sin(T * s.sp + s.ph);
    ctx.globalAlpha = (.25 + .6 * tw) * clamp(T / 2);
    ctx.fillStyle = s.warm ? 'rgb(255,230,170)' : 'rgb(190,210,255)';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
  }
  drawMoon(T);

  const ss = (T % 9) / 1.2;
  if (ss < 1) {
    const x = 20 + ((T / 9 | 0) * 47) % (W - 60) + ss * 40, y = 8 + ss * 22;
    ctx.globalAlpha = 1 - ss; ctx.strokeStyle = 'rgb(240,245,255)'; ctx.lineWidth = .9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y - 6); ctx.stroke();
  }

  drawHills(T);
  const fa = clamp((T - 3) / 3);
  for (const f of flies) {
    const bl = Math.max(0, Math.sin(T * 1.3 + f.ph * 3));
    if (bl <= 0) continue;
    const x = f.x + Math.sin(T * f.sp + f.ph) * 8, y = f.y + Math.cos(T * f.sp * .8 + f.ph) * 7;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 4);
    g.addColorStop(0, `rgba(255,240,140,${.9 * bl})`); g.addColorStop(1, 'rgba(255,240,140,0)');
    ctx.globalAlpha = fa; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMoon(T) {
  const mx = Math.max(26, Math.min(W * .2, W / 2 - 140)), my = 26, fa = clamp((T - 1) / 3);
  ctx.globalAlpha = fa;
  const hg = ctx.createRadialGradient(mx, my, 8, mx, my, 34); hg.addColorStop(0, 'rgba(200,215,255,.35)'); hg.addColorStop(1, 'rgba(200,215,255,0)');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(mx, my, 34, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(mx - 3, my - 3, 1, mx, my, 10);
  g.addColorStop(0, 'rgb(255,252,232)'); g.addColorStop(1, 'rgb(214,214,196)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, 10, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(150,150,132,.5)';
  for (const [dx, dy, cr] of [[-3.5, -2, 2.2], [3, 2.5, 1.8], [2, -4.5, 1.2], [-2, 4.5, 1.4]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, cr, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  const span = W + 140;
  for (const [off, y, sp, sc, a] of [[mx + 28, my + 1, 4.2, 1.1, .34], [30, 12, 2.6, .8, .26], [120, 50, 3.4, 1.3, .22], [200, 72, 2.2, .9, .2]]) {
    const x = ((T * sp + off) % span) - 70;
    ctx.fillStyle = `rgba(150,165,215,${a * fa})`;
    for (const [dx, dy, r] of [[0, 0, 7], [8, -3, 9], [17, 0, 8], [25, 2, 6], [-7, 2, 5]]) {
      ctx.beginPath(); ctx.ellipse(x + dx * sc, y + dy * sc, r * sc * 1.5, r * sc * .55, 0, 0, 7); ctx.fill();
    }
  }
}

function drawProps() {
  const INK = 'rgba(25,14,6,.85)';
  ctx.lineWidth = .6; ctx.lineJoin = 'round';
  for (const p of props) {
    if (p.k === 's') {
      ctx.fillStyle = 'rgb(112,108,100)'; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.a, p.h, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgb(165,160,148)'; ctx.beginPath(); ctx.ellipse(p.x - p.a * .25, p.y - p.h * .35, p.a * .5, p.h * .4, 0, 0, 7); ctx.fill();
    } else if (p.k === 'd') {
      const pc = ['rgb(245,243,250)', 'rgb(255,170,205)', 'rgb(150,150,255)'][p.c];
      ctx.strokeStyle = 'rgb(40,120,45)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 5.5); ctx.stroke();
      ctx.fillStyle = pc; ctx.strokeStyle = INK; ctx.lineWidth = .4;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(p.x + Math.cos(i * 1.047) * 1.9, p.y - 6 + Math.sin(i * 1.047) * 1.9, 1.5, .8, i * 1.047, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = 'rgb(255,200,50)'; ctx.beginPath(); ctx.arc(p.x, p.y - 6, 1, 0, 7); ctx.fill(); ctx.lineWidth = .6;
    } else if (p.k === 'm') {
      const sh = p.r * 1.1, sw = p.r * .38;
      ctx.fillStyle = 'rgb(236,220,188)'; ctx.fillRect(p.x - sw / 2, p.y - sh, sw, sh);
      ctx.beginPath(); ctx.ellipse(p.x, p.y - sh, p.r, p.r * .8, 0, Math.PI, 2 * Math.PI); ctx.closePath();
      ctx.fillStyle = 'rgb(205,52,46)'; ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgb(255,240,225)';
      for (const [dx, dy, r] of [[-.45, -.3, .17], [.3, -.5, .14], [.05, -.15, .12]]) { ctx.beginPath(); ctx.arc(p.x + dx * p.r, p.y - sh + dy * p.r, r * p.r, 0, 7); ctx.fill(); }
    } else {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, .7);
      ctx.beginPath(); ctx.moveTo(-5.5, 0); ctx.quadraticCurveTo(-1, -3.4, 5.5, 0); ctx.quadraticCurveTo(-1, 3.4, -5.5, 0); ctx.closePath();
      ctx.fillStyle = p.c ? 'rgb(214,160,42)' : 'rgb(190,92,26)'; ctx.fill(); ctx.strokeStyle = 'rgba(60,25,5,.85)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6.5, 0); ctx.lineTo(4, 0); ctx.strokeStyle = 'rgba(95,40,8,.9)'; ctx.lineWidth = .5; ctx.stroke();
      ctx.restore(); ctx.lineWidth = .6;
    }
  }
}

function drawGround() {
  const g = ctx.createLinearGradient(0, SURF - 2, 0, H);
  g.addColorStop(0, 'rgb(78,48,22)'); g.addColorStop(1, 'rgb(26,14,6)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2, H);
  for (let x = -2; x <= W + 4; x += 5) ctx.lineTo(x, SURF + Math.sin(x * .12) * 1.2);
  ctx.lineTo(W + 4, H); ctx.closePath(); ctx.fill();
  for (let i = 0; i < W * .4; i++) {
    ctx.fillStyle = i % 2 ? 'rgb(120,80,40)' : 'rgb(55,30,14)';
    ctx.fillRect((i * 37.7) % W, SURF + 2 + (i * 7.3) % 20, 1.2, .8);
  }
  drawProps();
}

function drawGrass(T, from, to) {
  const gust = gustAt(T);
  ctx.lineCap = 'round';
  for (const L of layers.slice(from, to)) {
    for (let v = 0; v < 2; v++) {
      ctx.beginPath();
      for (const b of L.v[v]) {
        const gr = ease(clamp((T - b.d) / 3));
        if (gr <= 0) continue;
        const h = b.h * gr, x = b.x + L.wob;
        const wave = Math.sin(T * 1.1 - x * .03) + .4 * Math.sin(T * 2.3 - x * .052);
        const dx = b.x - mxs;
        const push = act * Math.exp(-(dx * dx) / 256) * Math.sign(dx) * .45;
        let rp = 0;
        for (const q of ripples) {
          const a = T - q.t;
          if (a < 0 || a > 3.5) continue;
          const d = b.x - q.x, df = Math.abs(d) - a * 85;
          rp += Math.exp(-df * df / 260) * Math.exp(-a) * (d < 0 ? -1 : 1);
        }
        const bend = h * (b.lean + wave * gust * .2 + push + rp * .9);
        ctx.moveTo(b.x, L.base);
        ctx.quadraticCurveTo(b.x + bend * .3, L.base - h * .6, b.x + bend, L.base - h);
      }
      ctx.strokeStyle = L.col[v]; ctx.lineWidth = L.w; ctx.stroke();
    }
  }
  return gust;
}

const rr = () => Math.random();
function burstHead() {
  sfx('sparkle');
  const { x, y, s } = HD;
  for (let i = 0; i < 30; i++) {
    const a = rr() * 6.283, sp = 35 + rr() * 70;
    fx.push({ k: 'p', x: x + Math.cos(a) * 10 * s, y: y + Math.sin(a) * 10 * s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, r: rr() * 6.28, vr: (rr() - .5) * 12, sc: .7 + rr() * .6, c: i % 3 ? 'rgb(255,195,30)' : 'rgb(255,140,10)', life: 0, max: 2.4 + rr() * 1.4 });
  }
  for (let i = 0; i < 46; i++) {
    const a = rr() * 6.283, sp = 20 + rr() * 85;
    fx.push({ k: 's', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rr() * 6, sc: 1 + rr() * 1.1, c: rr() < .5 ? 'rgb(255,236,150)' : 'rgb(255,250,226)', life: 0, max: .7 + rr() * .9 });
  }
}
function burstGrass(x, y, T) {
  sfx('grass');
  ripples.push({ x, t: T });
  fx.push({ k: 'r', x, y: clamp(y, SURF - 6, SURF + 8), life: 0, max: 1.8 });
  for (let i = 0; i < 16; i++) {
    const a = -rr() * Math.PI, sp = 15 + rr() * 40;
    fx.push({ k: 'f', x: x + (rr() - .5) * 8, y: y - rr() * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ph: rr() * 6.28, life: 0, max: 4 + rr() * 2.5 });
  }
}
function drawFx(T) {
  const dt = clamp(T - fxT, 0, .1); fxT = T;
  for (const p of fx) p.life += dt;
  fx = fx.filter(p => p.life < p.max);
  for (const p of fx) {
    const k = p.life / p.max;
    if (p.k === 'r') {
      for (const d of [0, .22]) {
        const a = p.life - d; if (a <= 0) continue;
        const rx = a * 52;
        ctx.globalAlpha = clamp(1 - a / (p.max - d)) * .85; ctx.strokeStyle = 'rgb(190,255,170)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, rx * .2, 0, 0, 7); ctx.stroke();
      }
      continue;
    }
    if (p.k === 'p') {
      const dr = 1 - 1.2 * dt;
      p.vx *= dr; p.vy = p.vy * dr + 40 * dt;
      p.x += (p.vx + Math.sin(p.life * 5 + p.r) * 14) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.y > SURF + 4) { p.y = SURF + 4; p.vy = 0; p.vx = 0; p.vr = 0; }
      ctx.save(); ctx.globalAlpha = k < .7 ? 1 : (1 - k) / .3; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(p.sc, p.sc);
      petalPath(0, 12, 3.6); ctx.fillStyle = p.c; ctx.fill(); ctx.restore();
    } else if (p.k === 'h') {
      if (p.life < 0) continue;
      const e1 = ease(clamp(p.life / 1.5)), x = p.x + p.tx * e1 + Math.sin(p.life * 2 + p.ph) * .8, y = p.y + p.ty * e1 + Math.cos(p.life * 1.7 + p.ph) * .8 + k * k * 8;
      const z = p.sc * (1 - k * .5) * (.75 + .25 * Math.sin(p.life * 14 + p.ph));
      ctx.globalAlpha = clamp((1 - k) * 2.2); ctx.fillStyle = p.c; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? z * .5 : z * 2.2; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); }
      ctx.closePath(); ctx.fill();
    } else if (p.k === 'n') {
      if (p.life < 0) continue;
      const a = ease(clamp(p.life / 3)), o = clamp((p.life - 15) / 3);
      const x = lerp(p.x0, p.tx, a) + Math.sin(p.life * 2 + p.ph) * (1 + (1 - a) * 6) + o * o * p.dx;
      const y = lerp(p.y0, p.ty, a) + Math.cos(p.life * 1.7 + p.ph) * (1 + (1 - a) * 5) - o * o * 24;
      const al = (.7 + .3 * Math.sin(p.life * 5 + p.ph)) * clamp(p.life / .6) * (1 - o);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 4.5);
      g.addColorStop(0, `rgba(255,240,140,${al})`); g.addColorStop(1, 'rgba(255,240,140,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,252,215,${al})`; ctx.beginPath(); ctx.arc(x, y, .9, 0, 7); ctx.fill();
    } else if (p.k === 's') {
      const dr = 1 - 2 * dt; p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt;
      const z = p.sc * (1 - k * .6) * (.75 + .25 * Math.sin(p.life * 30 + p.r));
      ctx.globalAlpha = clamp((1 - k) * 1.6); ctx.fillStyle = p.c; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? z * .5 : z * 2.2; ctx[i ? 'lineTo' : 'moveTo'](p.x + Math.cos(a) * q, p.y + Math.sin(a) * q); }
      ctx.closePath(); ctx.fill();
    } else {
      const dr = 1 - 1.8 * dt; p.vx *= dr; p.vy *= dr;
      p.x += (p.vx + Math.sin(p.life * 3 + p.ph) * 8) * dt; p.y += (p.vy - 7 + Math.cos(p.life * 2.3 + p.ph) * 7) * dt;
      const bl = .6 + .4 * Math.sin(p.life * 9 + p.ph), al = bl * clamp(Math.min(p.life / .2, (p.max - p.life))) ;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4.5);
      g.addColorStop(0, `rgba(255,240,140,${.95 * al})`); g.addColorStop(1, 'rgba(255,240,140,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 7); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* =========================================================
   CHANGE THE FIREFLY NAME HERE (letters, spaces, max ~10 chars)
   ========================================================= */
const FIREFLY_NAME = 'MARIA';

/* 5x7 pixel font for A–Z and space */
const GLY = {
  ' ': '...../...../...../...../...../...../.....',
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.####/#..../#..../#..../#..../#..../.####',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.####/#..../#..../#.###/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '#####/..#../..#../..#../..#../..#../#####',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#...#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./...#./...#./####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#...#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/...#./..#../.#.../#..../#..../#####'
};

function spellName() {
  const raw = FIREFLY_NAME.toUpperCase().replace(/[^A-Z ]/g, '');
  if (!raw.length) return;

  const letters = [...raw];
  const colsPer = 6.5;                 
  const totalCols = letters.length * colsPer - 1.5;
  
  // Position the name on the LEFT SIDE so it does not block the flower in the center
  const maxAvailableWidth = Math.max(45, (W / 2) - 45);
  const pitch = Math.min(3.6, maxAvailableWidth / Math.max(totalCols, 6));
  const x0 = 16;  // Left Margin
  const y0 = 65;  // Height on left side

  let n = 0;
  letters.forEach((ch, li) => {
    const glyph = GLY[ch] || GLY[' '];
    glyph.split('/').forEach((row, ry) => {
      [...row].forEach((c, cx) => {
        if (c !== '#') return;
        fx.push({
          k: 'n',
          x0: rr() * (W / 2),
          y0: 40 + rr() * 80,
          tx: x0 + (li * colsPer + cx) * pitch,
          ty: y0 + ry * pitch,
          ph: rr() * 6.28,
          dx: (rr() - .5) * 40,
          life: -(n++) * .035,
          max: 18
        });
      });
    });
  });
  sfx('sparkle');
}

const WS = { on: false, x: 0, y: 0, cyc: -1, used: -1, hinted: false };
function drawWish(T, F) {
  WS.on = false;
  if (fT0 === null || F < 20) return;
  const u = F - 20, cyc = u / 26 | 0, q = (u % 26) / 7;
  if (q >= 1 || WS.used === cyc) return;
  const x = W * (.95 - .36 * q), y = 8 + 52 * q, sl = 52 / (.36 * W);
  WS.on = true; WS.cyc = cyc; WS.x = x; WS.y = y;
  if (!WS.hinted) { WS.hinted = true; hint.textContent = 'A SHOOTING STAR! TAP IT TO MAKE A WISH'; hint.hidden = false; setTimeout(() => { hint.hidden = true; }, 7000); }
  const al = clamp(Math.min(q / .08, (1 - q) / .1));
  for (let i = 0; i < 16; i++) { const t = i / 16; ctx.globalAlpha = al * (1 - t) * .85; ctx.fillStyle = 'rgb(255,235,160)'; ctx.beginPath(); ctx.arc(x + t * 34, y - t * 34 * sl, 2 * (1 - t) + .4, 0, 7); ctx.fill(); }
  ctx.globalAlpha = al;
  const gl = ctx.createRadialGradient(x, y, 0, x, y, 10 + 2 * Math.sin(T * 8)); gl.addColorStop(0, 'rgba(255,245,200,.9)'); gl.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgb(255,252,225)'; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 1.3 : 4; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}
function makeWish() {
  WS.used = WS.cyc; WS.on = false; hint.hidden = true; sfx('wish');
  for (let i = 0; i < 90; i++) {
    const t = i / 90 * 6.2832, hx = 16 * Math.sin(t) ** 3, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    fx.push({ k: 'h', x: WS.x, y: WS.y, tx: hx * 1.5, ty: hy * 1.5, ph: rr() * 6.28, sc: 1 + rr() * .9, c: i % 3 ? 'rgb(255,150,190)' : 'rgb(255,236,170)', life: -i * .006, max: 3.4 });
  }
}
const PC = ['rgb(255,190,25)', 'rgb(255,130,175)', 'rgb(160,130,255)', 'rgb(245,245,250)'];
function sprout(x, y) {
  sprouts.push({ x, y: clamp(y, SURF + 1, SURF + 9), t: TT, h: 14 + rr() * 16, r: 3.4 + rr() * 1.4, k: rr() < .55 ? 0 : 1 + (rr() * 3 | 0), ph: rr() * 6.28 });
  if (sprouts.length > 16) sprouts.shift();
}
function drawSprouts(T) {
  ctx.lineCap = 'round';
  for (const s of sprouts) {
    const a = clamp((T - s.t) / 2.6), g = ease(a), b = ease(clamp((a - .55) / .45));
    const sw = (Math.sin(T * 1.3 + s.ph) * 1.2 + gustAt(T) * Math.sin(T * 1.1 - s.x * .03) * 1.5) * g;
    const hx = s.x + sw, hy = s.y - s.h * g;
    ctx.strokeStyle = 'rgb(30,110,40)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.x + sw * .2, s.y - s.h * g * .55, hx, hy); ctx.stroke();
    if (g > .3) for (const sd of [-1, 1]) { ctx.fillStyle = 'rgb(60,150,55)'; ctx.beginPath(); ctx.ellipse(s.x + sd * 3.2 * g, s.y - s.h * g * (sd > 0 ? .45 : .3), 3.2 * g, 1.2 * g, -sd * .5, 0, 7); ctx.fill(); }
    if (b <= 0) { ctx.fillStyle = 'rgb(70,170,60)'; ctx.beginPath(); ctx.arc(hx, hy, 1.4 * g, 0, 7); ctx.fill(); continue; }
    const r = s.r * b, n = s.k ? 8 : 14;
    ctx.fillStyle = PC[s.k]; ctx.strokeStyle = 'rgba(40,12,0,.8)'; ctx.lineWidth = .4;
    for (let i = 0; i < n; i++) { const an = i / n * 6.283 + s.ph; ctx.beginPath(); ctx.ellipse(hx + Math.cos(an) * r * .95, hy + Math.sin(an) * r * .95, r * (s.k ? .62 : .72), r * .3, an, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = s.k ? 'rgb(255,205,60)' : 'rgb(95,50,15)'; ctx.beginPath(); ctx.arc(hx, hy, r * (s.k ? .42 : .55), 0, 7); ctx.fill();
  }
}

function drawHills(T) {
  ctx.globalAlpha = clamp((T - .5) / 2);
  const f1 = x => 146 + Math.sin(x * .018 + 1) * 8 + Math.sin(x * .05 + 2) * 3, f2 = x => 156 + Math.sin(x * .026 + 3) * 6 + Math.sin(x * .07 + 6) * 2;
  const fill = (fn, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-2, SURF + 4); for (let x = -2; x <= W + 4; x += 4) ctx.lineTo(x, fn(x)); ctx.lineTo(W + 4, SURF + 4); ctx.closePath(); ctx.fill(); };
  fill(f1, 'rgb(14,24,52)');
  const cx = W * .8, cy = f1(cx);
  ctx.fillStyle = 'rgb(8,14,32)'; ctx.fillRect(cx - 5, cy - 6, 10, 7);
  ctx.beginPath(); ctx.moveTo(cx - 7, cy - 6); ctx.lineTo(cx, cy - 12); ctx.lineTo(cx + 7, cy - 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,205,110,${.75 + .25 * Math.sin(T * 5) * Math.sin(T * 1.7)})`; ctx.fillRect(cx - 1.5, cy - 4.5, 3, 3);
  fill(f2, 'rgb(10,38,34)');
  ctx.fillStyle = 'rgb(6,26,24)';
  for (let i = 0; i * 15 + 5 < W; i++) {
    const x = i * 15 + 5 + (i * 7 % 6), y = f2(x) + 1, h = 9 + (i * 5 % 7);
    for (let j = 0; j < 3; j++) { const ap = y - h + j * h * .25; ctx.beginPath(); ctx.moveTo(x, ap); ctx.lineTo(x - 2 - j * 1.5, ap + h * .45); ctx.lineTo(x + 2 + j * 1.5, ap + h * .45); ctx.closePath(); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

function drawSeed(T) {
  const x = W / 2, y = SURF + 1, p = .5 + .5 * Math.sin(T * 2.4);
  const g = ctx.createRadialGradient(x, y - 2, 0, x, y - 2, 20);
  g.addColorStop(0, `rgba(255,220,120,${.55 + .3 * p})`); g.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 2, 20, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgb(255,225,150)'; ctx.strokeStyle = 'rgb(70,40,15)'; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.ellipse(x, y - 2, 3.8, 2.5, -.4, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgb(120,75,30)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x - 2.4, y - 3); ctx.lineTo(x + 1.6, y - 1); ctx.moveTo(x - 1.2, y - 3.8); ctx.lineTo(x + 2.4, y - 1.8); ctx.stroke();
  for (let i = 0; i < 6; i++) { const q = (T * .5 + i / 6) % 1; ctx.globalAlpha = Math.sin(q * Math.PI) * .9; ctx.fillStyle = 'rgb(255,235,160)'; ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.1 + T) * 9, y - 3 - q * 24, 1, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}

let AC = null;
function actx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; }
function tone(f, d, dur, v) {
  const a = actx(); if (!a) return;
  const t = a.currentTime + d, o = a.createOscillator(), g = a.createGain();
  o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function swish(d, dur, v, f0, f1) {
  const a = actx(); if (!a) return;
  const n = a.sampleRate * dur | 0, buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
  const t = a.currentTime + d, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; fl.type = 'bandpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * .4); g.gain.linearRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t);
}
const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5, 1568];
function sfx(k) {
  if (k === 'grow') { swish(0, 6, .09, 300, 1800); [196, 261.6, 329.6].forEach((f, i) => tone(f, 1 + i * 1.6, 3, .05)); }
  else if (k === 'bloom') PENT.forEach((f, i) => { tone(f, i * .16, 1.8, .07); tone(f * 2, i * .16 + .03, 1.2, .025); });
  else if (k === 'sparkle') for (let i = 0; i < 4; i++) tone(PENT[3 + (rr() * 5 | 0)], i * .07, .6, .05);
  else if (k === 'grass') { swish(0, .7, .08, 1500, 500); tone(PENT[rr() * 4 | 0] / 2, .05, .8, .04); }
  else if (k === 'crack') { swish(0, .14, .18, 4000, 900); tone(150, 0, .15, .12); tone(90, .03, .2, .08); }
  else if (k === 'wish') [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, i * .09, 1.4, .06));
}

function frame(now) {
  requestAnimationFrame(frame);
  if (now - last < (COARSE ? 40 : 33)) return;
  last = now;
  const T = (now - t0) / 1000, F = fT0 === null ? 0 : (now - fT0) / 1000;
  mxs += (mx - mxs) * .1; act += ((over ? 1 : 0) - act) * .08;
  const tr = over ? 1 : 0, ux = clamp((ptr.x - HD.x) / 110, -1, 1), uy = clamp((ptr.y - HD.y) / 110, -1, 1);
  lookA += (tr * ux * .5 - lookA) * .04; lookX += (tr * ux - lookX) * .04; lookY += (tr * uy - lookY) * .04;
  if (ripples.length) ripples = ripples.filter(q => T - q.t < 3.6);
  TT = T;
  showEnv(F > ENV_AT);
  rep.hidden = F < REPLAY_AT;
  ctx.setTransform(SX, 0, 0, SY, 0, 0);
  drawBackdrop(T);
  drawGround();
  drawGrass(T, 0, 2);
  if (fT0 !== null) drawFlower(T, F);
  drawSprouts(T);
  drawGrass(T, 2, 3);
  if (fT0 === null) drawSeed(T);
  else {
    if (stage < 1 && F > 6) { stage = 1; sfx('bloom'); }
    if (stage < 2 && F > 12.2) { stage = 2; burstHead(); }
    if (stage < 3 && F > 16) { 
      stage = 3; 
      spellName(); 
      hint.textContent = FIREFLY_NAME.trim().toUpperCase();
      hint.hidden = false;
      setTimeout(() => { hint.hidden = true; }, 5000);
    }
  }
  drawWish(T, F);
  drawFx(T);
  drawEnvelope(clock());
  ctx.globalAlpha = 1;
  toAscii();
}

function setPtr(e) {
  const r = out.getBoundingClientRect();
  ptr.x = mx = (e.clientX - r.left) / r.width * W;
  ptr.y = (e.clientY - r.top) / r.height * H;
  over = e.clientY > r.top && e.clientY < r.bottom;
}
addEventListener('pointermove', setPtr);
document.addEventListener('pointerleave', () => over = false);
addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(() => over = false, 3500); });
out.addEventListener('pointerdown', e => {
  setPtr(e);
  if (fT0 === null) return;
  if (WS.on && Math.hypot(ptr.x - WS.x, ptr.y - WS.y) < 16) return makeWish();
  if (HD.e > .5 && Math.hypot(ptr.x - HD.x, ptr.y - HD.y) < 52 * HD.s) burstHead();
  else if (ptr.y > SURF - 30) { burstGrass(ptr.x, ptr.y, TT); sprout(ptr.x, ptr.y); }
  else if (!fx.some(p => p.k === 'n')) spellName();
});

const mu = document.getElementById('m'), hint = document.getElementById('h');
let musicOn = false, starting = false;

function startMusic() {
  if (musicOn || starting) return;
  starting = true;
  mu.volume = 0;
  mu.play().then(() => {
    musicOn = true; starting = false;
    const from = performance.now();
    (function fade() { const k = clamp((performance.now() - from) / 2500); mu.volume = .7 * k; if (k < 1) requestAnimationFrame(fade); })();
  }).catch(() => { starting = false; });
}

document.addEventListener('visibilitychange', () => {
  if (musicOn) document.hidden ? mu.pause() : mu.play().catch(() => {});
  if (!document.hidden && AC) AC.resume().catch(() => {});
});

function typeTitle() { hint.hidden = true; }
function begin() {
  if (fT0 !== null) return;
  fT0 = performance.now(); stage = 0; hint.hidden = true;
  actx(); startMusic(); typeTitle(); sfx('grow');
  burstGrass(W / 2, SURF, TT);
  for (let i = 0; i < 24; i++) { const a = -rr() * Math.PI, sp = 20 + rr() * 50; fx.push({ k: 's', x: W / 2, y: SURF, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rr() * 6, sc: 1 + rr(), c: 'rgb(255,236,150)', life: 0, max: .8 + rr() * .8 }); }
}
addEventListener('click', e => { if (!e.target.closest('button')) { begin(); startMusic(); } });
addEventListener('touchend', e => { if (!e.target.closest('button')) begin(); });
addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) begin(); });

const LETTER = `My Señorita Maria,

Quiero darte las gracias por siempre hacerme sentir apreciado, valorado y amado. Significa mucho más para mí de lo que imaginas, y por eso siempre intento hacerte sentir de la misma manera. Nunca quiero que doubts de lo importante que eres para mí ni que sientas que tu presencia y tus esfuerzos pasan desapercibidos. También quiero que sepas que nunca me voy a cansar de escucharte. Ya sea que quieras contarme cómo estuvo tu día, hablarme de tus problemas o simplemente compartir cualquier cosa conmigo, siempre estaré feliz de escucharte. Nunca serás una carga para mí. Sinceramente, quiero ser esa persona con la que puedas hablar de cualquier cosa, sabiendo que siempre voy a dedicarte tiempo.

Forever yours,
Your Manolo`;
const ENV_AT = 14;
const SEAL = 'A';
const REPLAY_AT = 13.5;
const EW = 64, EH = 42, EY = 160;
const env = document.getElementById('env'), paper = document.getElementById('paper');
const closeBtn = document.getElementById('x'), rep = document.getElementById('r');
const letterEl = document.getElementById('letter'), sheet = document.querySelector('.sheet');
const chars = [], delays = [];
let written = false;
(function buildLetter() {
  const per = Math.min(.045, 22 / Math.max(1, LETTER.length));
  let t = .7;
  for (const ch of LETTER) {
    const sp = document.createElement('span');
    sp.className = 'ch'; sp.textContent = ch; sp.style.animationDelay = t.toFixed(2) + 's';
    letterEl.appendChild(sp); chars.push(sp); delays.push(t);
    t += ch === '\n' ? .35 : /\s/.test(ch) ? per * .6 : per;
  }
  letterEl.setAttribute('role', 'article'); letterEl.setAttribute('aria-label', LETTER);
})();
function follow(from, i = 0) {
  if (paper.hidden || letterEl.classList.contains('done') || !chars.length) return;
  const el = (performance.now() - from) / 1000;
  while (i < delays.length - 1 && delays[i + 1] < el) i++;
  const need = chars[i].offsetTop + chars[i].offsetHeight + 36 - sheet.clientHeight;
  if (need > sheet.scrollTop) sheet.scrollTop = need;
  if (i < delays.length - 1) requestAnimationFrame(() => follow(from, i));
}
sheet.addEventListener('click', () => letterEl.classList.add('done'));
let estate = 'hidden', eT0 = 0, popT0 = 0, hideTimer = 0, sealT = -1;
const clock = () => performance.now() / 1000;
const envX = () => Math.min(W - EW / 2 - 8, W / 2 + 150);

function placeEnv() {
  const r = out.getBoundingClientRect();
  Object.assign(env.style, {
    left: r.left + (envX() - EW / 2) / W * r.width + 'px', top: r.top + (EY - EH / 2) / H * r.height + 'px',
    width: EW / W * r.width + 'px', height: EH / H * r.height + 'px'
  });
}
function openLetter() {
  clearTimeout(hideTimer); paper.hidden = false;
  if (written) letterEl.classList.add('done');
  else { written = true; follow(performance.now()); }
  requestAnimationFrame(() => paper.classList.add('on')); closeBtn.focus();
}
function closeLetter() {
  if (paper.hidden || !paper.classList.contains('on')) return;
  paper.classList.remove('on');
  hideTimer = setTimeout(() => { paper.hidden = true; }, 400);
  if (estate === 'open') { estate = 'closing'; eT0 = clock(); }
  env.focus();
}
function showEnv(on) {
  if (on && estate === 'hidden') { estate = 'pop'; popT0 = eT0 = clock(); }
  else if (!on && estate !== 'hidden') {
    estate = 'hidden'; sealT = -1; env.classList.remove('live');
    clearTimeout(hideTimer); paper.classList.remove('on'); paper.hidden = true;
  }
}
env.addEventListener('click', () => {
  if (estate === 'closed') { estate = 'opening'; eT0 = sealT = clock(); sfx('crack'); }
  else if (estate === 'open') openLetter();
});
closeBtn.addEventListener('click', closeLetter);
paper.addEventListener('click', e => { if (e.target === paper) closeLetter(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeLetter(); });
rep.addEventListener('click', e => { e.stopPropagation(); t0 = performance.now(); fT0 = null; stage = 0; fx = []; ripples = []; sprouts = []; WS.hinted = false; WS.used = -1; hint.textContent = 'TAP ANYWHERE TO PLANT THE SEED'; hint.hidden = false; });

function heart(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * .9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .7, y - s * 1.2, x, y - s * .4);
  ctx.bezierCurveTo(x + s * .7, y - s * 1.2, x + s * 1.6, y - s * .2, x, y + s * .9);
  ctx.fill();
}

function drawEnvelope(now) {
  if (estate === 'hidden') return;
  const t = now - eT0;
  let f = 0, r = 0;
  if (estate === 'pop' && t > 1.2) { estate = 'closed'; env.classList.add('live'); placeEnv(); }
  else if (estate === 'opening') {
    f = ease(clamp(t / .7)); r = ease(clamp((t - .5) / .9));
    if (t > 1.5) { estate = 'open'; openLetter(); }
  } else if (estate === 'open') { f = 1; r = 1; }
  else if (estate === 'closing') {
    r = 1 - ease(clamp(t / .7)); f = 1 - ease(clamp((t - .5) / .6));
    if (t > 1.2) estate = 'closed';
  }
  const kf = estate === 'pop' ? clamp(t / 1.1) : 1;
  const bobAmp = estate === 'closed' ? clamp((now - popT0 - 1.2) / 1.2) : 0;
  const fly = k => {
    const x = 1 - Math.pow(1 - k, 3);
    return [lerp(W + EW, envX(), x), EY - Math.sin(Math.PI * k) * 26 * (1 - k * .3) + Math.sin(now * 2.2) * 1.2 * bobAmp, (1 - x) * -.9 + Math.sin(k * 9) * (1 - k) * .12];
  };
  const [cx, cy, rot] = fly(kf);
  const hw = EW / 2, hh = EH / 2, fh = 27, INK = 'rgb(55,32,12)';
  const grad = (y0, y1, a, b) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const poly = (pts, fill) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.stroke();
  };
  const c = Math.cos(f * Math.PI);
  const flap = () => {
    ctx.save(); ctx.translate(0, -hh); ctx.scale(1, c || .001);
    poly([[-hw, 0], [hw, 0], [0, fh]], c >= 0 ? grad(0, fh, 'rgb(214,172,110)', 'rgb(176,132,76)') : grad(0, fh, 'rgb(160,118,64)', 'rgb(128,90,46)'));
    ctx.restore();
  };
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  poly([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], grad(-hh, hh, 'rgb(196,152,92)', 'rgb(150,108,56)'));
  ctx.globalAlpha = f; poly([[-hw, -hh], [hw, -hh], [0, -hh + fh]], 'rgb(95,66,34)'); ctx.globalAlpha = 1;
  if (c < 0) flap();
  const py = r * 30;
  poly([[-27, -16 - py], [27, -16 - py], [27, 18 - py], [-27, 18 - py]], grad(-16 - py, 18 - py, 'rgb(244,228,178)', 'rgb(220,194,138)'));
  ctx.strokeStyle = 'rgba(90,55,25,.75)'; ctx.lineWidth = .9;
  for (let i = 0; i < 5; i++) { const y = -9 - py + i * 5.5, w = i === 4 ? 12 : 20; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke(); }
  poly([[-hw, -hh], [0, -hh + fh], [hw, -hh], [hw, hh], [-hw, hh]], grad(-hh, hh, 'rgb(226,190,126)', 'rgb(186,144,86)'));
  ctx.strokeStyle = 'rgba(95,62,28,.6)'; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.moveTo(-hw, hh); ctx.lineTo(-6, 2); ctx.moveTo(hw, hh); ctx.lineTo(6, 2); ctx.stroke();
  if (c >= 0) flap();
  const sa = sealT >= 0 ? 0 : 1 - clamp(f * 5);
  if (sa > 0) {
    const sy = -hh + fh * c - 4, sr = 6.5 * (1 + (estate === 'closed' ? .07 * Math.sin(now * 4) : 0));
    ctx.globalAlpha = sa;
    const g = ctx.createRadialGradient(-1.5, sy - 1.5, .5, 0, sy, sr);
    g.addColorStop(0, 'rgb(225,80,90)'); g.addColorStop(1, 'rgb(135,28,38)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, sy, sr, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = .8; ctx.stroke();
    ctx.fillStyle = 'rgb(255,222,205)'; ctx.font = 'bold 9px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(SEAL, 0, sy + .6);
    if (estate === 'closed') {
      const ph = (now * .8) % 1;
      ctx.globalAlpha = (1 - ph) * .8; ctx.strokeStyle = 'rgb(255,200,130)';
      ctx.beginPath(); ctx.arc(0, sy, sr + 1 + ph * 9, 0, 7); ctx.stroke();
    }
  }
  if (sealT >= 0) {
    const bt = now - sealT;
    if (bt < 1.5) {
      const pts = [[1.4, 3.5], [-.8, 1], [1.2, -1.5], [-.6, -3.8]];
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.globalAlpha = 1 - clamp((bt - .5) / 1);
        ctx.translate(sd * bt * 12, 2 + bt * bt * 38); ctx.rotate(sd * bt * 1.4);
        ctx.beginPath(); ctx.arc(0, 0, 6.5, sd > 0 ? -Math.PI / 2 : Math.PI / 2, sd > 0 ? Math.PI / 2 : 1.5 * Math.PI);
        for (const [x, y] of sd > 0 ? pts : [...pts].reverse()) ctx.lineTo(x, y);
        ctx.closePath(); ctx.fillStyle = 'rgb(175,38,50)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = .8; ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = 'rgb(200,50,60)';
      for (let i = 0; i < 10; i++) { const a = i * .63 + 1, k = bt / 1.2; if (k > 1) break; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(Math.cos(a) * 18 * k, 2 + Math.sin(a) * 10 * k + 30 * k * k, 1, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  const pa = now - popT0;
  if (pa > 1.1 && pa < 2.4) for (let i = 0; i < 16; i++) {
    const a = i * 2.4 + 1, k = (pa - 1.1) / 1.3, sp = 14 + (i % 5) * 7;
    ctx.globalAlpha = 1 - k; ctx.fillStyle = i % 2 ? 'rgb(255,215,90)' : 'rgb(255,150,180)';
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * sp * k * 1.6, EY - 8 + Math.sin(a) * sp * k - 14 * k, 1.1, 0, 7); ctx.fill();
  }
  if (estate === 'pop') for (let i = 1; i <= 7; i++) {
    const kk = kf - i * .035;
    if (kk <= 0) continue;
    const [tx, ty] = fly(kk);
    ctx.globalAlpha = (1 - i / 8) * .8; ctx.fillStyle = i % 2 ? 'rgb(255,215,90)' : 'rgb(255,150,180)';
    ctx.beginPath(); ctx.arc(tx + 6 + i * 1.5, ty + (i % 3 - 1) * 4, 1.2, 0, 7); ctx.fill();
  }
  if (estate === 'closed') for (let i = 0; i < 4; i++) {
    const ph = (now * .3 + i * .25) % 1;
    ctx.globalAlpha = Math.sin(ph * Math.PI) * .9; ctx.fillStyle = i % 2 ? 'rgb(255,105,135)' : 'rgb(255,170,190)';
    heart(cx + (i - 1.5) * 11 + Math.sin(ph * 6 + i) * 3, cy - hh - 4 - ph * 30, 2.4);
  }
  ctx.globalAlpha = 1;
}

document.getElementById('p').addEventListener('click', async e => {
  e.stopPropagation();
  const c = document.createElement('canvas'); c.width = out.width; c.height = out.height;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.drawImage(out, 0, 0);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  if (!blob) return;
  const name = 'sunflower-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png';
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
  try {
    const dl = typeof claude !== 'undefined' ? await claude.use('downloads') : null;
    if (dl) { await dl.save({ filename: name, data: blob }); return; }
  } catch (err) { if (err && err.code === 'declined') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

addEventListener('resize', fit);
addEventListener('resize', placeEnv);
addEventListener('orientationchange', () => setTimeout(() => { fit(); placeEnv(); }, 300));
fit();
requestAnimationFrame(frame);