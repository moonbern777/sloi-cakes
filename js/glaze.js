// Raspberry glaze running down from the top of the page. Scrolling keeps it flowing
// until it fills the screen, which is how the page moves into the next layer.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createGlaze(svg, { band, keepClear = () => 0 }) {
  const fill = svg.querySelector('#glaze-fill');
  const shine = svg.querySelector('#glaze-shine');
  const state = { grow: 0, flood: 0 };
  let drips = [];
  let width = 0;
  let height = 0;
  let queued = false;

  function layout() {
    width = svg.clientWidth;
    height = svg.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const unit = clamp(width / 15, 30, 92);
    const copyEnd = keepClear();
    drips = [];
    let x = -unit * .2;
    while (x < width + unit) {
      const r = unit * (.15 + Math.random() * .17);
      // Long runs only over the cake side, so the headline stays readable.
      const room = copyEnd > 0 && x < copyEnd ? .085 : .36;
      drips.push({
        x,
        r,
        length: height * (.05 + Math.pow(Math.random(), 1.8) * room),
        delay: Math.random() * .4,
        reach: 0,
        phase: Math.random() * 6.28,
      });
      x += r * 2 + unit * (.26 + Math.random() * .44);
    }
    draw();
  }

  function draw() {
    queued = false;
    if (!width) return;
    const flood = state.flood;
    const base = band + flood * flood * height * 1.2;
    const skirt = 14;
    let d = `M0 -2H${width}V${base.toFixed(1)}`;
    let lines = '';

    for (let i = drips.length - 1; i >= 0; i--) {
      const drip = drips[i];
      const grown = clamp((state.grow - drip.delay) / (1 - drip.delay), 0, 1);
      const r = drip.r * (1 + flood * 1.3);
      const length = Math.max(skirt + r, drip.length * grown * grown * (3 - 2 * grown) + drip.reach + flood * height * .5);
      const right = drip.x + r;
      const left = drip.x - r;
      const bottom = base + length;

      d += `L${(right + skirt).toFixed(1)} ${base.toFixed(1)}`;
      d += `C${(right + skirt * .25).toFixed(1)} ${base.toFixed(1)} ${right.toFixed(1)} ${(base + skirt * .25).toFixed(1)} ${right.toFixed(1)} ${(base + skirt).toFixed(1)}`;
      d += `V${(bottom - r).toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${left.toFixed(1)} ${(bottom - r).toFixed(1)}`;
      d += `V${(base + skirt).toFixed(1)}`;
      d += `C${left.toFixed(1)} ${(base + skirt * .25).toFixed(1)} ${(left - skirt * .25).toFixed(1)} ${base.toFixed(1)} ${(left - skirt).toFixed(1)} ${base.toFixed(1)}`;

      if (length > r * 2.4) {
        const lineX = left + r * .55;
        lines += `M${lineX.toFixed(1)} ${(base + skirt + 4).toFixed(1)}V${(bottom - r * 1.25).toFixed(1)}`;
      }
    }
    d += `L0 ${base.toFixed(1)}Z`;
    fill.setAttribute('d', d);
    shine.setAttribute('d', lines);
  }

  const redraw = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  };

  // Drips nearest the pointer run a little further, as if the page had been tilted.
  function nudge(pointerX) {
    let moved = false;
    for (const drip of drips) {
      const near = clamp(1 - Math.abs(drip.x - pointerX) / 150, 0, 1);
      const target = near * near * 46;
      if (Math.abs(target - drip.reach) > .3) {
        drip.reach += (target - drip.reach) * .14;
        moved = true;
      }
    }
    if (moved) redraw();
    return moved;
  }

  new ResizeObserver(layout).observe(svg);
  layout();

  return { state, redraw, nudge };
}
