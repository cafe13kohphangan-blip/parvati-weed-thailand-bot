// Parvati weed Thailand - Extended product list with multiple sizes
const categories = [
  { id: 'kratom',    name_en: '🍃 Kratom Collection', name_ru: '🍃 Коллекция Кратом' },
  { id: 'flower',    name_en: '🌿 Flower Strains',    name_ru: '🌿 Сорта Шишек' },
  { id: 'edibles',   name_en: '🍪 Edibles',           name_ru: '🍪 Эдиблс' },
  { id: 'prerolls',  name_en: '🚬 Pre-rolls',         name_ru: '🚬 Готовые косяки' },
  { id: 'accessory', name_en: '🔧 Accessories',       name_ru: '🔧 Аксессуары' },
];

const products = [
  // === KRATOM (Multiple sizes like screenshots) ===
  { id: 'k1', cat: 'kratom', name_en: 'Kratom Powder 10g', name_ru: 'Порошок Кратом 10г', price: 150, desc_en: 'Red/Green/White strain', desc_ru: 'Красный/Зелёный/Белый сорт' },
  { id: 'k2', cat: 'kratom', name_en: 'Kratom Powder 25g', name_ru: 'Порошок Кратом 25г', price: 300, desc_en: 'Medium size', desc_ru: 'Средняя фасовка' },
  { id: 'k3', cat: 'kratom', name_en: 'Kratom Powder 50g', name_ru: 'Порошок Кратом 50г', price: 500, desc_en: 'Best value', desc_ru: 'Лучшее соотношение' },
  { id: 'k4', cat: 'kratom', name_en: 'Kratom Powder 100g', name_ru: 'Порошок Кратом 100г', price: 900, desc_en: 'Large size', desc_ru: 'Большая фасовка' },
  { id: 'k5', cat: 'kratom', name_en: 'Kratom Capsules 10pcs', name_ru: 'Капсулы Кратом 10шт', price: 200, desc_en: 'Easy to take', desc_ru: 'Удобно принимать' },
  { id: 'k6', cat: 'kratom', name_en: 'Kratom Capsules 30pcs', name_ru: 'Капсулы Кратом 30шт', price: 500, desc_en: '1 month supply', desc_ru: 'На 1 месяц' },
  { id: 'k7', cat: 'kratom', name_en: 'Kratom Tea 5 bags', name_ru: 'Чай Кратом 5 пак.', price: 180, desc_en: 'Traditional', desc_ru: 'Традиционный' },
  { id: 'k8', cat: 'kratom', name_en: 'Kratom Tea 20 bags', name_ru: 'Чай Кратом 20 пак.', price: 600, desc_en: 'Box of tea', desc_ru: 'Коробка чая' },
  { id: 'k9', cat: 'kratom', name_en: 'Kratom Extract 5ml', name_ru: 'Экстракт Кратом 5мл', price: 400, desc_en: 'Strong', desc_ru: 'Сильный' },
  { id: 'k10', cat: 'kratom', name_en: 'Kratom Extract 15ml', name_ru: 'Экстракт Кратом 15мл', price: 1000, desc_en: 'Premium extract', desc_ru: 'Премиум экстракт' },

  // === FLOWER (Multiple strains & sizes) ===
  { id: 'f1', cat: 'flower', name_en: 'OG Kush 1g', name_ru: 'OG Kush 1г', price: 300, desc_en: 'Hybrid, 22-26% THC', desc_ru: 'Гибрид, 22-26% ТГК' },
  { id: 'f2', cat: 'flower', name_en: 'OG Kush 3g', name_ru: 'OG Kush 3г', price: 800, desc_en: 'Better value', desc_ru: 'Выгоднее' },
  { id: 'f3', cat: 'flower', name_en: 'OG Kush 5g', name_ru: 'OG Kush 5г', price: 1200, desc_en: 'Best deal', desc_ru: 'Лучшая цена' },
  { id: 'f4', cat: 'flower', name_en: 'Amnesia Haze 1g', name_ru: 'Amnesia Haze 1г', price: 250, desc_en: 'Sativa, energetic', desc_ru: 'Сатива, бодрит' },
  { id: 'f5', cat: 'flower', name_en: 'Amnesia Haze 3g', name_ru: 'Amnesia Haze 3г', price: 700, desc_en: '3g pack', desc_ru: 'Упаковка 3г' },
  { id: 'f6', cat: 'flower', name_en: 'Northern Lights 1g', name_ru: 'Northern Lights 1г', price: 200, desc_en: 'Indica, relax', desc_ru: 'Индика, релакс' },
  { id: 'f7', cat: 'flower', name_en: 'Northern Lights 3g', name_ru: 'Northern Lights 3г', price: 550, desc_en: '3g pack', desc_ru: 'Упаковка 3г' },
  { id: 'f8', cat: 'flower', name_en: 'Blue Dream 1g', name_ru: 'Blue Dream 1г', price: 280, desc_en: 'Hybrid, creative', desc_ru: 'Гибрид, креатив' },
  { id: 'f9', cat: 'flower', name_en: 'Gelato 1g', name_ru: 'Gelato 1г', price: 350, desc_en: 'Dessert strain', desc_ru: 'Десертный сорт' },
  { id: 'f10', cat: 'flower', name_en: 'Gelato 3g', name_ru: 'Gelato 3г', price: 950, desc_en: '3g premium', desc_ru: '3г премиум' },
  { id: 'f11', cat: 'flower', name_en: 'Thai Stick 1g', name_ru: 'Thai Stick 1г', price: 80, desc_en: 'Local, budget', desc_ru: 'Местный, бюджет' },
  { id: 'f12', cat: 'flower', name_en: 'Thai Stick 5g', name_ru: 'Thai Stick 5г', price: 350, desc_en: '5g pack', desc_ru: 'Упаковка 5г' },

  // === FROM SCREENSHOTS ===
  { id: 'f13', cat: 'flower', name_en: 'Imperium X Black Berry Pop Pop', name_ru: 'Imperium X Black Berry Pop Pop', price: 1350, desc_en: 'Sativa 60%. Uplifting', desc_ru: 'Сатива 60%. Подъём' },
  { id: 'f14', cat: 'flower', name_en: 'Black Berry Pop (2s)', name_ru: 'Black Berry Pop (2s)', price: 509, desc_en: 'Hybrid. Relaxed', desc_ru: 'Гибрид. Релакс' },
  { id: 'f15', cat: 'flower', name_en: 'OG Kush Face Off OG', name_ru: 'OG Kush Face Off OG', price: 800, desc_en: 'Hybrid 55% + Sativa', desc_ru: 'Гибрид 55% + Сатива' },

  // === EDIBLES ===
  { id: 'e1', cat: 'edibles', name_en: 'Gummy Bears 50mg', name_ru: 'Мармелад 50мг', price: 200, desc_en: '5 pieces', desc_ru: '5 штук' },
  { id: 'e2', cat: 'edibles', name_en: 'Gummy Bears 100mg', name_ru: 'Мармелад 100мг', price: 350, desc_en: '10 pieces', desc_ru: '10 штук' },
  { id: 'e3', cat: 'edibles', name_en: 'Gummy Bears 200mg', name_ru: 'Мармелад 200мг', price: 600, desc_en: '20 pieces', desc_ru: '20 штук' },
  { id: 'e4', cat: 'edibles', name_en: 'Choco Brownie 100mg', name_ru: 'Брауни 100мг', price: 250, desc_en: 'Single brownie', desc_ru: 'Одно брауни' },
  { id: 'e5', cat: 'edibles', name_en: 'Choco Brownie 200mg', name_ru: 'Брауни 200мг', price: 400, desc_en: 'Strong', desc_ru: 'Сильное' },
  { id: 'e6', cat: 'edibles', name_en: 'Cookies 150mg', name_ru: 'Печенье 150мг', price: 300, desc_en: '4 cookies', desc_ru: '4 печенья' },

  // === PRE-ROLLS ===
  { id: 'p1', cat: 'prerolls', name_en: 'Joint 0.5g', name_ru: 'Косяк 0.5г', price: 100, desc_en: 'Single joint', desc_ru: 'Один косяк' },
  { id: 'p2', cat: 'prerolls', name_en: 'Joint 1g', name_ru: 'Косяк 1г', price: 180, desc_en: 'King size', desc_ru: 'Кинг сайз' },
  { id: 'p3', cat: 'prerolls', name_en: '3-Pack 0.5g', name_ru: '3-Pack 0.5г', price: 250, desc_en: '3 joints', desc_ru: '3 косяка' },
  { id: 'p4', cat: 'prerolls', name_en: '5-Pack 0.5g', name_ru: '5-Pack 0.5г', price: 400, desc_en: '5 joints', desc_ru: '5 косяков' },
  { id: 'p5', cat: 'prerolls', name_en: 'Infused Joint', name_ru: 'Наполненный косяк', price: 350, desc_en: 'With kief & oil', desc_ru: 'С кифом и маслом' },

  // === ACCESSORIES ===
  { id: 'a1', cat: 'accessory', name_en: 'Rolling Papers 50', name_ru: 'Бумаги 50', price: 50, desc_en: 'King size', desc_ru: 'Кинг сайз' },
  { id: 'a2', cat: 'accessory', name_en: 'Rolling Papers 100', name_ru: 'Бумаги 100', price: 80, desc_en: '100 papers', desc_ru: '100 бумаг' },
  { id: 'a3', cat: 'accessory', name_en: 'Grinder Small', name_ru: 'Грайндер малый', price: 250, desc_en: '2-piece', desc_ru: '2 части' },
  { id: 'a4', cat: 'accessory', name_en: 'Grinder Premium', name_ru: 'Грайндер премиум', price: 450, desc_en: '4-piece, kief catcher', desc_ru: '4 части, сборщик кифа' },
  { id: 'a5', cat: 'accessory', name_en: 'Glass Pipe', name_ru: 'Стеклянная трубка', price: 300, desc_en: 'Hand-blown', desc_ru: 'Ручная работа' },
  { id: 'a6', cat: 'accessory', name_en: 'Bong Small', name_ru: 'Бонг малый', price: 800, desc_en: '20cm', desc_ru: '20см' },
  { id: 'a7', cat: 'accessory', name_en: 'Bong Large', name_ru: 'Бонг большой', price: 1500, desc_en: '40cm with ice catcher', desc_ru: '40см с ледоприёмником' },
  { id: 'a8', cat: 'accessory', name_en: 'Lighter 5pcs', name_ru: 'Зажигалки 5шт', price: 50, desc_en: 'Assorted colors', desc_ru: 'Разные цвета' },
];

module.exports = { categories, products };
