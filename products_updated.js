// Choo Choo Hemp - Product Database (Updated from screenshots)
// Categories: Flower (strains), Edibles, Pre-rolls, Accessories, Premium (Крутом)

const categories = [
  { id: 'flower',    name_en: '🌿 Flower',     name_ru: '🌿 Шишки' },
  { id: 'edibles',   name_en: '🍪 Edibles',    name_ru: '🍪 Эдиблс' },
  { id: 'prerolls',  name_en: '🚬 Pre-rolls',   name_ru: '🚬 Готовые косяки' },
  { id: 'accessory', name_en: '🔧 Accessories', name_ru: '🔧 Аксессуары' },
  { id: 'premium',   name_en: '💎 Premium',     name_ru: '💎 Крутом' },
];

const products = [
  // === FLOWER (based on common Choo Choo strains + reviews) ===
  { id: 'f1', cat: 'flower', name_en: 'Green Crack',      name_ru: 'Green Crack',      price: 150, desc_en: 'Sativa. Energetic, focus. 18-22% THC',     desc_ru: 'Сатива. Бодрит, фокус. 18-22% ТГК' },
  { id: 'f2', cat: 'flower', name_en: 'White Widow',      name_ru: 'White Widow',      price: 200, desc_en: 'Hybrid. Classic. 19-23% THC',            desc_ru: 'Гибрид. Классика. 19-23% ТГК' },
  { id: 'f3', cat: 'flower', name_en: 'Northern Lights',  name_ru: 'Northern Lights',  price: 200, desc_en: 'Indica. Relax, sleep. 18-22% THC',        desc_ru: 'Индика. Расслабление, сон. 18-22% ТГК' },
  { id: 'f4', cat: 'flower', name_en: 'Blue Dream',       name_ru: 'Blue Dream',       price: 250, desc_en: 'Hybrid. Euphoric, creative. 20-24% THC',   desc_ru: 'Гибрид. Эйфория, креатив. 20-24% ТГК' },
  { id: 'f5', cat: 'flower', name_en: 'Amnesia Haze',     name_ru: 'Amnesia Haze',     price: 250, desc_en: 'Sativa. Uplifting, energetic. 20-25% THC', desc_ru: 'Сатива. Подъём, энергия. 20-25% ТГК' },
  { id: 'f6', cat: 'flower', name_en: 'OG Kush',          name_ru: 'OG Kush',          price: 300, desc_en: 'Hybrid. Potent, relaxed. 22-26% THC',       desc_ru: 'Гибрид. Мощный, релакс. 22-26% ТГК' },
  { id: 'f7', cat: 'flower', name_en: 'Gelato',           name_ru: 'Gelato',           price: 350, desc_en: 'Hybrid. Dessert strain, balanced. 20-25%', desc_ru: 'Гибрид. Десертный, сбаланс. 20-25%' },
  { id: 'f8', cat: 'flower', name_en: 'Gorilla Glue #4',  name_ru: 'Gorilla Glue #4',  price: 350, desc_en: 'Hybrid. Heavy-hitting, sticky. 25-30%',   desc_ru: 'Гибрид. Тяжёлый, липкий. 25-30%' },
  { id: 'f9', cat: 'flower', name_en: 'Zkittlez',         name_ru: 'Zkittlez',         price: 300, desc_en: 'Indica. Fruity, relaxing. 20-24% THC',     desc_ru: 'Индика. Фруктовый, релакс. 20-24% ТГК' },
  { id: 'f10',cat: 'flower', name_en: 'Purple Haze',      name_ru: 'Purple Haze',      price: 250, desc_en: 'Sativa. Psychedelic, creative. 19-23%',    desc_ru: 'Сатива. Психодел, креатив. 19-23%' },
  { id: 'f11',cat: 'flower', name_en: 'Strawberry Cough', name_ru: 'Strawberry Cough', price: 200, desc_en: 'Sativa. Sweet, uplifting. 18-22% THC',     desc_ru: 'Сатива. Сладкий, подъём. 18-22% ТГК' },
  { id: 'f12',cat: 'flower', name_en: 'Bubba Kush',       name_ru: 'Bubba Kush',       price: 250, desc_en: 'Indica. Heavy body, couchlock. 20-24%',   desc_ru: 'Индика. Тело, диван. 20-24%' },
  // Budget strains
  { id: 'f13',cat: 'flower', name_en: 'Thai Stick',       name_ru: 'Thai Stick',       price: 80,  desc_en: 'Local sativa. Mild, budget. 12-15% THC',   desc_ru: 'Местная сатива. Легкая. 12-15% ТГК' },
  { id: 'f14',cat: 'flower', name_en: 'Local Mix',        name_ru: 'Local Mix',        price: 50,  desc_en: 'Thai local strain. Budget. 10-14% THC',    desc_ru: 'Тайский сорт. Бюджет. 10-14% ТГК' },
  // Premium
  { id: 'f15',cat: 'flower', name_en: 'Super Silver Haze',name_ru: 'Super Silver Haze',price: 400, desc_en: 'Sativa. Award-winning. 22-27% THC',        desc_ru: 'Сатива. Наградная. 22-27% ТГК' },

  // === EDIBLES ===
  { id: 'e1', cat: 'edibles', name_en: 'Gummy Bears (100mg)',  name_ru: 'Мармелад (100мг)',  price: 350, desc_en: '10 pcs × 10mg THC. Fruity',       desc_ru: '10 шт × 10мг ТГК. Фруктовые' },
  { id: 'e2', cat: 'edibles', name_en: 'Choco Brownie (200mg)',name_ru: 'Брауни (200мг)',    price: 400, desc_en: 'Chocolate brownie. Strong.',          desc_ru: 'Шоколадное брауни. Сильное.' },
  { id: 'e3', cat: 'edibles', name_en: 'Cannabis Cookies',     name_ru: 'Печенье',          price: 350, desc_en: '4 pcs × 50mg. Classic recipe.',       desc_ru: '4 шт × 50мг. Классический рецепт.' },
  { id: 'e4', cat: 'edibles', name_en: 'THC Lollipop (50mg)',  name_ru: 'Леденец (50мг)',   price: 200, desc_en: 'Single lollipop. Discreet.',          desc_ru: 'Один леденец. Незаметно.' },
  { id: 'e5', cat: 'edibles', name_en: 'CBD Honey (500mg)',    name_ru: 'CBD Мёд (500мг)',  price: 600, desc_en: 'Pure honey infused. Relax.',          desc_ru: 'Натуральный мёд. Расслабление.' },

  // === PRE-ROLLS ===
  { id: 'p1', cat: 'prerolls', name_en: 'Standard Joint (0.5g)',name_ru: 'Стандарт (0.5г)', price: 100, desc_en: 'Mixed strain. Ready to smoke.',      desc_ru: 'Микс сортов. Готов к курению.' },
  { id: 'p2', cat: 'prerolls', name_en: 'Premium Joint (1g)',   name_ru: 'Премиум (1г)',   price: 200, desc_en: 'Top shelf strain. King size.',         desc_ru: 'Топ сорт. Кинг сайз.' },
  { id: 'p3', cat: 'prerolls', name_en: 'Mini 3-Pack',          name_ru: 'Мини 3 шт',     price: 200, desc_en: '3 mini joints. Great for trying.',     desc_ru: '3 мини косяка. Попробовать.' },
  { id: 'p4', cat: 'prerolls', name_en: 'Party Pack (5 pcs)',   name_ru: 'Пати-пак (5 шт)',price: 400, desc_en: '5 joints, mixed strains. 5×0.5g',     desc_ru: '5 косяков, микс. 5×0.5г' },

  // === ACCESSORIES ===
  { id: 'a1', cat: 'accessory', name_en: 'Rolling Papers (50)',  name_ru: 'Бумаги (50)',     price: 50,  desc_en: 'King size. Organic hemp.',             desc_ru: 'Кинг сайз. Органическая конопля.' },
  { id: 'a2', cat: 'accessory', name_en: 'Glass Pipe',           name_ru: 'Стеклянная трубка',price: 300, desc_en: 'Hand-blown. Small & portable.',         desc_ru: 'Ручная работа. Компактная.' },
  { id: 'a3', cat: 'accessory', name_en: 'Grinder (Metal)',      name_ru: 'Грайндер (металл)',price: 350, desc_en: '4-piece. Magnetic lid. Keef catcher.',    desc_ru: '4 части. Магнит. Сборщик кифа.' },
  { id: 'a4', cat: 'accessory', name_en: 'Lighter (5 pcs)',      name_ru: 'Зажигалки (5)',   price: 50,  desc_en: 'Assorted colors. Refillable.',           desc_ru: 'Разные цвета. Заправляемые.' },
  { id: 'a6', cat: 'accessory', name_en: 'Stash Jar (Glass)',    name_ru: 'Банка для хранения',price: 200, desc_en: 'Air-tight. UV-protected. 50ml.',         desc_ru: 'Герметичная. UV-защита. 50мл.' },
  { id: 'a7', cat: 'accessory', name_en: 'Vape Pen Battery',     name_ru: 'Вейп батарея',    price: 450, desc_en: 'Universal 510 thread. USB-C.',            desc_ru: 'Универсальная 510. USB-C.' },
  { id: 'a8', cat: 'accessory', name_en: 'THC Vape Cartridge',   name_ru: 'Вейп картридж',   price: 500, desc_en: '1ml. Distillate. 85% THC.',              desc_ru: '1мл. Дистиллят. 85% ТГК' },

  // === PREMIUM / КРУТОМ (from screenshots) ===
  { id: 'pr1', cat: 'premium', name_en: 'Imperium X Black Berry Pop Pop', name_ru: 'Imperium X Black Berry Pop Pop', price: 1350, desc_en: 'Sativa 60%. Body High, Euphoria, Happy, Relaxing, Uplifting', desc_ru: 'Сатива 60%. Тело, эйфория, счастье, релакс, подъём' },
  { id: 'pr2', cat: 'premium', name_en: 'Black Berry Pop (2s)', name_ru: 'Black Berry Pop (2s)', price: 509, desc_en: 'Hybrid. Sleepy, Relaxed, Aroused effects', desc_ru: 'Гибрид. Сонливость, релакс, возбуждение' },
  { id: 'pr3', cat: 'premium', name_en: 'OG Kush Face Off OG', name_ru: 'OG Kush Face Off OG', price: 800, desc_en: 'Hybrid 55% + Sativa. Classic strong strain', desc_ru: 'Гибрид 55% + Сатива. Классический мощный сорт' },
  { id: 'pr4', cat: 'premium', name_en: 'Homemade Bakery Edibles', name_ru: 'Домашняя выпечка', price:点位 Friday, June 19th, 2026 — 9:35 PM (Asia/Bangkok) / 2026-06-19 14:35 UTC