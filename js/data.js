// Дані салону. В реальному проєкті це приходить з адмінки, тут — просто об'єкт.
const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=75&auto=format&fit=crop`;

const SHOP = {
  masters: [
    { id: 'denys', name: 'Денис', role: 'Стрижки · борода', photo: img('photo-1647140655214-e4a2d914971f'), days: [1, 2, 3, 4, 5] },
    { id: 'artem', name: 'Артем', role: 'Fade · королівське гоління', photo: img('photo-1657105052497-f996284ffff8'), days: [2, 3, 4, 5, 6] },
    { id: 'oleh', name: 'Олег', role: 'Класика · дитячі стрижки', photo: img('photo-1593702275687-f8b402bf1fb5'), days: [1, 3, 5, 6, 0] },
  ],

  // duration у хвилинах — від неї залежить, скільки слотів займає запис
  services: [
    { id: 'cut', name: 'Чоловіча стрижка', price: 650, duration: 60 },
    { id: 'machine', name: 'Стрижка машинкою', price: 450, duration: 30 },
    { id: 'cut-beard', name: 'Стрижка + борода', price: 1000, duration: 90 },
    { id: 'beard', name: 'Оформлення бороди', price: 500, duration: 30 },
    { id: 'shave', name: 'Королівське гоління', price: 600, duration: 60 },
    { id: 'cut-shave', name: 'Стрижка + королівське гоління', price: 1100, duration: 120 },
    { id: 'kids', name: 'Дитяча стрижка (до 12 років)', price: 450, duration: 30 },
  ],

  gallery: [
    img('photo-1503951914875-452162b0f3f1', 1200),
    img('photo-1517832606299-7ae9b720a186', 1200),
    img('photo-1605497788044-5a32c7078486', 1200),
    img('photo-1621605815971-fbc98d665033', 1200),
  ],

  openHour: 10,
  closeHour: 21,
  slotMinutes: 30,
};
