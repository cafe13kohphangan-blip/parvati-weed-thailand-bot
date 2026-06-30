// Parvati weed Thailand - Premium Kratom & Cannabis Collection
const categories = [
  { id: 'kratom',    name_en: '🍃 Premium Kratom Collection', name_ru: '🍃 Премиум Коллекция Кратом' },
  { id: 'flower',    name_en: '💎 Exclusive Flower Strains',  name_ru: '💎 Эксклюзивные Сорта Шишек' },
  { id: 'edibles',   name_en: '🍫 Gourmet Edibles',           name_ru: '🍫 Гурман Эдиблс' },
  { id: 'prerolls',  name_en: '🎯 Craft Pre-rolls',           name_ru: '🎯 Ручные Косяки' },
  { id: 'accessory', name_en: '🔮 Luxury Accessories',        name_ru: '🔮 Люксовые Аксессуары' },
];

const products = [
  // === PREMIUM KRATOM ===
  { id: 'k1', cat: 'kratom', name_en: '✨ Supreme Red Vein Kratom 100g', name_ru: '✨ Высший Красный Кратом 100г', price: 1200, desc_en: 'Award-winning strain. Relaxation & pain relief.', desc_ru: 'Наградной сорт. Релаксация & обезболивание.' },
  { id: 'k2', cat: 'kratom', name_en: '🏆 Imperial White Maeng Da 50g', name_ru: '🏆 Императорский Белый Maeng Da 50г', price: 900, desc_en: 'Ultimate energy & focus. Limited batch.', desc_ru: 'Максимум энергии & фокуса. Ограниченная партия.' },
  { id: 'k3', cat: 'kratom', name_en: '📿 Golden Bali Kratom Tea 20 bags', name_ru: '📿 Золотой Бали Кратом Чай 20 пак.', price: 750, desc_en: 'Hand-picked leaves. Ceremonial grade.', desc_ru: 'Листья ручного сбора. Церемониальный сорт.' },
  { id: 'k4', cat: 'kratom', name_en: '🎩 Reserve Green Malay Extract 15ml', name_ru: '🎩 Резервный Зелёный Малай Экстракт 15мл', price: 1500, desc_en: 'Triple-distilled. Pure alkaloids.', desc_ru: 'Тройная дистилляция. Чистые алкалоиды.' },

  // === EXCLUSIVE FLOWER ===
  { id: 'f1', cat: 'flower', name_en: '💎 OG Kush Diamond Cut', name_ru: '💎 OG Kush Алмазная Резка', price: 800, desc_en: '28% THC. Hand-trimmed, sun-grown.', desc_ru: '28% ТГК. Ручная обрезка, солнечное выращивание.' },
  { id: 'f2', cat: 'flower', name_en: '🖤 Black Truffle (Indica)', name_ru: '🖤 Чёрный Трюфель (Индика)', price: 950, desc_en: 'Exotic strain. Earthy, chocolate notes.', desc_ru: 'Экзотический сорт. Земляные, шоколадные ноты.' },
  { id: 'f3', cat: 'flower', name_en: '✨ White Runtz (Hybrid)', name_ru: '✨ Белый Runtz (Гибрид)', price: 1100, desc_en: 'Tropical fruit aroma. 30% THC.', desc_ru: 'Тропический фруктовый аромат. 30% ТГК.' },
  { id: 'f4', cat: 'flower', name_en: '📿 Purple Haze Reserve', name_ru: '📿 Purple Haze Резерв', price: 750, desc_en: 'Vintage 1970s genetics. Psychedelic.', desc_ru: 'Винтажная генетика 1970х. Психоделический.' },

  // === GOURMET EDIBLES ===
  { id: 'e1', cat: 'edibles', name_en: '🍫 Artisan Dark Chocolate 300mg', name_ru: '🍫 Артисан Тёмный Шоколад 300мг', price: 650, desc_en: 'Single-origin cocoa. Micro-dosed squares.', desc_ru: 'Моносортовое какао. Микродозированные квадраты.' },
  { id: 'e2', cat: 'edibles', name_en: '🍷 Cannabis-Infused Red Wine 750ml', name_ru: '🍷 Красное Вино с Каннабисом 750мл', price: 2200, desc_en: 'Cabernet Sauvignon. 100mg THC.', desc_ru: 'Каберне Совиньон. 100мг ТГК.' },
  { id: 'e3', cat: 'edibles', name_en: '🧁 Premium Gummies 5-star mix', name_ru: '🧁 Премиум Мармелад 5-звёздочный микс', price: 850, desc_en: 'Chef-crafted. 10 flavors, 250mg total.', desc_ru: 'Шеф-изготовление. 10 вкусов, 250мг всего.' },

  // === CRAFT PRE-ROLLS ===
  { id: 'p1', cat: 'prerolls', name_en: '🎯 King Size Connoisseur Pack 3x', name_ru: '🎯 Кинг Сайз Знатока 3шт', price: 1200, desc_en: 'Glass-tipped. Organic hemp wraps.', desc_ru: 'Стеклянные фильтры. Органические обёртки.' },
  { id: 'p2', cat: 'prerolls', name_en: '🖤 Black Edition Infused Joint', name_ru: '🖤 Чёрная Серия Наполненный Косяк', price: 800, desc_en: 'Dusted with kief & oil. 1.5g.', desc_ru: 'Посыпан кифом & маслом. 1.5г.' },

  // === LUXURY ACCESSORIES ===
  { id: 'a1', cat: 'accessory', name_en: '🔮 Obsidian Grinder with Gold', name_ru: '🔮 Обсидиановый Грайндер с Золотом', price: 2500, desc_en: 'Hand-carved. Magnetic gold-plated.', desc_ru: 'Ручная резка. Магнитный с позолотой.' },
  { id: 'a2', cat: 'accessory', name_en: '📿 Hemp Silk Rolling Tray', name_ru: '📿 Конопляный Шёлковый Поднос', price: 1200, desc_en: 'Embossed logo. Suede lining.', desc_ru: 'Тиснёный логотип. Замшевая подкладка.' },
  { id: 'a3', cat: 'accessory', name_en: '✨ 24K Gold Vaporizer', name_ru: '✨ 24-каратный Золотой Вейп', price: 4500, desc_en: 'Limited edition. Temperature control.', desc_ru: 'Лимитированная серия. Контроль температуры.' },
];

module.exports = { categories, products };
