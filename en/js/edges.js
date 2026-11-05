// Soft edges between layers. Each is a wave drawn along the top of a section, and fast
// scrolling makes them wobble for a moment, like cream between two sponges.
const POINTS = 26;

export function createEdges(elements) {
  const edges = elements.map(element => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'edge');
    svg.setAttribute('viewBox', '0 0 1000 40');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(path);
    element.prepend(svg);
    return { path, seed: Math.random() * 40, width: 9 + Math.random() * 6 };
  });

  const shape = ({ path, seed, width }, energy, time) => {
    const calm = 3.2;
    const swing = calm + energy * 13;
    let d = 'M0 40';
    for (let i = 0; i <= POINTS; i++) {
      const x = i / POINTS;
      const y = 22
        + Math.sin(x * width + seed) * calm * .8
        + Math.sin(x * width * 2.6 + seed * 1.7) * calm * .4
        + Math.sin(x * 16 + time * 7 + seed) * (swing - calm);
      d += `L${(x * 1000).toFixed(0)} ${y.toFixed(1)}`;
    }
    path.setAttribute('d', `${d}L1000 40Z`);
  };

  edges.forEach(edge => shape(edge, 0, 0));

  let energy = 0;
  return {
    // call with scroll velocity; returns false once everything has gone still again
    update(velocity, time, deltaMs = 16) {
      const target = Math.min(1, Math.abs(velocity) / 3600);
      // settling is measured in time rather than frames, so slow screens settle just as fast
      const rate = target > energy ? .25 : .07;
      energy += (target - energy) * (1 - Math.pow(1 - rate, deltaMs / 16.7));
      if (energy < .01) {
        if (energy > 0) {
          energy = 0;
          edges.forEach(edge => shape(edge, 0, 0));
        }
        return false;
      }
      edges.forEach(edge => shape(edge, energy, time));
      return true;
    },
  };
}
