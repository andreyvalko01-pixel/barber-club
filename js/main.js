const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const formatPrice = (n) => `${n.toLocaleString('uk-UA')} ₴`;

// ---------- Рендер контенту ----------

function renderMasters() {
  $('#masters-list').innerHTML = SHOP.masters.map((m) => `
    <article class="master">
      <img src="${m.photo}" alt="Майстер ${m.name}" loading="lazy">
      <div class="master__info">
        <h3>${m.name}</h3>
        <p>${m.role}</p>
        <button type="button" class="master__book" data-master="${m.id}">Записатися →</button>
      </div>
    </article>
  `).join('');

  $$('.master__book').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#booking-master').value = btn.dataset.master;
      $('#booking-master').dispatchEvent(new Event('change'));
      $('#booking').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderPrices() {
  $('#prices-list').innerHTML = SHOP.services.map((s) => `
    <li class="prices__row">
      <span>${s.name}</span>
      <span class="prices__dots"></span>
      <strong>${formatPrice(s.price)}</strong>
    </li>
  `).join('');
}

function renderGallery() {
  $('#gallery-list').innerHTML = SHOP.gallery.map((src, i) => `
    <button type="button" class="gallery__item" data-src="${src}">
      <img src="${src.replace('w=1200', 'w=600')}" alt="Робота майстра ${i + 1}" loading="lazy">
    </button>
  `).join('');

  const box = $('#lightbox');
  $$('.gallery__item').forEach((item) => {
    item.addEventListener('click', () => {
      $('img', box).src = item.dataset.src;
      box.hidden = false;
    });
  });
  box.addEventListener('click', (e) => {
    if (e.target !== $('img', box)) box.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') box.hidden = true;
  });
}

// ---------- Форма запису ----------

const form = $('#booking-form');
const { state } = Booking;

function currentMaster() {
  return SHOP.masters.find((m) => m.id === form.master.value);
}

function currentService() {
  return SHOP.services.find((s) => s.id === form.service.value);
}

function fillSelects() {
  form.master.innerHTML = SHOP.masters
    .map((m) => `<option value="${m.id}">${m.name} — ${m.role}</option>`)
    .join('');
  form.service.innerHTML = SHOP.services
    .map((s) => `<option value="${s.id}">${s.name} · ${formatPrice(s.price)}</option>`)
    .join('');
}

function setStep(step) {
  $$('.steps__item').forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle('is-done', n < step);
    el.classList.toggle('is-current', n === step);
  });
}

function renderCalendar() {
  const master = currentMaster();
  const today = Booking.startOfDay(new Date());
  const cal = $('#calendar');
  cal.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const day = Booking.addDays(state.weekStart, i);
    const disabled = day < today || !Booking.masterWorks(master, day);
    const selected = state.date && Booking.dateKey(day) === Booking.dateKey(state.date);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calendar__day' + (selected ? ' is-selected' : '');
    btn.disabled = disabled;
    btn.innerHTML = `<small>${Booking.DAY_NAMES[day.getDay()]}</small>${day.getDate()}`;
    btn.addEventListener('click', () => {
      state.date = day;
      state.time = null;
      renderCalendar();
      renderSlots();
      setStep(3);
    });
    cal.appendChild(btn);
  }

  // назад далі ніж поточний тиждень не пускаємо
  $('#week-prev').disabled = state.weekStart <= today;
}

function renderSlots() {
  const box = $('#slots');
  if (!state.date) {
    box.innerHTML = '<p class="muted">Спочатку оберіть дату</p>';
    return;
  }

  const slots = Booking.freeSlots(currentMaster().id, state.date, currentService().duration);
  if (!slots.length) {
    box.innerHTML = '<p class="muted">На цей день вільних вікон немає</p>';
    return;
  }

  box.innerHTML = slots.map((t) => `
    <button type="button" class="slot${t === state.time ? ' is-selected' : ''}" data-time="${t}">${t}</button>
  `).join('');

  $$('.slot', box).forEach((btn) => {
    btn.addEventListener('click', () => {
      state.time = btn.dataset.time;
      $$('.slot', box).forEach((b) => b.classList.toggle('is-selected', b === btn));
    });
  });
}

function resetDate() {
  state.date = null;
  state.time = null;
  renderCalendar();
  renderSlots();
  setStep(2);
}

function validate() {
  const phone = form.phone.value.replace(/[^\d+]/g, '');
  if (!state.date) return 'Оберіть дату';
  if (!state.time) return 'Оберіть час';
  if (form.name.value.trim().length < 2) return "Вкажіть ім'я";
  if (!/^\+?3?8?0\d{9}$/.test(phone)) return 'Перевірте номер телефону';
  return null;
}

async function sendBooking(booking) {
  // На Netlify заявка йде у функцію, яка пересилає її в Telegram.
  // Локально функції немає — тоді просто зберігаємо запис у браузері.
  try {
    const res = await fetch('/.netlify/functions/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error(res.status);
  } catch (err) {
    console.info('Функція недоступна, запис збережено локально', err.message);
  }
  Booking.saveBooking(booking);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = validate();
  $('#form-error').textContent = error || '';
  if (error) return;

  const master = currentMaster();
  const service = currentService();
  const booking = {
    master: master.id,
    service: service.id,
    duration: service.duration,
    date: Booking.dateKey(state.date),
    time: state.time,
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
  };

  const submitBtn = $('button[type=submit]', form);
  submitBtn.disabled = true;
  await sendBooking(booking);
  submitBtn.disabled = false;

  const dateText = state.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'long' });
  $('#booking-summary').textContent =
    `${service.name} у майстра ${master.name}, ${dateText} о ${state.time}. Ми зателефонуємо для підтвердження.`;
  form.hidden = true;
  $('#booking-done').hidden = false;
});

$('#booking-again').addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  $('#booking-done').hidden = true;
  resetDate();
});

form.master.addEventListener('change', resetDate);
form.service.addEventListener('change', () => {
  state.time = null;
  renderSlots();
});

$('#week-prev').addEventListener('click', () => {
  state.weekStart = Booking.addDays(state.weekStart, -7);
  renderCalendar();
});
$('#week-next').addEventListener('click', () => {
  state.weekStart = Booking.addDays(state.weekStart, 7);
  renderCalendar();
});

// ---------- Навігація ----------

function initNav() {
  const burger = $('#burger');
  const nav = $('#nav');

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('.nav__link').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', false);
  }));

  // підсвічуємо пункт меню для секції, яку зараз видно
  const links = $$('.nav__link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  ['top', 'masters', 'prices', 'gallery', 'contacts'].forEach((id) => observer.observe(document.getElementById(id)));
}

renderMasters();
renderPrices();
renderGallery();
fillSelects();
renderCalendar();
initNav();
$('#year').textContent = new Date().getFullYear();
