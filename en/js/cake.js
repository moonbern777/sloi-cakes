// Recipes, prices and the cake drawing. The drawing is a side view cut down the middle:
// the left half shows the frosting, the right half shows what is inside.

export const FLAVORS = {
  vanilla: { name: 'Vanilla and raspberry', kg: 45, frost: '#fff3ec', sponge: '#f7dfa8', cream: '#fffaf2', fill: '#d81e5b', glaze: '#c9134f' },
  choco: { name: 'Chocolate and cherry', kg: 48, frost: '#4a2318', sponge: '#5b2c1e', cream: '#e9c9a8', fill: '#7a0c24', glaze: '#2b120a' },
  pistachio: { name: 'Pistachio and strawberry', kg: 55, frost: '#eaf2d8', sponge: '#cbe3a6', cream: '#fffaf0', fill: '#e94e6e', glaze: '#8fb56a' },
  carrot: { name: 'Carrot and orange', kg: 42, frost: '#fff7ea', sponge: '#d98e3f', cream: '#fff6e4', fill: '#f0a63a', glaze: '#e8963a' },
  velvet: { name: 'Red velvet', kg: 46, frost: '#fff9f5', sponge: '#a31621', cream: '#fff6ee', fill: '#fff6ee', glaze: '#a31621' },
};

export const DECOR = [
  { id: 'berries', name: 'Fresh berries', price: 12 },
  { id: 'flowers', name: 'Fresh flowers', price: 18 },
  { id: 'macaron', name: 'Macarons', price: 14 },
  { id: 'drip', name: 'Dripping glaze', price: 8 },
  { id: 'gold', name: 'Gold crumbs', price: 10 },
];

export const rub = n => `$${Math.round(n).toLocaleString('en-US')}`;
export const weightText = w => `${w} kg`;

export function weightFor(guests) {
  return Math.max(1.5, Math.round(guests * .15 * 10) / 10);
}

export function sizeFor(weight, tiers) {
  if (tiers === 3) return '28, 20 and 14 cm';
  if (tiers === 2) return weight <= 4 ? '20 and 14 cm' : '26 and 18 cm';
  return weight <= 2 ? '16 cm' : weight <= 3 ? '20 cm' : '24 cm';
}

export function priceFor({ flavor, guests, tiers, decor }) {
  
  const base = Math.ceil(Math.round(weightFor(guests) * FLAVORS[flavor].kg) / 5) * 5;
  const extras = DECOR.filter(d => decor.includes(d.id)).reduce((sum, d) => sum + d.price, 0);
  return base + extras + (tiers - 1) * 15;
}

export const allowedTiers = guests => [1, 2, 3].filter(t => (t === 1 ? guests <= 24 : t === 2 ? guests >= 12 : guests >= 20));

const TIER_SIZES = { 1: [[370, 196]], 2: [[380, 150], [256, 128]], 3: [[400, 122], [286, 108], [184, 98]] };
const PLATE_Y = 468;
const CENTER = 280;
let uid = 0;

const escapeXml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function random(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Layers are soft, so no edge between them is ever quite straight.
function wavy(x0, x1, y, amp, seed, reverse = false) {
  const points = [];
  const steps = Math.max(4, Math.round((x1 - x0) / 14));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (x1 - x0) * i / steps;
    points.push(`${x.toFixed(1)} ${(y + amp * (Math.sin(x * .045 + seed) + .5 * Math.sin(x * .12 + seed * 2.3))).toFixed(1)}`);
  }
  if (reverse) points.reverse();
  return points.join('L');
}

function cutFace(f, x, y, w, h, seed, ids) {
  const wall = 10;
  const left = x + w / 2;
  const right = x + w - wall;
  const inner = h - wall;
  const bands = [['sponge', .27], ['cream', .075], ['fill', .09], ['sponge', .27], ['cream', .075], ['sponge', .22]];
  let bottom = y + h;
  let out = '';
  bands.forEach(([key, share], n) => {
    const top = bottom - inner * share;
    const amp = key === 'sponge' ? 1.1 : 1.8;
    const shape = `M${wavy(left, right, top, amp, seed + n)}L${right} ${(bottom + 1).toFixed(1)}L${left} ${(bottom + 1).toFixed(1)}Z`;
    out += `<path d="${shape}" fill="${f[key]}"/>`;
    if (key === 'sponge') out += `<path d="${shape}" fill="url(#${ids.pores})"/>`;
    bottom = top;
  });
  return `<g class="cut">${out}</g>`
    + `<rect x="${left}" y="${y + wall}" width="26" height="${h - wall}" fill="url(#${ids.seam})"/>`
    + `<rect x="${left}" y="${y + wall}" width="${w / 2 - wall}" height="9" fill="#000" opacity=".07"/>`;
}

function frosting(f, x, y, w, h, ids) {
  const wall = 10;
  const mid = x + w / 2;
  const shell = `M${x} ${y + h}V${y + 14}Q${x} ${y} ${x + 14} ${y}H${x + w - 14}Q${x + w} ${y} ${x + w} ${y + 14}V${y + h}H${x + w - wall}V${y + wall}H${mid}V${y + h}Z`;
  const side = `M${x} ${y + h}V${y + 14}Q${x} ${y} ${x + 14} ${y}H${mid}V${y + h}Z`;
  return `<path d="${shell}" fill="${f.frost}"/><path d="${side}" fill="url(#${ids.round})"/>`
    + `<rect x="${x + w - wall}" y="${y + 12}" width="${wall}" height="${h - 12}" fill="#000" opacity=".06"/>`;
}

// A row of piped shells around the foot of each tier.
function piping(f, x, y, w, h) {
  const size = 11;
  const count = Math.floor(w / size);
  let d = `M${x} ${y + h}`;
  for (let i = 0; i < count; i++) d += `q${(w / count / 2).toFixed(1)} -${size * 1.25} ${(w / count).toFixed(1)} 0`;
  return `<path d="${d}Z" fill="${f.frost}"/><path d="${d}" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="1"/>`;
}

function glaze(f, x, y, w, h, seed, ids) {
  const rng = random(seed * 977 + 13);
  const mid = x + w / 2;
  const count = Math.max(5, Math.round(w / 2 / 30));
  const step = (w / 2 - 12) / count;
  let d = `M${x + 12} ${y - 1}H${mid}V${y + 7}`;
  let shine = '';
  let at = mid;
  for (let i = 0; i < count; i++) {
    const length = (16 + rng() * 40) * h / 120;
    const r = step / 2 - 2.5;
    const next = at - step;
    d += `C${at - 1} ${y + 9} ${at - 2} ${y + 9} ${at - 2} ${y + 11}`;
    d += `V${y + length}a${r} ${r} 0 0 1 -${r * 2} 0V${y + 11}`;
    d += `C${next + 2} ${y + 9} ${next + 1} ${y + 9} ${next} ${y + 7}`;
    shine += `<path d="M${at - 2 - r * 1.3} ${y + 12}V${y + length - 1}" stroke="#fff" stroke-opacity=".32" stroke-width="2" stroke-linecap="round"/>`;
    at = next;
  }
  d += `Q${x} ${y + 7} ${x + 12} ${y - 1}Z`;
  return `<path d="${d}" fill="${f.glaze}"/><rect x="${mid}" y="${y - 1}" width="${w / 2 - 12}" height="9" rx="4" fill="${f.glaze}"/>${shine}`
    + `<rect x="${x + 16}" y="${y + 1}" width="${w - 34}" height="2.4" rx="1.2" fill="#fff" opacity=".28"/>`;
}

function raspberry(x, y, ids) {
  const offsets = [[0, 0], [-5, -3], [5, -3], [-6, 3], [6, 3], [0, 6], [-2.5, -7], [3, -7], [0, -2]];
  const beads = offsets.map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="4" fill="url(#${ids.berry})"/>`).join('');
  return `<g class="piece"><path d="M${x - 5} ${y - 9}Q${x} ${y - 14} ${x + 5} ${y - 9}L${x} ${y - 6}Z" fill="#6f8f45"/>${beads}</g>`;
}

function blueberry(x, y, ids) {
  return `<g class="piece"><circle cx="${x}" cy="${y}" r="9" fill="url(#${ids.blue})"/><path d="M${x - 3} ${y - 6.5}l3 2 3-2-1 3.5h-4z" fill="#1c1d4f"/></g>`;
}

function flower(x, y, r, color, ids) {
  let petals = '';
  for (let a = 0; a < 5; a++) {
    petals += `<ellipse cx="${x}" cy="${y - r * .78}" rx="${r * .62}" ry="${r * .86}" fill="${color}" stroke="#000" stroke-opacity=".05" transform="rotate(${a * 72} ${x} ${y})"/>`;
  }
  return `<g class="piece">${petals}<circle cx="${x}" cy="${y}" r="${r * .42}" fill="url(#${ids.pollen})"/></g>`;
}

function macaron(x, y, color) {
  return `<g class="piece"><path d="M${x - 16} ${y - 2}q0 -9 16 -9t16 9z" fill="${color}"/><rect x="${x - 15}" y="${y - 2}" width="30" height="2.4" fill="#000" opacity=".1"/>`
    + `<rect x="${x - 14}" y="${y}" width="28" height="4.4" rx="1" fill="#fff6ee"/><path d="M${x - 16} ${y + 5}q0 7 16 7t16 -7z" fill="${color}"/>`
    + `<path d="M${x - 10} ${y - 7}q6 -2.4 12 -1" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
}

function goldFlakes(box, seed, ids) {
  const rng = random(seed * 31 + 5);
  let out = '';
  for (let i = 0; i < 20; i++) {
    const x = box.x + 10 + rng() * (box.w / 2 - 22);
    const y = box.y + 16 + rng() * (box.h - 30);
    const s = 1.6 + rng() * 3.6;
    const a = rng() * 6.28;
    const corners = [0, 1.7, 3.3, 4.9].map(k => `${(x + Math.cos(a + k) * s * (.7 + rng() * .6)).toFixed(1)} ${(y + Math.sin(a + k) * s * (.7 + rng() * .6)).toFixed(1)}`);
    out += `<polygon class="piece" points="${corners.join(' ')}" fill="url(#${ids.gold})"/>`;
  }
  return out;
}

function topper(text, top) {
  const width = Math.min(300, text.length * 13.5 + 44);
  const lift = 72;
  return `<g class="piece topper"><path d="M${CENTER - width * .28} ${top.y + 2}V${top.y - lift + 34}M${CENTER + width * .28} ${top.y + 2}V${top.y - lift + 34}" stroke="#b8893a" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="${CENTER - width / 2}" y="${top.y - lift}" width="${width}" height="40" rx="9" fill="#fffdf9" stroke="#e7c7d0"/>`
    + `<text x="${CENTER}" y="${top.y - lift + 27}" text-anchor="middle" font-family="Marck Script, cursive" font-size="23" fill="#4a0e1f">${escapeXml(text)}</text></g>`;
}

export function renderCake({ flavor, tiers, decor, text = '' }, pores) {
  const f = FLAVORS[flavor];
  const n = ++uid;
  const ids = {
    pores: `pores${n}`, seam: `seam${n}`, round: `round${n}`, berry: `berry${n}`, blue: `blue${n}`,
    pollen: `pollen${n}`, gold: `gold${n}`, plate: `plate${n}`, shadow: `shadow${n}`,
  };

  let y = PLATE_Y;
  const boxes = [];
  let layers = '';
  TIER_SIZES[tiers].forEach(([w, h], i) => {
    y -= h;
    const x = CENTER - w / 2;
    boxes.push({ x, y, w, h });
    layers += `<g class="tier" data-tier="${i}">`
      + `<ellipse cx="${CENTER}" cy="${y + h}" rx="${w / 2 + 6}" ry="7" fill="#000" opacity=".1"/>`
      + cutFace(f, x, y, w, h, i + 2, ids)
      + frosting(f, x, y, w, h, ids)
      + piping(f, x, y, w, h)
      + (decor.includes('drip') ? glaze(f, x, y, w, h, i + 1, ids) : '')
      + '</g>';
  });

  const top = boxes[boxes.length - 1];
  const dressing = [];

  if (decor.includes('gold')) boxes.forEach((box, i) => dressing.push(goldFlakes(box, i + 1, ids)));

  if (decor.includes('macaron')) {
    const colors = ['#f7a8c4', '#b7dd9a', '#f4d06f', '#c7b5ec'];
    if (tiers === 1) {
      dressing.push(macaron(top.x + 42, top.y - 14, colors[0]), macaron(top.x + 84, top.y - 14, colors[3]), macaron(top.x + top.w - 42, top.y - 14, colors[1]));
    } else {
      boxes.slice(0, -1).forEach((box, i) => {
        const ledge = (box.w - boxes[i + 1].w) / 2;
        dressing.push(macaron(box.x + ledge / 2, box.y - 14, colors[i % 4]), macaron(box.x + box.w - ledge / 2, box.y - 14, colors[(i + 1) % 4]));
      });
    }
  }

  if (decor.includes('flowers')) {
    const base = boxes[0];
    dressing.push(
      flower(base.x + 30, base.y + base.h - 24, 15, '#f7b5cb', ids),
      flower(base.x + 64, base.y + base.h - 14, 11, '#fff', ids),
      flower(base.x + 12, base.y + base.h - 52, 10, '#ffd9c7', ids),
      flower(top.x + top.w * .26, top.y - 10, 12, '#f7b5cb', ids),
      flower(top.x + top.w * .42, top.y - 7, 9, '#fff', ids),
    );
  }

  if (decor.includes('berries')) {
    const count = Math.max(4, Math.floor(top.w / 38));
    for (let i = 0; i < count; i++) {
      const px = top.x + 20 + i * (top.w - 40) / (count - 1);
      const py = top.y - 9 - (i % 2) * 3;
      dressing.push(i % 3 === 1 ? blueberry(px, py, ids) : raspberry(px, py, ids));
    }
  }

  if (text) dressing.push(topper(text, top));

  const stand = `M64 ${PLATE_Y}h432q7 0 7 6.500t-7 6.500h-160q-20 0-26 14l-6 16q-3 8 8 9h24q10 1 10 8v2h-172v-2q0-7 10-8h24q11-1 8-9l-6-16q-6-14-26-14h-160q-7 0-7-6.500t7-6.500z`;

  return `<svg viewBox="0 0 560 560" aria-hidden="true"><defs>
    ${pores ? `<pattern id="${ids.pores}" width="220" height="220" patternUnits="userSpaceOnUse"><image href="${pores}" width="220" height="220"/></pattern>` : `<pattern id="${ids.pores}" width="8" height="8" patternUnits="userSpaceOnUse"/>`}
    <linearGradient id="${ids.seam}"><stop offset="0" stop-color="#000" stop-opacity=".26"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="${ids.round}"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".22" stop-color="#000" stop-opacity=".03"/><stop offset=".55" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="${ids.berry}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f4557f"/><stop offset=".6" stop-color="#c8144f"/><stop offset="1" stop-color="#7f0a31"/></radialGradient>
    <radialGradient id="${ids.blue}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#7f83c9"/><stop offset=".55" stop-color="#3f4291"/><stop offset="1" stop-color="#1e1f55"/></radialGradient>
    <radialGradient id="${ids.pollen}"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#e9a93a"/></radialGradient>
    <linearGradient id="${ids.gold}" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset=".5" stop-color="#d4a437"/><stop offset="1" stop-color="#8f6a1c"/></linearGradient>
    <linearGradient id="${ids.plate}" x2="0" y2="1"><stop offset="0" stop-color="var(--stand-hi, #fff)"/><stop offset="1" stop-color="var(--stand-lo, #d9cfc4)"/></linearGradient>
    <radialGradient id="${ids.shadow}"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="${CENTER}" cy="536" rx="180" ry="15" fill="url(#${ids.shadow})"/>
  <path d="${stand}" fill="url(#${ids.plate})"/>
  <g class="tiers">${layers}</g>
  <g class="dressing">${dressing.join('')}</g></svg>`;
}
