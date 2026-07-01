// Parvati Weed Thailand - Premium Product Catalog v2.2
const path = require('path');
const IMG_DIR = path.join(__dirname, 'images');

const categories = [
  { id: 'flower',    name_en: '🌿 Flower',      name_ru: '🌿 Шишки',    emoji: '🌿' },
  { id: 'edibles',   name_en: '🍪 Edibles',     name_ru: '🍪 Эдиблс',   emoji: '🍪' },
  { id: 'prerolls',  name_en: '🚬 Pre-rolls',   name_ru: '🚬 Готовые косяки', emoji: '🚬' },
  { id: 'kratom',    name_en: '🌱 Kratom',      name_ru: '🌱 Кратом',   emoji: '🌱' },
  { id: 'accessory', name_en: '🔧 Accessories', name_ru: '🔧 Аксессуары', emoji: '🔧' },
];

const products = [
  // ============ FLOWER STRAINS ============
  {
    id: 'f_ogkush', cat: 'flower',
    name_en: 'OG Kush', name_ru: 'OG Kush',
    grade: '4A', type: 'Hybrid', thc: '22-26%',
    effects_en: ['😌 Relaxed', '😊 Happy', '😴 Sleepy'],
    effects_ru: ['😌 Расслабление', '😊 Счастье', '😴 Сон'],
    prices: { '1г': 300, '3.5г': 850, '7г': 1500 },
    image: path.join(IMG_DIR, 'og-kush.jpg'),
    desc_en: 'Legendary West Coast strain. A powerful hybrid that delivers a potent body high balanced with cerebral euphoria. Known for its distinct earthy pine and lemon aroma with notes of fuel.',
    desc_ru: 'Легендарный сорт с Западного побережья. Мощный гибрид с сильным телесным эффектом и эйфорией. Отличается землисто-сосновым ароматом с нотками лимона.'
  },
  {
    id: 'f_amnesia', cat: 'flower',
    name_en: 'Amnesia Haze', name_ru: 'Amnesia Haze',
    grade: '4A', type: 'Sativa 70%', thc: '20-25%',
    effects_en: ['⚡ Energetic', '🎨 Creative', '☀️ Uplifted'],
    effects_ru: ['⚡ Энергия', '🎨 Креатив', '☀️ Подъём'],
    prices: { '1г': 250, '3.5г': 700, '7г': 1300 },
    image: path.join(IMG_DIR, 'amnesia-haze.jpg'),
    desc_en: 'Award-winning sativa-dominant hybrid. Delivers an uplifting, energetic high perfect for daytime creativity and social activities. Citrus and earthy flavors with a hint of sweetness.',
    desc_ru: 'Сатива-доминантный гибрид, победитель Cup. Бодрящий эффект, идеален для дня и творчества. Цитрусово-землистый вкус с ноткой сладости.'
  },
  {
    id: 'f_northern', cat: 'flower',
    name_en: 'Northern Lights', name_ru: 'Northern Lights',
    grade: '4A', type: 'Indica 80%', thc: '18-22%',
    effects_en: ['😴 Sleepy', '😌 Relaxed', '✨ Tingly'],
    effects_ru: ['😴 Сон', '😌 Расслабление', '✨ Покалывание'],
    prices: { '1г': 200, '3.5г': 550, '7г': 1000 },
    image: path.join(IMG_DIR, 'northern-lights.jpg'),
    desc_en: 'An all-time classic indica. Known for its heavy resin production and profoundly relaxing body effects. Sweet and spicy aroma with notes of pine and earth. Perfect for evenings.',
    desc_ru: 'Классическая индика. Известна тяжёлым смолистым покрытием и глубоким расслаблением. Сладко-пряный аромат с сосновыми нотками. Идеальна для вечера.'
  },
  {
    id: 'f_gelato', cat: 'flower',
    name_en: 'Gelato #33', name_ru: 'Gelato #33',
    grade: '5A', type: 'Hybrid', thc: '24-28%',
    effects_en: ['🎨 Creative', '💫 Euphoric', '😊 Happy'],
    effects_ru: ['🎨 Креатив', '💫 Эйфория', '😊 Счастье'],
    prices: { '1г': 350, '3.5г': 950, '7г': 1700 },
    image: path.join(IMG_DIR, 'gelato33.jpg'),
    desc_en: 'Premium dessert strain. Sweet vanilla and lavender aroma with a smooth, balanced high that starts euphoric and settles into deep relaxation. Top shelf quality.',
    desc_ru: 'Премиум десертный сорт. Сладкий аромат ванили и лаванды. Сбалансированный эффект — от эйфории к глубокому расслаблению. Топ качество.'
  },
  {
    id: 'f_tropcherry', cat: 'flower',
    name_en: 'Trop Cherry', name_ru: 'Trop Cherry',
    grade: '5A+', type: 'Sativa 60%', thc: '25-28%',
    effects_en: ['🎯 Focused', '💫 Euphoric', '⚡ Energetic'],
    effects_ru: ['🎯 Фокус', '💫 Эйфория', '⚡ Энергия'],
    prices: { '1г': 450, '3.5г': 1300, '7г': 2300 },
    image: path.join(IMG_DIR, 'trop-cherry.jpg'),
    desc_en: 'Exotic top-shelf exclusive. Bursting with cherry terpenes and tropical fruit notes. Potent sativa-leaning effects — focused, energetic, and creatively inspiring.',
    desc_ru: 'Эксклюзивный топ-шельф. Взрыв вишнёвых терпенов и тропических фруктов. Мощная сатива — фокус, энергия, вдохновение.'
  },

  // ============ EDIBLES ============
  {
    id: 'e_gummy100', cat: 'edibles',
    name_en: 'Gummy Bears 🐻 100mg', name_ru: 'Мармеладки 🐻 100мг',
    grade: 'A', type: 'Edible', thc: '100mg THC',
    effects_en: ['🫠 Body High', '😌 Relaxed'],
    effects_ru: ['🫠 Телесный', '😌 Расслабление'],
    prices: { '10шт': 350 },
    image: null,
    desc_en: 'Delicious fruity gummy bears. 10 pieces × 10mg THC each. Perfect for microdosing or a gentle introduction to edibles. Vegan friendly.',
    desc_ru: 'Вкусные фруктовые мармеладки. 10 шт × 10мг ТГК. Идеально для микродозинга или первого знакомства с эдиблс. Веганские.'
  },
  {
    id: 'e_brownie', cat: 'edibles',
    name_en: 'Choco Brownie 🍫 200mg', name_ru: 'Брауни 🍫 200мг',
    grade: 'A', type: 'Edible', thc: '200mg THC',
    effects_en: ['🫠 Heavy Body', '😴 Sleepy'],
    effects_ru: ['🫠 Тяжёлый', '😴 Сон'],
    prices: { '1шт': 400 },
    image: null,
    desc_en: 'Premium Belgian chocolate brownie. Rich, fudgy, and potent. 200mg THC for a long-lasting, deeply relaxing experience. For experienced consumers.',
    desc_ru: 'Брауни из бельгийского шоколада. Богатый, сочный, мощный. 200мг ТГК для долгого глубокого расслабления. Для опытных.'
  },
  {
    id: 'e_gummy250', cat: 'edibles',
    name_en: 'Gummy Bears 🐻 250mg', name_ru: 'Мармеладки 🐻 250мг',
    grade: 'A', type: 'Edible', thc: '250mg THC',
    effects_en: ['🫠 Heavy Body', '💫 Euphoric'],
    effects_ru: ['🫠 Тяжёлый', '💫 Эйфория'],
    prices: { '25шт': 600 },
    image: null,
    desc_en: 'Strong fruit gummy bears. 25 pieces × 10mg THC for a powerful, long-lasting experience. Best shared or for experienced users only.',
    desc_ru: 'Сильные фруктовые мармеладки. 25 шт × 10мг ТГК. Мощный эффект. Лучше делить или для опытных.'
  },

  // ============ PRE-ROLLS ============
  {
    id: 'p_standard', cat: 'prerolls',
    name_en: 'Standard Joint 🌿 0.5g', name_gr: 'Стандарт 🌿 0.5г',
    name_ru: 'Стандарт 🌿 0.5г',
    grade: '3A', type: 'Joint', thc: '18-22%',
    effects_en: ['😌 Relaxed', '😊 Happy'],
    effects_ru: ['😌 Расслабление', '😊 Счастье'],
    prices: { '1шт': 100, '5шт': 450 },
    image: null,
    desc_en: 'Ready-to-smoke mixed strain joint with glass tip. Smooth burn, consistent quality. Perfect for on-the-go.',
    desc_ru: 'Готовый косяк из микс сортов со стеклянным наконечником. Ровное горение. Идеален для прогулки.'
  },
  {
    id: 'p_premium', cat: 'prerolls',
    name_en: 'Premium Joint 🌟 1g', name_ru: 'Премиум 🌟 1г',
    grade: '4A', type: 'Joint', thc: '22-26%',
    effects_en: ['💫 Euphoric', '🫠 Body High'],
    effects_ru: ['💫 Эйфория', '🫠 Телесный'],
    prices: { '1шт': 200, '5шт': 900 },
    image: null,
    desc_en: 'King size premium joint. Top shelf flower, organic paper, glass tip. The ultimate ready-to-smoke experience.',
    desc_ru: 'Кинг сайз премиум косяк. Топ сорт, органическая бумага, стеклянный наконечник. Лучший готовый джоинт.'
  },

  // ============ KRATOM ============
  {
    id: 'k_powder', cat: 'kratom',
    name_en: 'Premium Kratom 🌱 50g', name_ru: 'Премиум Кратом 🌱 50г',
    grade: '4A', type: 'Kratom', thc: 'Mitragynine',
    effects_en: ['⚡ Energy', '🎯 Focus', '😌 Relaxed'],
    effects_ru: ['⚡ Энергия', '🎯 Фокус', '😌 Расслабление'],
    prices: { '50г': 300, '100г': 500, '500г': 2000 },
    image: null,
    desc_en: 'Premium Thai kratom powder. Available in Red, White, and Green vein strains. Lab tested for purity and alkaloid content.',
    desc_ru: 'Премиум тайский порошок кратом. Красный, Белый, Зелёный сорта. Лабораторное тестирование.'
  },
  {
    id: 'k_caps', cat: 'kratom',
    name_en: 'Kratom Capsules 💊 30ct', name_ru: 'Капсулы Кратом 💊 30шт',
    grade: '4A', type: 'Kratom', thc: 'Mitragynine',
    effects_en: ['⚡ Energy', '😊 Mood Boost'],
    effects_ru: ['⚡ Энергия', '😊 Настроение'],
    prices: { '30шт': 450, '100шт': 1200 },
    image: null,
    desc_en: 'Convenient pre-measured kratom capsules. 500mg each. Easy to take anywhere — no measuring, no taste.',
    desc_ru: 'Удобные капсулы кратома. По 500мг каждая. Легко принять где угодно — без вкуса и измерения.'
  },

  // ============ ACCESSORIES ============
  {
    id: 'a_papers', cat: 'accessory',
    name_en: 'Rolling Papers 📄 (50)', name_ru: 'Бумаги 📄 (50)',
    grade: 'A', type: 'Accessory', thc: null,
    effects_en: [], effects_ru: [],
    prices: { '1пачка': 50 },
    image: null,
    desc_en: 'King size organic hemp rolling papers. Slow, even burn. No added chemicals. 50 per pack.',
    desc_ru: 'Кинг сайз бумаги из органической конопли. Медленное ровное горение. Без химии. 50 шт.'
  },
  {
    id: 'a_grinder', cat: 'accessory',
    name_en: 'Metal Grinder 🔧 4-pc', name_ru: 'Грайндер 🔧 4-ч',
    grade: 'A', type: 'Accessory', thc: null,
    effects_en: [], effects_ru: [],
    prices: { '1шт': 350 },
    image: null,
    desc_en: 'Premium 4-piece aluminum grinder. Magnetic lid, sharp teeth, fine mesh screen, and keef catcher. 50mm diameter.',
    desc_ru: 'Премиум 4-частный алюминиевый грайндер. Магнитная крышка, острые зубья, мелкая сетка, сборщик кифа. 50мм.'
  },
  {
    id: 'dc1', cat: 'flower',
    name_en: 'Double CK', name_ru: 'Double CK',
    grade: '4A', type: 'Hybrid', thc: '22-26%',
    effects_en: ['😌 Relaxed', '💫 Euphoric', '😊 Happy'],
    effects_ru: ['😌 Расслабление', '💫 Эйфория', '😊 Счастье'],
    prices: { '1г': 350, '3.5г': 950, '7г': 1700 },
    image: path.join(IMG_DIR, 'doubleck.jpg'),
    desc_en: 'Premium hybrid strain. Balanced effects — relaxing body high with euphoric cerebral uplift.',
    desc_ru: 'Премиум гибрид. Сбалансированный эффект — расслабление тела с эйфорией.'
  },
];

module.exports = { categories, products };
