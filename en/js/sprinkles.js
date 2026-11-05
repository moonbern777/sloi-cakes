// Sprinkles fall when the page opens, bounce, and settle along the bottom of the first
// screen. The pointer scatters them. Nothing is drawn once they have all come to rest.
const COLORS = ['#c9134f', '#f0b429', '#7fa650', '#fff', '#5b2c1e', '#f7a8c4'];

export function startSprinkles(canvas, host) {
  const context = canvas.getContext('2d');
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const pointer = { x: -999, y: -999, active: false };
  let width = 0;
  let height = 0;
  let pieces = [];
  let frame = null;
  let onScreen = true;

  function resize() {
    const box = host.getBoundingClientRect();
    width = box.width;
    height = box.height;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint();
  }

  function seed() {
    const count = Math.round(Math.min(110, width / 13));
    pieces = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: -40 - Math.random() * height * 1.1 - i * 3,
      vx: (Math.random() - .5) * .9,
      vy: Math.random() * 2,
      turn: Math.random() * 6.28,
      spin: (Math.random() - .5) * .3,
      length: 13 + Math.random() * 11,
      color: COLORS[i % COLORS.length],
      resting: false,
    }));
  }

  function paint() {
    context.clearRect(0, 0, width, height);
    for (const p of pieces) {
      if (p.y < -30) continue;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.turn);
      context.fillStyle = p.color;
      context.beginPath();
      context.roundRect(-p.length / 2, -2.8, p.length, 5.6, 2.8);
      context.fill();
      context.fillStyle = 'rgba(255, 255, 255, .34)';
      context.beginPath();
      context.roundRect(-p.length / 2 + 2, -2, p.length - 4, 1.4, .7);
      context.fill();
      context.restore();
    }
  }

  function step() {
    const floor = height - 5;
    let awake = false;
    for (const p of pieces) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const near = dx * dx + dy * dy;
      if (pointer.active && near < 8100) {
        const push = (1 - near / 8100) * 2.2;
        const distance = Math.sqrt(near) || 1;
        p.vx += dx / distance * push;
        p.vy += dy / distance * push - .5;
        p.resting = false;
      }
      if (p.resting) continue;
      awake = true;
      p.vy += .24;
      p.vx *= .992;
      p.x += p.vx;
      p.y += p.vy;
      p.turn += p.spin;
      if (p.x < 0 || p.x > width) p.vx *= -.6;
      p.x = Math.min(width, Math.max(0, p.x));
      if (p.y >= floor) {
        p.y = floor;
        p.vy *= -.34;
        p.vx *= .68;
        p.spin *= .55;
        // come to rest lying flat, whichever way it landed
        const flat = Math.round(p.turn / Math.PI) * Math.PI;
        p.turn += (flat - p.turn) * .45;
        if (Math.abs(p.vy) < .9 && Math.abs(p.vx) < .12) {
          p.vy = p.vx = p.spin = 0;
          p.turn = flat;
          p.resting = true;
        }
      }
    }
    return awake;
  }

  // Physics runs at a fixed rate whatever the screen does, 60 Hz or 120 Hz or a slow phone.
  const STEP = 1000 / 60;
  let last = 0;
  let debt = 0;

  function loop(now) {
    frame = null;
    if (!onScreen) return;
    debt += Math.min(now - last, 250);
    last = now;
    let awake = true;
    while (debt >= STEP) {
      awake = step();
      debt -= STEP;
    }
    paint();
    if (awake) frame = requestAnimationFrame(loop);
  }

  const wake = () => {
    if (frame === null && onScreen) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  };

  host.addEventListener('pointermove', event => {
    const box = host.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.active = true;
    wake();
  });
  host.addEventListener('pointerleave', () => { pointer.active = false; });

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) wake();
  }).observe(canvas);

  resize();
  seed();
  new ResizeObserver(() => {
    const previous = height;
    resize();
    if (Math.abs(previous - height) > 2) for (const p of pieces) if (p.resting) p.y = height - 5;
    paint();
  }).observe(host);
  wake();
}
