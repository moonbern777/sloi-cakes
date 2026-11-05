import * as textures from './textures.js';
import { createGlaze } from './glaze.js';
import { createEdges } from './edges.js';
import { startSprinkles } from './sprinkles.js';
import { startBuilder } from './builder.js';

const root = document.documentElement;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger && window.SplitText);
const stillPage = matchMedia('(prefers-reduced-motion: reduce)').matches;
const animate = hasGsap && !stillPage;

let lenis = null;
const scrollTo = selector => {
  const target = document.querySelector(selector);
  if (lenis) lenis.scrollTo(target, { duration: 1.5, easing: t => 1 - Math.pow(1 - t, 4) });
  else target.scrollIntoView();
};

// Materials are made once and shared by the CSS and the cake drawing.
const materials = {
  sponge: textures.sponge(),
  confit: textures.confit(),
  vanilla: textures.vanilla(),
  streusel: textures.streusel(),
};
Object.entries(materials).forEach(([name, url]) => root.style.setProperty(`--tex-${name}`, `url("${url}")`));

startBuilder({ animate, pores: materials.sponge, scrollTo });

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.config({ nullTargetWarn: false });
  whenFontsAreIn().then(() => {
    if (animate) lenis = startSmoothScroll();
    startMobileMenu();
    startEdges();
    startGlaze();
    startActionBar();
    if (animate) {
      startSprinkles(document.getElementById('sprinkles'), document.getElementById('hero-stage'));
      playHeroIntro();
      startStrata();
      startScrollEffects();
      startJelly();
    }
    root.classList.add('sloi-ready');
    window.sloiReady = true;
    ScrollTrigger.refresh();
  });
} else {
  root.classList.remove('js');
  startMobileMenu();
}

function whenFontsAreIn() {
  const patience = new Promise(resolve => setTimeout(resolve, 1600));
  return Promise.race([document.fonts?.ready ?? Promise.resolve(), patience]);
}

function startSmoothScroll() {
  const smooth = new Lenis({ lerp: .1, anchors: false });
  smooth.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => smooth.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !document.querySelector(link.getAttribute('href'))) return;
    event.preventDefault();
    scrollTo(link.getAttribute('href'));
  });

  const header = document.getElementById('header');
  smooth.on('scroll', ({ scroll, direction }) => {
    header.classList.toggle('is-away', direction === 1 && scroll > 200);
    header.classList.toggle('is-solid', scroll > innerHeight * .7);
  });
  return smooth;
}

function startMobileMenu() {
  const nav = document.getElementById('nav');
  const burger = document.querySelector('.burger');
  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) lenis?.stop(); else lenis?.start();
    root.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      burger.focus();
    }
  });
}

function startEdges() {
  const edges = createEdges(gsap.utils.toArray('[data-edge]'));
  if (!animate) return;
  let running = false;
  const tick = (time, deltaMs) => {
    const moving = edges.update(lenis?.velocity * 60 || 0, time, deltaMs);
    if (!moving && running) {
      gsap.ticker.remove(tick);
      running = false;
    }
  };
  lenis?.on('scroll', () => {
    if (!running) {
      running = true;
      gsap.ticker.add(tick);
    }
  });
}

function startGlaze() {
  const stage = document.getElementById('hero-stage');
  const band = matchMedia('(max-width: 960px)').matches ? 76 : 84;
  // On a phone the headline runs the full width, so every drip stays short there.
  const keepClear = () => (matchMedia('(max-width: 960px)').matches ? Infinity : innerWidth * .6);
  const glaze = createGlaze(document.getElementById('glaze'), { band, keepClear });

  if (!animate) {
    glaze.state.grow = 1;
    glaze.redraw();
    return;
  }

  gsap.to(glaze.state, { grow: 1, duration: 3.2, ease: 'power2.out', delay: .15, onUpdate: glaze.redraw });

  gsap.to(glaze.state, {
    flood: 1,
    ease: 'none',
    onUpdate: glaze.redraw,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: .4 },
  });

  let pointerX = -999;
  let nudging = false;
  const nudge = () => {
    if (!glaze.nudge(pointerX) && pointerX < -900) {
      gsap.ticker.remove(nudge);
      nudging = false;
    }
  };
  stage.addEventListener('pointermove', event => {
    pointerX = event.clientX;
    if (!nudging) {
      nudging = true;
      gsap.ticker.add(nudge);
    }
  });
  stage.addEventListener('pointerleave', () => { pointerX = -999; });
}

function startActionBar() {
  const bar = document.querySelector('.actionbar');
  ScrollTrigger.create({
    trigger: '#build',
    start: 'top 60%',
    end: 'bottom 40%',
    onToggle: self => bar.classList.toggle('is-away', self.isActive),
  });
}

const lineSplit = (target, vars = {}) => SplitText.create(target, { type: 'lines', mask: 'lines', linesClass: 'line', ...vars });

function playHeroIntro() {
  const title = lineSplit('[data-hero-title]');
  const cake = document.querySelector('#hero-cake svg');
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from(title.lines, { yPercent: 112, duration: 1.3, stagger: .1 }, .25)
    .from('.hero-copy > :not(h1)', { y: 24, autoAlpha: 0, duration: 1, stagger: .08 }, .75)
    .from(cake.querySelectorAll('.tier'), { y: -420, duration: 1.15, stagger: .22, ease: 'bounce.out' }, .2)
    .from(cake.querySelectorAll('.piece'), { y: -300, autoAlpha: 0, duration: .8, stagger: { each: .05, from: 'random' }, ease: 'power3.in' }, .85);

  // The cake drifts away from the glaze as it comes down.
  gsap.to('#hero-cake', {
    yPercent: 16,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true },
  });
}

// One layer opens at a time: scroll down through the cake and each takes over the screen.
function startStrata() {
  const bands = gsap.utils.toArray('[data-band]');
  const phone = matchMedia('(max-width: 960px)').matches;
  const small = phone ? .42 : .3;
  const scene = gsap.timeline({
    defaults: { ease: 'power2.inOut', duration: 1 },
    scrollTrigger: { trigger: '#strata', start: 'top top', end: 'bottom bottom', scrub: .4 },
  });

  bands.forEach((band, i) => {
    gsap.set(band, { flexGrow: i ? 1 : 7 });
    gsap.set(band.querySelector('h3'), { scale: i ? small : 1 });
    gsap.set(band.querySelector('p'), { autoAlpha: i ? 0 : 1, y: i ? 16 : 0 });
    if (!i) return;
    const before = bands[i - 1];
    scene
      .to(before, { flexGrow: 1 }, i - 1)
      .to(band, { flexGrow: 7 }, i - 1)
      .to(before.querySelector('h3'), { scale: small }, i - 1)
      .to(band.querySelector('h3'), { scale: 1 }, i - 1)
      .to(before.querySelector('p'), { autoAlpha: 0, duration: .4 }, i - 1)
      .to(band.querySelector('p'), { autoAlpha: 1, y: 0, duration: .5 }, i - .5);
  });
  scene.to({}, { duration: .35 });
}

function startScrollEffects() {
  gsap.utils.toArray('[data-lines]').forEach(element => {
    lineSplit(element, {
      autoSplit: true,
      onSplit: self => gsap.from(self.lines, {
        yPercent: 112, duration: 1.25, stagger: .09, ease: 'expo.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      }),
    });
  });

  gsap.utils.toArray('[data-fade]').forEach(element => {
    gsap.from(element, {
      y: 30, autoAlpha: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: element, start: 'top 88%', once: true },
    });
  });

  // Each step shrinks back a little as the next one is laid on top of it.
  const steps = gsap.utils.toArray('.step');
  steps.slice(0, -1).forEach((step, i) => {
    gsap.to(step, {
      scale: .95,
      ease: 'none',
      scrollTrigger: { trigger: steps[i + 1], start: 'top 80%', end: 'top 25%', scrub: true },
    });
  });

  gsap.from('.hit', {
    y: 90, duration: 1.3, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '#hit-list', start: 'top 88%', once: true },
  });

  gsap.fromTo('#signed', { clipPath: 'inset(-10% 100% -10% 0%)' }, {
    clipPath: 'inset(-10% -10% -10% 0%)', duration: 1.6, ease: 'power2.inOut',
    scrollTrigger: { trigger: '#signed', start: 'top 90%', once: true },
  });

  // The name is cut into layers that slide together as the page ends.
  gsap.utils.toArray('#word span').forEach((slice, i) => {
    gsap.fromTo(slice, { xPercent: (i % 2 ? 1 : -1) * (26 - i * 2) }, {
      xPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#word', start: 'top bottom', end: 'bottom bottom', scrub: .5 },
    });
  });
}

function startJelly() {
  if (!matchMedia('(hover: hover)').matches) return;
  gsap.utils.toArray('[data-jelly]').forEach(button => {
    button.addEventListener('pointerenter', () => {
      gsap.fromTo(button, { scaleX: 1.07, scaleY: .92 }, { scaleX: 1, scaleY: 1, duration: .9, ease: 'elastic.out(1.1, .32)', overwrite: true });
    });
  });
}
