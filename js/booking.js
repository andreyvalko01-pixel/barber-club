// Логіка запису: календар на тиждень, вільні слоти, відправка заявки.
const Booking = (() => {
  const STORAGE_KEY = 'barber_bookings';
  const DAY_NAMES = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const state = {
    weekStart: startOfDay(new Date()),
    date: null,
    time: null,
  };

  function startOfDay(d) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function addDays(d, n) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  function dateKey(d) {
    // YYYY-MM-DD без перетворення в UTC, щоб не з'їжджала дата
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function toMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function fromMinutes(total) {
    const h = String(Math.floor(total / 60)).padStart(2, '0');
    const m = String(total % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function loadBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveBooking(booking) {
    const all = loadBookings();
    all.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  // Поки немає бекенду — частина слотів "зайнята" іншими клієнтами.
  // Генеруємо їх детерміновано від дати й майстра, щоб розклад не стрибав при перезавантаженні.
  function demoBusySlots(masterId, key) {
    let seed = 0;
    for (const ch of masterId + key) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;

    const busy = [];
    for (let t = SHOP.openHour * 60; t < SHOP.closeHour * 60; t += SHOP.slotMinutes) {
      seed = (seed * 17 + 11) % 9973;
      if (seed % 4 === 0) busy.push(t);
    }
    return busy;
  }

  function busyMinutes(masterId, key) {
    const busy = new Set(demoBusySlots(masterId, key));

    for (const b of loadBookings()) {
      if (b.master !== masterId || b.date !== key) continue;
      const start = toMinutes(b.time);
      for (let t = start; t < start + b.duration; t += SHOP.slotMinutes) busy.add(t);
    }
    return busy;
  }

  function freeSlots(masterId, date, duration) {
    const key = dateKey(date);
    const busy = busyMinutes(masterId, key);
    const now = new Date();
    const isToday = dateKey(now) === key;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const result = [];
    const lastStart = SHOP.closeHour * 60 - duration;

    for (let t = SHOP.openHour * 60; t <= lastStart; t += SHOP.slotMinutes) {
      if (isToday && t <= nowMinutes + 30) continue;

      // послуга може займати кілька слотів підряд — усі мають бути вільні
      let fits = true;
      for (let k = t; k < t + duration; k += SHOP.slotMinutes) {
        if (busy.has(k)) { fits = false; break; }
      }
      if (fits) result.push(fromMinutes(t));
    }
    return result;
  }

  function masterWorks(master, date) {
    return master.days.includes(date.getDay());
  }

  return {
    state, DAY_NAMES, addDays, dateKey, startOfDay,
    freeSlots, masterWorks, saveBooking,
  };
})();
