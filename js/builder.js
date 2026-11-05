import { FLAVORS, DECOR, allowedTiers, priceFor, renderCake, rub, sizeFor, weightFor, weightText } from './cake.js';

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const HITS = [
  { name: 'Первый день рождения', note: 'Нежная ваниль с малиной, топпер с именем', flavor: 'vanilla', guests: 12, tiers: 1, decor: ['berries', 'macaron'], text: 'Мне 1 годик' },
  { name: 'Свадебный в три яруса', note: 'Фисташка и клубника, живые цветы и золото', flavor: 'pistachio', guests: 36, tiers: 3, decor: ['flowers', 'gold'], text: '' },
  { name: 'Шоколадный на юбилей', note: 'Тёмный шоколад, вишня и подтёки ганаша', flavor: 'choco', guests: 18, tiers: 2, decor: ['drip', 'berries'], text: 'С юбилеем!' },
];

export function startBuilder({ animate, pores, scrollTo }) {
  const form = $('cake-form');
  const preview = $('preview');

  $('flavors').append(...Object.entries(FLAVORS).map(([id, f], i) => {
    const label = document.createElement('label');
    label.className = 'flavor';
    label.innerHTML = `<input type="radio" name="flavor" value="${id}"${i === 0 ? ' checked' : ''}><span>`
      + `<i class="chip" aria-hidden="true"><i style="background:${f.sponge}"></i><i style="background:${f.cream}"></i><i style="background:${f.fill}"></i><i style="background:${f.sponge}"></i></i>`
      + `<b>${f.name}</b><small>${rub(f.kg)} за кг</small></span>`;
    return label;
  }));

  $('decor').append(...DECOR.map(d => {
    const label = document.createElement('label');
    label.className = 'decor-opt';
    label.innerHTML = `<input type="checkbox" name="decor" value="${d.id}"${d.id === 'berries' ? ' checked' : ''}><span>${d.name}<small>+${rub(d.price)}</small></span>`;
    return label;
  }));

  const read = () => {
    const data = new FormData(form);
    return { flavor: data.get('flavor'), guests: +data.get('guests'), tiers: +data.get('tiers'), decor: data.getAll('decor'), text: data.get('text').trim() };
  };

  function fixTiers() {
    const allowed = allowedTiers(+$('guests').value);
    form.querySelectorAll('[name="tiers"]').forEach(radio => { radio.disabled = !allowed.includes(+radio.value); });
    const current = form.querySelector('[name="tiers"]:checked');
    if (current.disabled) form.querySelector(`[name="tiers"][value="${allowed[0]}"]`).checked = true;
  }

  // Different changes get different movement: a new tier is lowered on, new flavours
  // wipe across the cut, new decoration drops onto the cake.
  function celebrate(svg, before, after) {
    if (!animate || !before) return;
    const tiersOf = svg.querySelectorAll('.tier');
    if (after.tiers !== before.tiers) {
      gsap.from(tiersOf, { y: -90, autoAlpha: 0, duration: .85, stagger: .11, ease: 'bounce.out', transformOrigin: '50% 100%' });
      gsap.from(svg.querySelectorAll('.piece'), { y: -60, autoAlpha: 0, duration: .5, delay: .4, stagger: .012, ease: 'power2.out' });
      return;
    }
    if (after.flavor !== before.flavor) {
      gsap.fromTo(svg.querySelector('.tiers'), { scaleY: .975, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .9, ease: 'elastic.out(1, .4)' });
      gsap.from(svg.querySelectorAll('.cut'), { opacity: .2, duration: .5, stagger: .05, ease: 'power2.out' });
    }
    const added = after.decor.filter(d => !before.decor.includes(d));
    if (added.length) {
      gsap.from(svg.querySelectorAll('.dressing .piece'), {
        y: -46, autoAlpha: 0, duration: .55, stagger: { each: .012, from: 'random' }, ease: 'back.out(2.2)', clearProps: 'transform',
      });
    }
  }

  const shown = { price: 0 };
  let last = null;

  function paintPrice(total, instant) {
    const write = value => {
      $('total').textContent = rub(value);
      $('bar-total').textContent = rub(value);
    };
    if (!animate || instant) {
      shown.price = total;
      write(total);
      return;
    }
    gsap.to(shown, {
      price: total,
      duration: .6,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => write(Math.round(shown.price / 10) * 10),
      onComplete: () => write(total),
    });
  }

  function render(instant = false) {
    fixTiers();
    const spec = read();
    const weight = weightFor(spec.guests);
    const total = priceFor(spec);

    preview.innerHTML = renderCake(spec, pores);
    celebrate(preview.firstElementChild, last, spec);
    last = spec;

    const guests = $('guests');
    guests.style.setProperty('--fill', `${(guests.value - guests.min) / (guests.max - guests.min) * 100}%`);
    $('guests-out').textContent = `${spec.guests} человек`;
    $('t-weight').textContent = weightText(weight);
    $('t-size').textContent = sizeFor(weight, spec.tiers);
    $('t-prepay').textContent = rub(Math.ceil(total / 2 / 50) * 50);
    paintPrice(total, instant);
  }

  form.addEventListener('input', () => render());
  form.addEventListener('submit', event => event.preventDefault());
  render(true);

  $('hit-list').append(...HITS.map(hit => {
    const item = document.createElement('li');
    item.className = 'hit';
    item.innerHTML = `<h3>${hit.name}</h3><p class="hit-note">${hit.note}</p><div class="mini">${renderCake(hit, pores)}</div>`
      + `<div class="hit-foot"><b>${rub(priceFor(hit))}</b><button class="link" type="button">Собрать такой</button></div>`;
    item.querySelector('button').addEventListener('click', () => {
      form.querySelector(`[name="flavor"][value="${hit.flavor}"]`).checked = true;
      $('guests').value = hit.guests;
      form.querySelector(`[name="tiers"][value="${hit.tiers}"]`).checked = true;
      form.querySelectorAll('[name="decor"]').forEach(box => { box.checked = hit.decor.includes(box.value); });
      $('cake-text').value = hit.text;
      last = null;
      render();
      scrollTo('#build');
    });
    return item;
  }));

  $('hero-cake').innerHTML = renderCake({ flavor: 'vanilla', tiers: 2, decor: ['berries', 'drip'], text: '' }, pores);

  // The demo only shows a confirmation. On a client's site the submit handler below is
  // where the order goes to their Telegram bot or form service.
  const dialog = $('order-dialog');
  const orderForm = $('order-form');
  const done = $('order-done');

  $('open-order').addEventListener('click', () => {
    const spec = read();
    const tierWord = spec.tiers === 1 ? 'один ярус' : spec.tiers === 2 ? 'два яруса' : 'три яруса';
    $('order-sum').textContent = `${FLAVORS[spec.flavor].name}, ${tierWord}, ${weightText(weightFor(spec.guests))}. Итого ${rub(priceFor(spec))}, предоплата 50%.`;
    const earliest = new Date();
    earliest.setDate(earliest.getDate() + 3);
    $('o-date').min = iso(earliest);
    if (!$('o-date').value) $('o-date').value = iso(earliest);
    orderForm.hidden = false;
    done.hidden = true;
    dialog.showModal();
    if (animate) gsap.from(dialog, { y: 60, autoAlpha: 0, duration: .7, ease: 'expo.out', clearProps: 'all' });
  });

  orderForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(orderForm);
    const spec = read();
    const day = new Date(`${data.get('date')}T00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const delivery = data.get('way') === 'delivery';
    $('order-done-text').textContent = `${data.get('name')}, заказ на ${day} принят. ${delivery ? 'С доставкой' : 'Самовывоз'}, итого ${rub(priceFor(spec) + (delivery ? 400 : 0))}. Настя напишет на ${data.get('phone')}, чтобы подтвердить дату и предоплату.`;
    orderForm.hidden = true;
    done.hidden = false;
    if (animate) gsap.from(done.children, { y: 22, autoAlpha: 0, duration: .7, stagger: .07, ease: 'expo.out', clearProps: 'all' });
  });

  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) {
      if (!done.hidden) orderForm.reset();
      dialog.close();
    } else if (event.target === dialog) {
      dialog.close();
    }
  });
}
