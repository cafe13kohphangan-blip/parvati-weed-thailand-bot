// Parvati weed Thailand - Kratom & Cannabis Products
const categories = [
  { id: 'kratom',    name_en: '🌱 Kratom',      name_ru: '🌱 Кратом' },
  { id: 'flower',    name_en: '🌿 Flower',     name_ru: '🌿 Шишки' },
  { id: 'edibles',   name_en: '🍪 Edibles',    name_ru: '🍪 Эдиблс' },
  { id: 'prerolls',  name_en: '🚬 Pre-rolls',   name_ru: '🚬 Готовые косяки' },
  { id: 'accessory', name_en: '🔧 Accessories', name_ru: '🔧 Аксессуары' },
];

const products = [
  // === KRATOM (from screenshots, in Thai Baht) ===
  { id: 'k1', cat: 'kratom', name_en: 'Premium Kratom Powder 50g', name_ru: 'Премиум порошок Кратом 50г', price: 300, desc_en: 'High quality, red/white/green strain', desc_ru: 'Высокое качество, красный/белый/зеленый сорт' },
  { id: 'k2', cat: 'kratom', name_en: 'Kratom Capsules 30pcs', name_ru: 'Капсулы Кратом 30шт', price: 450, desc_en: 'Easy to use, pre-measured', desc_ru: 'Удобно, заранее отмерено' },
  { id: 'k3', cat: 'kratom', name_en: 'Kratom Tea Bags 10pcs', name_ru: 'Чайные пакетики Кратом 10шт', price: 250, desc_en: 'Traditional Thai style', desc_ru: 'Традиционный тайский стиль' },
  { id: 'k4', cat: 'kratom', name_en: 'Kratom Extract 10ml', name_ru: 'Экстракт Кратом 10мл', price: 500, desc_en: 'Strong concentrate, use carefully', desc_ru: 'Сильный концентрат, осторожно' },

  // === FLOWER ===
  { id: 'f1', cat: 'flower', name_en: 'OG Kush', name_ru: 'OG Kush', price: 300, desc_en: 'Hybrid. Potent, relaxed. 22-26% THC', desc_ru: 'Гибрид. Мощный, релакс. 22-26% ТГК' },
  { id: 'f2', cat: 'flower', name_en: 'Amnesia Haze', name_ru: 'Amnesia Haze', price: 250, desc_en: 'Sativa. Uplifting, energetic. 20-25% THC', desc_ru: 'Сатива. Подъём, энергия. 20-25% ТГК' },
  { id: 'f3', cat: 'flower', name_en: 'Northern Lights', name_ru: 'Northern Lights', price: 200, desc_en: 'Indica. Relax, sleep. 18-22% THC', desc_ru: 'Индика. Расслабление, сон. 18-22% ТГК' },

  // === EDIBLES ===
  { id: 'e1', cat: 'edibles', name_en: 'Gummy Bears (100mg)', name_ru: 'Мармелад (100мг)', price: 350, desc_en: '10 pcs × 10mg THC. Fruity', desc_ru: '10 шт × 10мг ТГК. Фруктовые' },
  { id: 'e2', cat: 'edibles', name_en: 'Choco Brownie (200mg)', name_ru: 'Брауни (200мг)', price: 400, desc_en: 'Chocolate brownie. Strong.', desc_ru: 'Шоколадное брауни. Сильное.' },

  // === PRE-ROLLS ===
  { id: 'p1', cat: 'prerolls', name_en: 'Standard Joint (0.5g)', name_ru: 'Стандарт (0.5г)', price: 100, desc_en: 'Mixed strain. Ready to smoke.', desc_ru: 'Микс сортов. Готов к курению.' },
  { id: 'p2', cat: 'prerolls', name_en: 'Premium Joint (1g)', name_ru: 'Премиум (1г)', price: 200, desc_en: 'Top shelf strain. King size.', desc_ru: 'Топ сорт. Кинг сайз.' },

  // === ACCESSORIES ===
  { id: 'a1', cat: 'accessory', name_en: 'Rolling Papers (50)', name_ru: 'Бумаги (50)', price: 50, desc_en: 'King size. Organic hemp.', desc_ru: 'Кинг сайз. Органическая конопля.' },
  { id: 'a2', cat: 'accessory', name_en: 'Grinder (Metal)', name_ru: 'Грайндер (металл)', price: 350, desc_en: '4-piece. Magnetic lid. Keef catcher.', desc_ru: '4 части. Магнит. Сборщик кифа.' },
];

module.exports = { categories, products };
