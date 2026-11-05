// Cake materials, drawn once on a canvas and reused as tiling images.
// Everything wraps around the tile edges so no seam shows when it repeats.
const SIZE = 440;

function tile(paint) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext('2d');
  const wrapped = (x, y, reach, draw) => {
    for (const dx of [0, x < reach ? SIZE : x > SIZE - reach ? -SIZE : null]) {
      for (const dy of [0, y < reach ? SIZE : y > SIZE - reach ? -SIZE : null]) {
        if (dx !== null && dy !== null) draw(x + dx, y + dy);
      }
    }
  };
  paint(context, wrapped);
  return canvas.toDataURL('image/png');
}

// Air pockets in a sponge: mostly tiny, a few large, slightly darker with a lit lower lip.
export function sponge() {
  return tile((c, wrapped) => {
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const big = Math.random() < .07;
      const r = big ? 2.4 + Math.random() * 3.8 : .6 + Math.random() * 1.5;
      const squash = .55 + Math.random() * .45;
      const turn = Math.random() * 3.14;
      wrapped(x, y, r + 2, (px, py) => {
        c.fillStyle = `rgba(95, 52, 10, ${big ? .3 : .17 + Math.random() * .12})`;
        c.beginPath();
        c.ellipse(px, py, r, r * squash, turn, 0, 6.3);
        c.fill();
        if (big) {
          c.fillStyle = 'rgba(255, 244, 214, .26)';
          c.beginPath();
          c.ellipse(px, py + r * .55, r * .8, r * squash * .35, turn, 0, 6.3);
          c.fill();
        }
      });
    }
  });
}

// Raspberry confit: seeds and a few broken pieces of fruit.
export function confit() {
  return tile((c, wrapped) => {
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const r = 8 + Math.random() * 26;
      wrapped(x, y, r, (px, py) => {
        c.fillStyle = `rgba(${Math.random() < .5 ? '120, 6, 46' : '255, 90, 140'}, ${.05 + Math.random() * .1})`;
        c.beginPath();
        c.ellipse(px, py, r, r * .6, Math.random() * 3.14, 0, 6.3);
        c.fill();
      });
    }
    for (let i = 0; i < 170; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const turn = Math.random() * 3.14;
      wrapped(x, y, 4, (px, py) => {
        c.fillStyle = 'rgba(244, 200, 130, .8)';
        c.beginPath();
        c.ellipse(px, py, 2.5, 1.5, turn, 0, 6.3);
        c.fill();
        c.fillStyle = 'rgba(255, 255, 255, .5)';
        c.beginPath();
        c.arc(px - .6, py - .6, .6, 0, 6.3);
        c.fill();
      });
    }
  });
}

// Vanilla cream: pale, with black specks from the bean.
export function vanilla() {
  return tile((c, wrapped) => {
    for (let i = 0; i < 640; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const r = .35 + Math.random() * .85;
      wrapped(x, y, 2, (px, py) => {
        c.fillStyle = `rgba(52, 30, 16, ${.3 + Math.random() * .5})`;
        c.beginPath();
        c.arc(px, py, r, 0, 6.3);
        c.fill();
      });
    }
  });
}

// Streusel: uneven baked lumps, each lit from above.
export function streusel() {
  return tile((c, wrapped) => {
    for (let i = 0; i < 420; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const r = 5 + Math.random() * 15;
      const tone = Math.random();
      const corners = Array.from({ length: 7 }, (_, k) => [k * .9, r * (.7 + Math.random() * .5)]);
      wrapped(x, y, r + 4, (px, py) => {
        const path = new Path2D();
        corners.forEach(([a, d], k) => path[k ? 'lineTo' : 'moveTo'](px + Math.cos(a) * d, py + Math.sin(a) * d * .78));
        path.closePath();
        c.fillStyle = 'rgba(52, 24, 6, .4)';
        c.save();
        c.translate(1.5, 3);
        c.fill(path);
        c.restore();
        c.fillStyle = tone > .66 ? 'rgba(176, 118, 62, .8)' : tone > .33 ? 'rgba(150, 96, 46, .8)' : 'rgba(122, 76, 34, .8)';
        c.fill(path);
      });
    }
  });
}
