// Parvati Weed Thailand - Premium v2.7 (Promos + Reviews + Thai + SQLite + Inline)
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');
const DELIVERY_FEE = 100;

// Delivery regions (RU/EN/TH)
const DELIVERY_REGIONS = [
  { id: 'bkk',    name_en: '🚕 Bangkok',           name_ru: '🚕 Бангкок',           name_th: '🚕 กรุงเทพ',         price: 100, time_en: '2-4h',  time_ru: '2-4ч',  time_th: '2-4ชม.' },
  { id: 'phuket', name_en: '🚕 Phuket',            name_ru: '🚕 Пхукет',            name_th: '🚕 ภูเก็ต',          price: 500, time_en: '1-2d',  time_ru: '1-2д',  time_th: '1-2วัน' },
  { id: 'samui',  name_en: '🚕 Koh Samui',         name_ru: '🚕 Самуи',             name_th: '🚕 เกาะสมุย',        price: 600, time_en: '1-2d',  time_ru: '1-2д',  time_th: '1-2วัน' },
  { id: 'pangan', name_en: '🚕 Koh Phangan',       name_ru: '🚕 Панган',            name_th: '🚕 เกาะพะงัน',       price: 700, time_en: '1-2d',  time_ru: '1-2д',  time_th: '1-2วัน' },
  { id: 'other',  name_en: '🚕 Other regions',     name_ru: '🚕 Другие регионы',    name_th: '🚕 อื่นๆ',           price: 800, time_en: '1-3d',  time_ru: '1-3д',  time_th: '1-3วัน' },
];

// Safe edit wrapper — ignore 'message not modified'
async function safeEdit(ctx, text, extra) {
  try { await ctx.editMessageText(text, extra); }
  catch (e) { if (!e.description?.includes('message is not modified')) console.error('Edit error:', e.message); }
}
const DB_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'parvati.db');
const db = new DatabaseSync(DB_PATH);

// ══════════════════════════════════════════
// DATABASE SCHEMA
// ══════════════════════════════════════════

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    chat_id INTEGER PRIMARY KEY,
    lang TEXT DEFAULT 'ru',
    name TEXT DEFAULT '',
    username TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS carts (
    chat_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    size TEXT DEFAULT '1г',
    qty INTEGER DEFAULT 1,
    added_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (chat_id, product_id, size)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    delivery INTEGER DEFAULT 100,
    region TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    contact TEXT DEFAULT '',
    address TEXT DEFAULT '',
    payment TEXT DEFAULT '',
    promo TEXT DEFAULT '',
    discount INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS promos (
    code TEXT PRIMARY KEY,
    discount INTEGER NOT NULL,
    type TEXT DEFAULT 'percent',
    uses INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    min_order INTEGER DEFAULT 0,
    expires TEXT DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed default promos
const DEFAULT_PROMOS = [
  { code: 'WELCOME10', discount: 10,  type: 'percent', max_uses: 500 },
  { code: 'PARVATI20', discount: 20,  type: 'percent', max_uses: 500 },
  { code: 'CAFE13',    discount: 50,  type: 'fixed',   max_uses: 500 },
  { code: 'FREESHIP',  discount: 100, type: 'fixed',   max_uses: 500 },
  { code: 'VIP5A',     discount: 15,  type: 'percent', max_uses: 200 },
];
const upsertPromo = db.prepare(`
  INSERT INTO promos (code, discount, type, max_uses)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(code) DO UPDATE SET discount=excluded.discount, type=excluded.type, max_uses=excluded.max_uses
`);
DEFAULT_PROMOS.forEach(p => upsertPromo.run(p.code, p.discount, p.type, p.max_uses));

// ─── Helpers ───────────────────────────────────────────────────────────
function getLang(chatId) {
  const row = db.prepare('SELECT lang FROM users WHERE chat_id = ?').get(chatId);
  return row ? row.lang : 'ru';
}

function t(chatId, en, ru, th) {
  const l = getLang(chatId);
  if (l === 'en') return en;
  if (l === 'th') return th || en;
  return ru;
}

function tRegion(chatId, region, field) {
  const l = getLang(chatId);
  if (l === 'en' && region[field + '_en']) return region[field + '_en'];
  if (l === 'th' && region[field + '_th']) return region[field + '_th'];
  return region[field + '_ru'] || region[field + '_en'];
}

const LANG_FLAGS = { ru: '🇷🇺', en: '🇬🇧', th: '🇹🇭' };

// ─── PROMO ENGINE ───────────────────────────────────────────────────────
function validatePromo(code, currentTotal) {
  const row = db.prepare('SELECT * FROM promos WHERE code = ?').get(code.toUpperCase());
  if (!row) return { valid: false, msg: { en: '❌ Invalid promo code', ru: '❌ Неверный промокод', th: '❌ รหัสโปรโมชั่นไม่ถูกต้อง' } };
  if (row.expires && new Date(row.expires) < new Date()) return { valid: false, msg: { en: '❌ Promo code expired', ru: '❌ Промокод истёк', th: '❌ โปรโมชั่นหมดอายุ' } };
  if (row.uses >= row.max_uses) return { valid: false, msg: { en: '❌ Promo usage limit reached', ru: '❌ Лимит использования промокода', th: '❌ ใช้โปรโมชั่นครบจำนวนแล้ว' } };
  if (currentTotal < row.min_order) return { valid: false, msg: { en: `❌ Minimum order ${row.min_order}฿ for this promo`, ru: `❌ Мин. заказ ${row.min_order}฿ для этого промокода`, th: `❌ คำสั่งซื้อขั้นต่ำ ${row.min_order}฿ สำหรับโปรโมชั่นนี้` } };

  let discountAmount = 0;
  if (row.type === 'percent') {
    discountAmount = Math.round(currentTotal * row.discount / 100);
  } else {
    discountAmount = row.discount;
  }
  // Don't exceed total
  if (discountAmount > currentTotal) discountAmount = currentTotal;

  return {
    valid: true,
    code: row.code,
    type: row.type,
    discountPercent: row.type === 'percent' ? row.discount : 0,
    discountAmount,
    row
  };
}

function applyPromo(code) {
  db.prepare('UPDATE promos SET uses = uses + 1 WHERE code = ?').run(code.toUpperCase());
}

// ─── Thai helper for product names
function pName(p, lang) {
  if (lang === 'th') return p.name_th || p.name_en;
  if (lang === 'ru') return p.name_ru || p.name_en;
  return p.name_en;
}

function getCart(chatId) {
  const rows = db.prepare('SELECT product_id, size, qty FROM carts WHERE chat_id = ?').all(chatId);
  return rows.map(r => {
    const p = products.find(pr => pr.id === r.product_id);
    if (!p || !p.prices) return null;
    const price = p.prices[r.size] || Math.min(...Object.values(p.prices));
    return {
      product_id: r.product_id,
      size: r.size,
      qty: r.qty,
      price: price,
      name_ru: p.name_ru || p.name_en,
      name_en: p.name_en,
      name_th: p.name_th || p.name_en
    };
  }).filter(Boolean);
}

function cartTotal(chatId) {
  const items = getCart(chatId);
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function formatCartText(chatId, promoResult) {
  const items = getCart(chatId);
  if (!items.length) return null;
  const l = getLang(chatId);
  let text = `🛒 *${t(chatId, 'Cart', 'Корзина', 'ตะกร้า')}:*\n\n`;
  let total = 0;
  items.forEach(i => {
    const name = pName(i, l);
    const itemTotal = i.price * i.qty;
    total += itemTotal;
    text += `• ${name} (${i.size}) × ${i.qty} = ${itemTotal}฿\n`;
  });
  text += `\n💵 ${t(chatId, 'Items', 'Товары', 'สินค้า')}: ${total}฿`;
  text += `\n🚚 ${t(chatId, 'Delivery', 'Доставка', 'จัดส่ง')}: ${DELIVERY_FEE}฿`;

  let finalTotal = total + DELIVERY_FEE;

  if (promoResult && promoResult.valid) {
    const discLabel = t(chatId, 'Discount', 'Скидка', 'ส่วนลด');
    text += `\n🏷️ ${discLabel}: -${promoResult.discountAmount}฿ (${promoResult.code})`;
    finalTotal -= promoResult.discountAmount;
  }

  text += `\n💰 *${t(chatId, 'Total', 'Итого', 'ทั้งหมด')}: ${finalTotal}฿*`;
  return { text, total: finalTotal, discount: promoResult?.discountAmount || 0 };
}

function formatProductCard(p, lang) {
  const isRu = lang === 'ru';
  const isTh = lang === 'th';
  const name = isTh ? (p.name_th || p.name_en) : (isRu ? (p.name_ru || p.name_en) : p.name_en);
  const desc = isTh ? (p.desc_th || p.desc_en) : (isRu ? (p.desc_ru || p.desc_en) : p.desc_en);
  const effects = isTh ? (p.effects_th || []) : (isRu ? (p.effects_ru || []) : (p.effects_en || []));

  const ge = { '5A+': '💎', '5A': '⭐', '4A': '🌟', '3A': '✨', 'A': '✅' };
  let caption = `🌿 *${name}*\n`;

  if (p.grade) caption += `${ge[p.grade] || ''} Grade: ${p.grade}`;
  if (p.type) caption += ` | ${p.type}`;
  if (p.thc) caption += `\n⚡ THC: ${p.thc}`;
  caption += '\n\n';

  if (effects.length > 0) {
    caption += `🔥 ${isTh ? 'ผล' : (isRu ? 'Эффекты' : 'Effects')}: `;
    caption += effects.join(' · ');
    caption += '\n\n';
  }

  caption += `📝 ${desc}\n\n`;
  caption += `💎 *${isTh ? 'ราคา' : (isRu ? 'Цены' : 'Prices')}:*\n`;
  Object.entries(p.prices || {}).forEach(([size, price]) => {
    caption += `▫️ ${size} — ${price.toLocaleString()}฿\n`;
  });

  return caption;
}

// ══════════════════════════════════════════
// KEYBOARDS
// ══════════════════════════════════════════

function mainMenuKeyboard(chatId) {
  const l = getLang(chatId);
  const shopL = t(chatId, '🛍️ Shop', '🛍️ Магазин', '🛍️ ร้านค้า');
  const cartL = t(chatId, '🛒 Cart', '🛒 Корзина', '🛒 ตะกร้า');
  const delL = t(chatId, '📍 Delivery', '📍 Доставка', '📍 จัดส่ง');
  const faqL = t(chatId, '❓ FAQ', '❓ FAQ', '❓ คำถาม');
  const suppL = t(chatId, '📞 Support', '📞 Поддержка', '📞 ช่วยเหลือ');
  const aboutL = t(chatId, 'ℹ️ About', 'ℹ️ О нас', 'ℹ️ เกี่ยวกับ');
  const howL = t(chatId, '📖 How to Order', '📖 Как заказать', '📖 วิธีสั่งซื้อ');

  let langBtn;
  if (l === 'ru') langBtn = '🌍 RU';
  else if (l === 'th') langBtn = '🌍 TH';
  else langBtn = '🌍 EN';

  return Markup.inlineKeyboard([
    [Markup.button.callback(shopL, 'shop')],
    [
      Markup.button.callback(cartL, 'cart'),
      Markup.button.callback(delL, 'delivery_info')
    ],
    [
      Markup.button.callback(faqL, 'faq'),
      Markup.button.callback(suppL, 'support')
    ],
    [
      Markup.button.callback(aboutL, 'about'),
      Markup.button.callback(howL, 'howto'),
      Markup.button.callback(langBtn, 'change_lang')
    ],
  ]);
}

function categoryKeyboard(chatId) {
  const l = getLang(chatId);
  const buts = categories.map(cat => [
    Markup.button.callback(
      l === 'th' ? (cat.name_th || cat.name_en) : (l === 'ru' ? cat.name_ru : cat.name_en),
      `cat_${cat.id}`
    )
  ]);
  buts.push([Markup.button.callback(t(chatId, '🔙 Main Menu', '🔙 Главное меню', '🔙 เมนูหลัก'), 'back_main')]);
  return Markup.inlineKeyboard(buts);
}

function productKeyboard(p, chatId) {
  const l = getLang(chatId);
  const sizes = Object.keys(p.prices || {});
  const sizeRow = sizes.map(s =>
    Markup.button.callback(`${s} — ${p.prices[s].toLocaleString()}฿`, `size_${p.id}_${s}`)
  );
  const rows = [];
  for (let i = 0; i < sizeRow.length; i += 3) {
    rows.push(sizeRow.slice(i, i + 3));
  }
  rows.push([
    Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад', '🔙 กลับ'), `cat_${p.cat}`),
    Markup.button.callback(t(chatId, '🛒 Cart', '🛒 Корзина', '🛒 ตะกร้า'), 'cart')
  ]);
  return Markup.inlineKeyboard(rows);
}

function cartKeyboard(chatId) {
  const l = getLang(chatId);
  const items = getCart(chatId);
  const buts = [];

  items.forEach((i) => {
    const name = pName(i, l);
    buts.push([
      Markup.button.callback(`➖ ${name} (${i.size})`, `dec_${i.product_id}|${i.size}`),
      Markup.button.callback(`🗑️`, `rm_${i.product_id}|${i.size}`)
    ]);
  });

  buts.push([
    Markup.button.callback(t(chatId, '✅ Checkout', '✅ Оформить заказ', '✅ สั่งซื้อ'), 'checkout'),
    Markup.button.callback(t(chatId, '🗑️ Clear', '🗑️ Очистить', '🗑️ ล้าง'), 'clear_cart')
  ]);
  buts.push([
    Markup.button.callback(t(chatId, '🛍️ Continue', '🛍️ Продолжить', '🛍️ เลือกเพิ่ม'), 'shop'),
    Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад', '🔙 กลับ'), 'back_main')
  ]);
  return Markup.inlineKeyboard(buts);
}

function paymentKeyboard(chatId) {
  const l = getLang(chatId);
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇹🇭 PromptPay QR', 'pay_qr')],
    [Markup.button.callback('💵 ' + t(chatId, 'Cash to Courier', 'Наличные курьеру', 'เงินสด'), 'pay_cash')],
    [Markup.button.callback('₿ Crypto (USDT/BTC)', 'pay_crypto')],
    [Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад', '🔙 กลับ'), 'cart')]
  ]);
}

function regionKeyboard(chatId) {
  const l = getLang(chatId);
  const rows = DELIVERY_REGIONS.map(r => {
    const rName = l === 'th' ? r.name_th : (l === 'ru' ? r.name_ru : r.name_en);
    const rTime = l === 'th' ? r.time_th : (l === 'ru' ? r.time_ru : r.time_en);
    return [
      Markup.button.callback(`${rName} — ${r.price}฿ (${rTime})`, `region_${r.id}`)
    ];
  });
  rows.push([Markup.button.callback('🏷️ ' + t(chatId, 'Enter promo code', 'Ввести промокод', 'ใส่รหัสโปร'), 'enter_promo')]);
  rows.push([Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад', '🔙 กลับ'), 'cart')]);
  return Markup.inlineKeyboard(rows);
}

// ══════════════════════════════════════════
// BOT
// ══════════════════════════════════════════

const bot = new Telegraf(BOT_TOKEN);
const answers = {}; // For session state (contact/address/promo input)

// ─── WELCOME IMAGE PATH ────────────────────────────────────────────────
const WELCOME_IMG = path.join(__dirname, 'images', 'welcome.png');

// ─── AGE VERIFICATION ──────────────────────────────────────────────────
function ageVerificationKeyboard(chatId) {
  const l = getLang(chatId);
  const confL = t(chatId, '✅ I am 18+', '✅ Мне есть 18+', '✅ ฉันอายุ 18+');
  let langBtn;
  if (l === 'ru') langBtn = '🇬🇧 English';
  else if (l === 'en') langBtn = '🇹🇭 ภาษาไทย';
  else langBtn = '🇷🇺 Русский';
  return Markup.inlineKeyboard([
    [Markup.button.callback(confL, 'age_confirm')],
    [Markup.button.callback(langBtn, 'change_lang')]
  ]);
}

// ─── START ─────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const from = ctx.from;
  db.prepare(`
    INSERT INTO users (chat_id, lang, name, username)
    VALUES (?, 'ru', ?, ?)
    ON CONFLICT(chat_id) DO UPDATE SET last_seen = datetime('now'), name = ?, username = ?
  `).run(chatId, from.first_name || '', from.username || '', from.first_name || '', from.username || '');

  // Remove old ReplyKeyboard
  await ctx.reply('👋', { reply_markup: { remove_keyboard: true } });

  // Send welcome image + age verification
  const l = getLang(chatId);
  const welcomeCaption = l === 'th'
    ? '🌿 *Parvati Weed Thailand*\n\n🏝️ บริการจัดส่งพรีเมียมทั่วประเทศไทย\n\n⚠️ *กรุณายืนยันว่าคุณอายุ 18 ปีขึ้นไป*'
    : l === 'en'
      ? '🌿 *Parvati Weed Thailand*\n\n🏝️ Premium delivery service throughout Thailand\n\n⚠️ *Please confirm you are 18+*'
      : '🌿 *Parvati Weed Thailand*\n\n🏝️ Премиум сервис доставки по всему Таиланду\n\n⚠️ *Подтвердите, что вам есть 18+*';

  if (fs.existsSync(WELCOME_IMG)) {
    await ctx.replyWithPhoto(
      { source: WELCOME_IMG },
      {
        caption: welcomeCaption,
        parse_mode: 'Markdown',
        reply_markup: ageVerificationKeyboard(chatId).reply_markup
      }
    );
  } else {
    await ctx.reply('🌿 *Parvati Weed Thailand*', {
      parse_mode: 'Markdown',
      reply_markup: ageVerificationKeyboard(chatId).reply_markup
    });
  }
});

// ─── AGE CONFIRM ────────────────────────────────────────────────────────
bot.action('age_confirm', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);

  const welcomeText = l === 'th'
    ? '🌿 *ยินดีต้อนรับสู่ Parvati!*\n\nบริการจัดส่งพรีเมียมของคุณในประเทศไทย 🏝️\n\n🏆 *ทำไมต้องเรา:*\n• เฉพาะเกรดพรีเมียม: 4A, 5A, 5A+ 💎\n• จัดส่งแบบไม่เปิดเผยตัวตนทั่วประเทศ 📦\n• ชำระเงิน: QR PromptPay / เงินสด / คริปโต 💳\n• ซัพพอร์ต 24/7 — พร้อมเสมอ 📞\n• ราคาต่ำเริ่มต้น 200 บาทต่อกรัม 🔥\n\n👇 เริ่มจากเมนู:'
    : l === 'en'
      ? '🌿 *Welcome to Parvati!*\n\nYour premium delivery service in Thailand 🏝️\n\n🏆 *Why us:*\n• Top grades only: 4A, 5A, 5A+ 💎\n• Anonymous nationwide delivery 📦\n• Payment: QR PromptPay / cash / crypto 💳\n• 24/7 support — always available 📞\n• Low prices from 200฿ per gram 🔥\n\n👇 Start with the menu:'
      : '🌿 *Добро пожаловать в Parvati!*\n\nВаш премиум сервис доставки в Таиланде 🏝️\n\n🏆 *Почему мы:*\n• Только топ грейды: 4A, 5A, 5A+ 💎\n• Анонимная доставка по всей стране 📦\n• Оплата: QR PromptPay / наличные / крипта 💳\n• Поддержка 24/7 — всегда на связи 📞\n• Низкие цены от 200฿ за грамм 🔥\n\n👇 Начните с меню:';

  await ctx.editMessageCaption(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── NAVIGATION ─────────────────────────────────────────────────────────
bot.action('back_main', async (ctx) => {
  const chatId = ctx.chat.id;
  await ctx.editMessageText('🌿 *Parvati Weed Thailand*', {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

bot.action('change_lang', async (ctx) => {
  const chatId = ctx.chat.id;
  const current = getLang(chatId);
  const nextLang = current === 'ru' ? 'en' : current === 'en' ? 'th' : 'ru';
  db.prepare('UPDATE users SET lang = ? WHERE chat_id = ?').run(nextLang, chatId);
  await ctx.editMessageText('🌿 *Parvati Weed Thailand*', {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── SHOP ────────────────────────────────────────────────────────────────
bot.action('shop', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  await ctx.editMessageText(
    l === 'th' ? '📂 *เลือกหมวดหมู่:*' : (l === 'ru' ? '📂 *Выберите категорию:*' : '📂 *Choose category:*'),
    { parse_mode: 'Markdown', reply_markup: categoryKeyboard(chatId).reply_markup }
  );
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────
categories.forEach(cat => {
  bot.action(`cat_${cat.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const l = getLang(chatId);
    const catProducts = products.filter(p => p.cat === cat.id);
    const catName = l === 'th' ? (cat.name_th || cat.name_en) : (l === 'ru' ? cat.name_ru : cat.name_en);

    if (!catProducts.length) {
      return ctx.editMessageText(
        l === 'th' ? '😕 ไม่มีสินค้า' : (l === 'ru' ? '😕 Нет товаров' : '😕 No products'),
        { reply_markup: categoryKeyboard(chatId).reply_markup }
      );
    }

    let text = `${catName}\n\n`;
    const buts = catProducts.map(p => {
      const pName = pName(p, l);
      text += `• *${pName}* — ${Math.min(...Object.values(p.prices || {0: 0}))}฿\n`;
      return [Markup.button.callback(`${pName} — ${Math.min(...Object.values(p.prices || {0: 0}))}฿`, `view_${p.id}`)];
    });
    buts.push([Markup.button.callback(l === 'th' ? '🔙 กลับ' : (l === 'ru' ? '🔙 Назад' : '🔙 Back'), 'shop')]);

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buts).reply_markup
    });
  });
});

// ─── PRODUCT CARD ──────────────────────────────────────────────────────
products.forEach(p => {
  bot.action(`view_${p.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const l = getLang(chatId);
    const caption = formatProductCard(p, l);

    if (p.image && fs.existsSync(p.image)) {
      try {
        await ctx.replyWithPhoto(
          { source: p.image },
          {
            caption,
            parse_mode: 'Markdown',
            reply_markup: productKeyboard(p, chatId).reply_markup
          }
        );
        return;
      } catch (e) {}
    }

    await ctx.editMessageText(caption, {
      parse_mode: 'Markdown',
      reply_markup: productKeyboard(p, chatId).reply_markup
    });
  });
});

// ─── SIZE SELECTION → ADD TO CART ────────────────────────────────────────
products.forEach(p => {
  const sizes = Object.keys(p.prices || {});
  sizes.forEach(s => {
    bot.action(`size_${p.id}_${s}`, async (ctx) => {
      const chatId = ctx.chat.id;
      const existing = db.prepare('SELECT * FROM carts WHERE chat_id = ? AND product_id = ? AND size = ?').get(chatId, p.id, s);
      if (existing) {
        db.prepare('UPDATE carts SET qty = qty + 1 WHERE chat_id = ? AND product_id = ? AND size = ?').run(chatId, p.id, s);
      } else {
        db.prepare('INSERT INTO carts (chat_id, product_id, size, qty) VALUES (?, ?, ?, 1)').run(chatId, p.id, s);
      }
      const l = getLang(chatId);
      const prName = pName(p, l);
      await ctx.answerCbQuery(`✅ ${prName} (${s}) +1`);
      await showCart(chatId, ctx, true);
    });
  });
});

// ─── CART ─────────────────────────────────────────────────────────────────
bot.action('cart', async (ctx) => {
  const chatId = ctx.chat.id;
  await showCart(chatId, ctx, true);
});

async function showCart(chatId, ctx, editMode = false) {
  const l = getLang(chatId);
  const ans = answers[chatId];
  const promoResult = ans?.promoResult || null;
  const cartData = formatCartText(chatId, promoResult);

  if (!cartData) {
    const msg = l === 'th' ? '🛒 *ตะกร้าว่าง*' : (l === 'ru' ? '🛒 *Корзина пуста*' : '🛒 *Cart is empty*');
    const replyMarkup = Markup.inlineKeyboard([
      [Markup.button.callback(l === 'th' ? '🛍️ ไปร้านค้า' : (l === 'ru' ? '🛍️ В магазин' : '🛍️ Shop'), 'shop')],
      [Markup.button.callback(l === 'th' ? '🔙 เมนูหลัก' : (l === 'ru' ? '🔙 Главное меню' : '🔙 Main Menu'), 'back_main')]
    ]).reply_markup;

    if (editMode) {
      await ctx.editMessageText(msg, { parse_mode: 'Markdown', reply_markup: replyMarkup });
    } else {
      await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: replyMarkup });
    }
    return;
  }

  const msg = editMode ? 'editMessageText' : 'reply';
  await ctx[msg](cartData.text, {
    parse_mode: 'Markdown',
    reply_markup: cartKeyboard(chatId).reply_markup
  });
}

// ─── CART CONTROLS ──────────────────────────────────────────────────────
bot.action(/^dec_(.+)\|(.+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const productId = ctx.match[1];
  const size = ctx.match[2];
  const item = db.prepare('SELECT * FROM carts WHERE chat_id = ? AND product_id = ? AND size = ?').get(chatId, productId, size);
  if (item) {
    if (item.qty <= 1) {
      db.prepare('DELETE FROM carts WHERE chat_id = ? AND product_id = ? AND size = ?').run(chatId, productId, size);
    } else {
      db.prepare('UPDATE carts SET qty = qty - 1 WHERE chat_id = ? AND product_id = ? AND size = ?').run(chatId, productId, size);
    }
  }
  // Clear promo on cart change
  if (answers[chatId]) { delete answers[chatId].promoResult; }
  await showCart(chatId, ctx, true);
});

bot.action(/^rm_(.+)\|(.+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const productId = ctx.match[1];
  const size = ctx.match[2];
  db.prepare('DELETE FROM carts WHERE chat_id = ? AND product_id = ? AND size = ?').run(chatId, productId, size);
  if (answers[chatId]) { delete answers[chatId].promoResult; }
  await showCart(chatId, ctx, true);
});

bot.action('clear_cart', async (ctx) => {
  const chatId = ctx.chat.id;
  db.prepare('DELETE FROM carts WHERE chat_id = ?').run(chatId);
  if (answers[chatId]) { delete answers[chatId].promoResult; }
  await showCart(chatId, ctx, true);
});

// ─── CHECKOUT ─────────────────────────────────────────────────────────────
bot.action('checkout', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const cartData = formatCartText(chatId, answers[chatId]?.promoResult || null);
  if (!cartData) return showCart(chatId, ctx, true);

  let text = cartData.text;
  text += `\n\n📍 *${t(chatId, 'Choose delivery region:', 'Выберите регион доставки:', 'เลือกเขตจัดส่ง:')}*`;

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: regionKeyboard(chatId).reply_markup
  });
});

// ─── REGION SELECTION ─────────────────────────────────────────────────────
DELIVERY_REGIONS.forEach(r => {
  bot.action(`region_${r.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const l = getLang(chatId);
    const ans = answers[chatId] || {};
    const promoResult = ans.promoResult || null;
    answers[chatId] = { ...answers[chatId], region: r.id, delivery_fee: r.price };

    const cartData = formatCartText(chatId, promoResult);
    let text = cartData.text;
    text += `\n🚚 ${tRegion(chatId, r, 'name')}: +${r.price}฿`;

    let finalTotal = cartData.total;
    text += `\n💰 *${t(chatId, 'Total', 'Итого', 'ทั้งหมด')}: ${finalTotal}฿*`;
    text += `\n\n💳 *${t(chatId, 'Choose payment:', 'Выберите способ оплаты:', 'เลือกวิธีชำระเงิน:')}*`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentKeyboard(chatId).reply_markup
    });
  });
});

// ─── PROMO CODE INPUT ─────────────────────────────────────────────────────
bot.action('enter_promo', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const prompt = l === 'th'
    ? '🏷️ *ใส่รหัสโปรโมชั่น:*\n\nพิมพ์รหัสของคุณ (เช่น WELCOME10, CAFE13)'
    : l === 'ru'
      ? '🏷️ *Введите промокод:*\n\nОтправьте код (например WELCOME10, CAFE13)'
      : '🏷️ *Enter promo code:*\n\nSend your code (e.g. WELCOME10, CAFE13)';

  const cancelLabel = t(chatId, '🔙 Cancel', '🔙 Отмена', '🔙 ยกเลิก');

  await ctx.editMessageText(prompt, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback(cancelLabel, 'checkout')]
    ]).reply_markup
  });

  answers[chatId] = { ...answers[chatId], awaiting_promo: true };
});

// ─── PAYMENT ──────────────────────────────────────────────────────────────
bot.action('pay_cash', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  await ctx.editMessageText(
    l === 'th'
      ? '💵 *ชำระเงินสด*\n\nกรุณาใส่ข้อมูลติดต่อของคุณ (เบอร์โทร หรือ Telegram):'
      : l === 'ru'
        ? '💵 *Оплата наличными курьеру*\n\nНапишите ваш контакт (телефон или Telegram):'
        : '💵 *Cash to Courier*\n\nPlease enter your contact (phone or Telegram):',
    { parse_mode: 'Markdown' }
  );
  answers[chatId] = { ...answers[chatId], awaiting: 'contact', payment: 'cash' };
});

bot.action('pay_crypto', async (ctx) => {
  const chatId = ctx.chat.id;
  const cartData = formatCartText(chatId, answers[chatId]?.promoResult || null);
  const fee = (answers[chatId] && answers[chatId].delivery_fee) || DELIVERY_FEE;
  const total = (cartData?.total || cartTotal(chatId) + fee);
  const wallet = '0x1234...ABCD';

  await ctx.editMessageText(
    getLang(chatId) === 'th'
      ? `₿ *ชำระด้วยคริปโต*\n\nจำนวน: ${total}฿\n\nส่ง USDT (TRC20) ไปที่:\n\`${wallet}\`\n\nหลังจากส่งแล้ว กรุณาใส่ข้อมูลติดต่อ:`
      : getLang(chatId) === 'ru'
        ? `₿ *Оплата криптой*\n\nСумма: ${total}฿\n\nОтправьте USDT (TRC20) на:\n\`${wallet}\`\n\nПосле отправки напишите ваш контакт:`
        : `₿ *Crypto Payment*\n\nAmount: ${total}฿\n\nSend USDT (TRC20) to:\n\`${wallet}\`\n\nAfter sending, enter your contact:`,
    { parse_mode: 'Markdown' }
  );
  answers[chatId] = { ...answers[chatId], awaiting: 'contact', payment: 'crypto' };
});

bot.action('pay_qr', async (ctx) => {
  const chatId = ctx.chat.id;
  const cartData = formatCartText(chatId, answers[chatId]?.promoResult || null);
  const fee = (answers[chatId] && answers[chatId].delivery_fee) || DELIVERY_FEE;
  const total = (cartData?.total || cartTotal(chatId) + fee);
  const promptpayId = '0900100000';

  await ctx.editMessageText(
    getLang(chatId) === 'th'
      ? `🇹🇭 *PromptPay QR*\n\nจำนวน: ${total}฿\n\n📱 PromptPay ID: \`${promptpayId}\`\n\nสแกนด้วยแอปธนาคาร\nหลังจากชำระเงิน กรุณาใส่ข้อมูลติดต่อ:`
      : getLang(chatId) === 'ru'
        ? `🇹🇭 *PromptPay QR*\n\nСумма: ${total}฿\n\n📱 PromptPay ID: \`${promptpayId}\`\n\nСканируйте в приложении банка.\nПосле оплаты напишите ваш контакт:`
        : `🇹🇭 *PromptPay QR*\n\nAmount: ${total}฿\n\n📱 PromptPay ID: \`${promptpayId}\`\n\nScan with your banking app.\nAfter payment, enter your contact:`,
    { parse_mode: 'Markdown' }
  );
  answers[chatId] = { ...answers[chatId], awaiting: 'contact', payment: 'promptpay' };
});

// ─── CONTACT / ADDRESS / PROMO INPUT ──────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const ans = answers[chatId];

  // ─── PROMO CODE INPUT ────────────────────────────────────────────────────
  if (ans?.awaiting_promo) {
    const l = getLang(chatId);
    const code = ctx.message.text.trim().toUpperCase();

    const itemsTotal = cartTotal(chatId);
    const fee = ans.delivery_fee || DELIVERY_FEE;
    const baseTotal = itemsTotal + fee;

    const result = validatePromo(code, baseTotal);

    if (!result.valid) {
      await ctx.reply(result.msg[l] || result.msg.en, { parse_mode: 'Markdown' });
      // Return to promo entry
      const prompt = l === 'th'
        ? '🏷️ *ลองอีกครั้ง:*\n\nพิมพ์รหัสโปรโมชั่นอื่น:'
        : l === 'ru'
          ? '🏷️ *Попробуйте другой код:*'
          : '🏷️ *Try another code:*';
      await ctx.reply(prompt, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(t(chatId, '🔙 Cancel', '🔙 Отмена', '🔙 ยกเลิก'), 'checkout')]
        ]).reply_markup
      });
      return;
    }

    // Valid promo — store result
    answers[chatId] = {
      ...ans,
      awaiting_promo: false,
      promoResult: result
    };

    const discMsg = result.type === 'percent'
      ? `-${result.discountPercent}%`
      : `-${result.discountAmount}฿`;

    const successMsg = l === 'th'
      ? `✅ *ใช้รหัส ${result.code} สำเร็จ!*\n\n${discMsg}`
      : l === 'ru'
        ? `✅ *Промокод ${result.code} применён!*\n\nСкидка ${discMsg}`
        : `✅ *Promo ${result.code} applied!*\n\n${discMsg} discount`;

    await ctx.reply(successMsg, { parse_mode: 'Markdown' });

    // Return to checkout with promo applied
    const regionId = ans.region || 'bkk';
    const regionData = DELIVERY_REGIONS.find(r => r.id === regionId) || DELIVERY_REGIONS[0];

    const cartData = formatCartText(chatId, result);
    let text = cartData.text;
    text += `\n🚚 ${tRegion(chatId, regionData, 'name')}: +${regionData.price}฿`;
    text += `\n💰 *${t(chatId, 'Total', 'Итого', 'ทั้งหมด')}: ${cartData.total}฿*`;
    text += `\n\n💳 *${t(chatId, 'Choose payment:', 'Выберите способ оплаты:', 'เลือกวิธีชำระเงิน:')}*`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentKeyboard(chatId).reply_markup
    });
    return;
  }

  // ─── CONTACT INPUT ────────────────────────────────────────────────────────
  if (ans?.awaiting === 'contact') {
    ans.contact = ctx.message.text;
    ans.awaiting = 'address';
    const l = getLang(chatId);
    await ctx.reply(
      l === 'th'
        ? '📍 *กรุณาใส่ที่อยู่จัดส่ง:*'
        : l === 'ru'
          ? '📍 *Напишите адрес доставки:*'
          : '📍 *Now enter delivery address:*',
      Markup.keyboard([['🔙 Назад']]).resize()
    );
    return;
  }

  // ─── ADDRESS INPUT (finalize order) ───────────────────────────────────────
  if (ans?.awaiting === 'address') {
    const l = getLang(chatId);
    const address = ctx.message.text;
    const items = getCart(chatId);
    const region = ans.region || 'bkk';
    const regionData = DELIVERY_REGIONS.find(r => r.id === region) || DELIVERY_REGIONS[0];
    const delivery_fee = ans.delivery_fee || DELIVERY_FEE;
    const promoResult = ans.promoResult || null;

    const cartData = formatCartText(chatId, promoResult);
    const total = cartData.total || (cartTotal(chatId) + delivery_fee - (promoResult?.discountAmount || 0));

    // Save order with region + promo
    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id, name_ru: i.name_ru, name_en: i.name_en, size: i.size,
      qty: i.qty, price: i.price
    })));
    db.prepare('INSERT INTO orders (chat_id, items, total, delivery, region, contact, address, payment, promo, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(chatId, itemsJson, total, delivery_fee, regionData.name_en, ans.contact, address, ans.payment,
           promoResult?.code || '', promoResult?.discountAmount || 0);

    // Increment promo usage
    if (promoResult?.valid) {
      applyPromo(promoResult.code);
    }

    // Admin notification
    let orderText = `🛒 *${l === 'th' ? 'คำสั่งซื้อใหม่!' : (l === 'ru' ? 'Новый заказ!' : 'New Order!')}*\n\n`;
    items.forEach(i => {
      const name = pName(i, l);
      orderText += `${name} (${i.size}) × ${i.qty} = ${i.price * i.qty}฿\n`;
    });
    orderText += `\n🚚 ${regionData.name_en}: ${delivery_fee}฿`;
    if (promoResult?.valid) {
      orderText += `\n🏷️ ${promoResult.code}: -${promoResult.discountAmount}฿`;
    }
    orderText += `\n💰 ${l === 'th' ? 'รวม' : (l === 'ru' ? 'Итого' : 'Total')}: ${total}฿`;
    orderText += `\n💳 ${l === 'th' ? 'ชำระ' : (l === 'ru' ? 'Оплата' : 'Payment')}: ${ans.payment}`;
    orderText += `\n👤 Contact: ${ans.contact}`;
    orderText += `\n📍 Address: ${address}`;
    orderText += `\n🆔 User: ${chatId}`;

    try { await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' }); } catch(e) {}

    // Clear cart & state
    db.prepare('DELETE FROM carts WHERE chat_id = ?').run(chatId);
    const usedPromo = promoResult?.valid ? promoResult.code : null;
    delete answers[chatId];

    const confirmMsg = l === 'th'
      ? '✅ *ยืนยันคำสั่งซื้อแล้ว!*\nเราจะติดต่อคุณเร็วๆ นี้ 📲\n\nขอบคุณที่เลือก Parvati Weed Thailand! 🌿'
      : l === 'ru'
        ? '✅ *Заказ подтверждён!*\nМы свяжемся с вами в ближайшее время 📲\n\nСпасибо за выбор Parvati Weed Thailand! 🌿'
        : '✅ *Order confirmed!*\nWe will contact you shortly 📲\n\nThank you for choosing Parvati Weed Thailand! 🌿';

    await ctx.reply(confirmMsg, {
      parse_mode: 'Markdown',
      reply_markup: (Markup.inlineKeyboard([
        [Markup.button.callback(l === 'th' ? '⭐ ให้คะแนน' : (l === 'ru' ? '⭐ Оставить отзыв' : '⭐ Leave a review'), 'rate_order')],
        [Markup.button.callback(l === 'th' ? '🔙 เมนูหลัก' : (l === 'ru' ? '🔙 Главное меню' : '🔙 Main Menu'), 'back_main')]
      ])).reply_markup
    });

    // Notify review request to admin
    if (usedPromo) {
      try {
        await ctx.telegram.sendMessage(
          ADMIN_ID,
          `🏷️ Promo used: *${usedPromo}* by user ${chatId}`,
          { parse_mode: 'Markdown' }
        );
      } catch(e) {}
    }
    return;
  }

  // ─── MY ORDERS ─────────────────────────────────────────────────────────
  if (ctx.message.text === '/myorders') {
    const myOrders = db.prepare('SELECT * FROM orders WHERE chat_id = ? ORDER BY created_at DESC LIMIT 10').all(chatId);
    if (!myOrders.length) {
      const emptyMsg = t(chatId, '📋 You have no orders yet.', '📋 У вас пока нет заказов.', '📋 คุณยังไม่มีคำสั่งซื้อ');
      return ctx.reply(emptyMsg);
    }
    const l = getLang(chatId);
    let text = l === 'th' ? '📋 *คำสั่งซื้อของฉัน:*\n\n' : (l === 'ru' ? '📋 *Мои заказы:*\n\n' : '📋 *My Orders:*\n\n');
    myOrders.forEach(o => {
      const statusL = l === 'th'
        ? (o.status === 'new' ? 'ใหม่' : o.status === 'delivered' ? 'จัดส่งแล้ว' : o.status)
        : o.status;
      text += `#${o.id} | ${o.created_at}\n💰 ${o.total}฿ | 🚚 ${o.region || '-'}\n💳 ${o.payment} | 📊 ${statusL}`;
      if (o.promo) text += `\n🏷️ ${o.promo} (-${o.discount}฿)`;
      text += '\n\n';
    });
    return ctx.reply(text, { parse_mode: 'Markdown' });
  }

  // ─── ADMIN COMMANDS ────────────────────────────────────────────────────
  if (chatId === ADMIN_ID && ctx.message.text === '/stats') {
    const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const orders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    const todayOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date('now')").get().c;
    const revenue = db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE date(created_at) = date('now')").get().s;
    const activeCarts = db.prepare('SELECT COUNT(DISTINCT chat_id) as c FROM carts').get().c;
    const promosUsed = db.prepare('SELECT COALESCE(SUM(uses),0) as s FROM promos').get().s;
    const reviews = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
    return ctx.reply(
      `📊 *Parvati Stats*\n\n👤 Users: ${users}\n📦 Всего заказов: ${orders}\n📅 Сегодня: ${todayOrders} (${revenue.toLocaleString()}฿)\n🛒 Активных корзин: ${activeCarts}\n🏷️ Промо использовано: ${promosUsed}\n⭐ Отзывов: ${reviews}`,
      { parse_mode: 'Markdown' }
    );
  }

  if (chatId === ADMIN_ID && ctx.message.text === '/orders') {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 15').all();
    if (!orders.length) return ctx.reply('No orders yet');
    let text = '📋 *Последние заказы:*\n\n';
    orders.forEach(o => {
      const items = JSON.parse(o.items || '[]');
      const itemSummary = items.map(i => `${i.qty}×${i.name_en || i.name_ru}${i.size ? '('+i.size+')' : ''}`).join(', ') || '-';
      text += `#${o.id} | ${o.created_at}\n${itemSummary}\n💰 ${o.total}฿ | 🚚 ${o.region || '-'}\n👤 ${o.contact} | 💳 ${o.payment} | 📊 ${o.status}`;
      if (o.promo) text += `\n🏷️ ${o.promo} (-${o.discount}฿)`;
      text += '\n\n';
    });
    return ctx.reply(text, { parse_mode: 'Markdown' });
  }

  // ─── RATING / REVIEW INPUT ────────────────────────────────────────────────
  if (ans?.awaiting_review) {
    const l = getLang(chatId);
    const reviewText = ctx.message.text;

    db.prepare('INSERT INTO reviews (chat_id, text, rating) VALUES (?, ?, ?)').run(chatId, reviewText, ans.review_rating || 5);
    delete answers[chatId];

    const thanksMsg = l === 'th'
      ? '⭐ *ขอบคุณสำหรับรีวิวของคุณ!*\n\nคำติชมของคุณช่วยให้เราดีขึ้น 🙏'
      : l === 'ru'
        ? '⭐ *Спасибо за ваш отзыв!*\n\nВаше мнение помогает нам становиться лучше 🙏'
        : '⭐ *Thank you for your review!*\n\nYour feedback helps us improve 🙏';

    await ctx.reply(thanksMsg, {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(chatId).reply_markup
    });
    return;
  }

  // ─── FALLBACK ──────────────────────────────────────────────────────────
  if (ctx.message.text === '🔙 Назад') {
    delete answers[chatId];
    await ctx.reply('🌿 *Parvati Weed Thailand*', {
      parse_mode: 'Markdown', reply_markup: mainMenuKeyboard(chatId).reply_markup
    });
    return;
  }

  // If we don't recognize the text, show main menu
  await ctx.reply(
    t(chatId, 'Use the buttons 👇', 'Используйте кнопки 👇', 'ใช้ปุ่มด้านล่าง 👇'),
    { reply_markup: mainMenuKeyboard(chatId).reply_markup }
  );
});

// ─── REVIEW RATING ─────────────────────────────────────────────────────────
bot.action('rate_order', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const title = l === 'th'
    ? '⭐ *ให้คะแนนคำสั่งซื้อของคุณ*\n\nเลือกคะแนน 1-5:'
    : l === 'ru'
      ? '⭐ *Оцените ваш заказ*\n\nВыберите оценку 1-5:'
      : '⭐ *Rate your order*\n\nChoose a rating 1-5:';

  const stars = ['1', '2', '3', '4', '5'].map(n => {
    const starStr = '⭐'.repeat(Number(n));
    return Markup.button.callback(starStr, `review_rate_${n}`);
  });

  await ctx.editMessageText(title, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([
      stars.slice(0, 3),
      stars.slice(3, 5),
      [Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад', '🔙 กลับ'), 'back_main')]
    ]).reply_markup
  });
});

// ─── REVIEW RATING CALLBACKS ──────────────────────────────────────────────
[1,2,3,4,5].forEach(rating => {
  bot.action(`review_rate_${rating}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const l = getLang(chatId);
    answers[chatId] = { ...answers[chatId], awaiting_review: true, review_rating: rating };

    const prompt = l === 'th'
      ? `⭐ *คุณให้คะแนน ${rating}/5*\n\nเขียนรีวิวเพิ่มเติม (หรือพิมพ์ /skip เพื่อข้ามข้อความ):`
      : l === 'ru'
        ? `⭐ *Вы поставили ${rating}/5*\n\nНапишите отзыв текстом (или /skip чтобы пропустить текст):`
        : `⭐ *You rated ${rating}/5*\n\nWrite a review text (or /skip to skip text):`;

    await ctx.editMessageText(prompt, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(l === 'th' ? '⏭️ ข้าม' : (l === 'ru' ? '⏭️ Пропустить' : '⏭️ Skip'), 'review_skip')],
        [Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад', '🔙 กลับ'), 'back_main')]
      ]).reply_markup
    });
  });
});

bot.action('review_skip', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const rating = answers[chatId]?.review_rating || 5;

  // Save review without text
  db.prepare('INSERT INTO reviews (chat_id, text, rating) VALUES (?, ?, ?)').run(chatId, '', rating);

  // Try to save the rating to the last order
  delete answers[chatId];

  const thanksMsg = l === 'th'
    ? '⭐ *ขอบคุณสำหรับคะแนนของคุณ!* 🙏'
    : l === 'ru'
      ? '⭐ *Спасибо за вашу оценку!* 🙏'
      : '⭐ *Thank you for your rating!* 🙏';

  await ctx.editMessageText(thanksMsg, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── DELIVERY INFO ─────────────────────────────────────────────────────────
bot.action('delivery_info', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  let text;

  if (l === 'th') {
    text = '🚚 *การจัดส่ง Parvati*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📍 *เขตและราคา:*';
    DELIVERY_REGIONS.forEach(r => {
      text += `\n${r.name_th} — ${r.price}฿ (${r.time_th})`;
    });
    text += '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🛡️ *การรับประกันของเรา:*\n' +
      '• 📦 บรรจุภัณฑ์สุญญากาศไม่เปิดเผยตัวตน\n' +
      '• 📸 รูปถ่ายแทร็กก่อนจัดส่ง\n' +
      '• 🔄 เปลี่ยนสินค้าหากมีตำหนิ\n' +
      '• 🤫 ความลับเต็มรูปแบบ\n' +
      '• 💬 ซัพพอร์ตทุกขั้นตอน\n\n' +
      '🎯 *ทำไมต้องเลือกเรา:*\n' +
      '• ราคาต่ำเริ่มต้น 200฿/ก\n' +
      '• จัดส่งวันต่อวันในกรุงเทพ\n' +
      '• เฉพาะเกรดพรีเมียม (4A, 5A, 5A+)\n' +
      '• เปิดบริการทุกวัน 10:00-22:00 น.';
  } else if (l === 'en') {
    text = '🚚 *Parvati Delivery*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📍 *Regions & pricing:*';
    DELIVERY_REGIONS.forEach(r => {
      text += `\n${r.name_en} — ${r.price}฿ (${r.time_en})`;
    });
    text += '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🛡️ *Our guarantees:*\n' +
      '• 📦 Anonymous vacuum packaging\n' +
      '• 📸 Tracking photo before dispatch\n' +
      '• 🔄 Replacement if defective\n' +
      '• 🤫 Full confidentiality\n' +
      '• 💬 Support at all stages\n\n' +
      '🎯 *Why choose us:*\n' +
      '• Low prices from 200฿/g\n' +
      '• Same-day delivery in Bangkok\n' +
      '• Top grades only (4A, 5A, 5A+)\n' +
      '• Open daily 10:00-22:00';
  } else {
    text = '🚚 *Доставка Parvati*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📍 *Регионы и стоимость:*';
    DELIVERY_REGIONS.forEach(r => {
      text += `\n${r.name_ru} — ${r.price}฿ (${r.time_ru})`;
    });
    text += '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🛡️ *Наши гарантии:*\n' +
      '• 📦 Анонимная вакуумная упаковка\n' +
      '• 📸 Фото трека перед отправкой\n' +
      '• 🔄 Замена при обнаружении брака\n' +
      '• 🤫 Полная конфиденциальность\n' +
      '• 💬 Поддержка на всех этапах\n\n' +
      '🎯 *Почему выбирают нас:*\n' +
      '• Низкие цены от 200฿/г\n' +
      '• Доставка день в день по Бангкоку\n' +
      '• Только топ грейды (4A, 5A, 5A+)\n' +
      '• Работаем с 10:00 до 22:00 ежедневно';
  }
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── FAQ ──────────────────────────────────────────────────────────────────
bot.action('faq', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  let text;

  if (l === 'th') {
    text = '❓ *คำถามที่พบบ่อย*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🕐 *ใช้เวลาจัดส่งนานแค่ไหน?*\n' +
      'กรุงเทพฯ และปริมณฑล: 2-4 ชม. 🚕\n' +
      'ภูเก็ต สมุย พะงัน: 1-2 วัน ⛴️\n' +
      'เขตอื่นๆ: 1-3 วัน 📦\n\n' +
      '💳 *มีช่องทางชำระเงินอะไรบ้าง?*\n' +
      '🇹🇭 PromptPay QR — โอนผ่านธนาคาร\n' +
      '💵 เงินสด — จ่ายตอนรับสินค้า\n' +
      '₿ คริปโต (USDT/BTC)\n\n' +
      '🆔 *ต้องใช้บัตรประชาชนไหม?*\n' +
      'ใช่ อายุ 18+ เท่านั้น\n' +
      'ข้อมูลของคุณเป็นความลับ 🔒\n\n' +
      '📦 *บรรจุสินค้าอย่างไร?*\n' +
      'บรรจุภัณฑ์สุญญากาศ — ไร้กลิ่น 100%\n' +
      'จัดส่งแบบไม่เปิดเผย ไม่มีเครื่องหมาย\n\n' +
      '📍 *จัดส่งไปยังที่ไหนบ้าง?*\n' +
      'ทั่วประเทศ: กรุงเทพ พัทยา ภูเก็ต\n' +
      'สมุย พะงัน เชียงใหม่ หัวหิน และอื่นๆ\n\n' +
      '🔄 *สามารถคืนสินค้าได้ไหม?*\n' +
      'เฉพาะสินค้าไม่ตรงตามที่สั่ง\n' +
      'จำเป็นต้องมีรูปรอยตำหนิเพื่อเปลี่ยน\n\n' +
      '🎁 *มีส่วนลดเมื่อสั่งเยอะไหม?*\n' +
      'มี! ยิ่งสั่งเยอะ ราคาต่อกรัมยิ่งถูก\n' +
      'ดูราคาในหน้ารายละเอียดสินค้า 👇';
  } else if (l === 'en') {
    text = '❓ *Frequently Asked Questions*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🕐 *Delivery time?*\n' +
      'Bangkok & vicinity: 2-4 hours 🚕\n' +
      'Phuket, Samui, Phangan: 1-2 days ⛴️\n' +
      'Other regions: 1-3 days 📦\n\n' +
      '💳 *Payment methods?*\n' +
      '🇹🇭 PromptPay QR — bank transfer\n' +
      '💵 Cash to courier on delivery\n' +
      '₿ Crypto (USDT/BTC)\n\n' +
      '🆔 *ID required?*\n' +
      'Yes, strictly 18+. No exceptions.\n' +
      'Your data is confidential 🔒\n\n' +
      '📦 *How is it packaged?*\n' +
      'Vacuum sealed — 100% odorless\n' +
      'Discreet delivery, no markings\n\n' +
      '📍 *Where do you deliver?*\n' +
      'Nationwide: Bangkok, Pattaya, Phuket,\n' +
      'Samui, Phangan, Chiang Mai, Hua Hin & more\n\n' +
      '🔄 *Returns?*\n' +
      'Only if item doesn\'t match order.\n' +
      'Photo of defect required for replacement.\n\n' +
      '🎁 *Bulk discounts?*\n' +
      'Yes! The more you take — the lower the gram price.\n' +
      'Check prices in product cards 👇';
  } else {
    text = '❓ *Часто задаваемые вопросы*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🕐 *Как быстро доставка?*\n' +
      'Бангкок и окрестности: 2-4 часа 🚕\n' +
      'Пхукет, Самуи, Панган: 1-2 дня ⛴️\n' +
      'Другие регионы: 1-3 дня 📦\n\n' +
      '💳 *Какие способы оплаты?*\n' +
      '🇹🇭 PromptPay QR — оплата через банк\n' +
      '💵 Наличные курьеру при получении\n' +
      '₿ Криптовалюта (USDT/BTC)\n\n' +
      '🆔 *Нужен ли ID?*\n' +
      'Да, обязательно 18+. Без исключений.\n' +
      'Ваши данные конфиденциальны 🔒\n\n' +
      '📦 *Как упакованы товары?*\n' +
      'Вакуумная упаковка — 100% без запаха\n' +
      'Дискретная доставка, без опознавательных знаков\n\n' +
      '📍 *Куда доставляете?*\n' +
      'Вся страна: Бангкок, Паттайя, Пхукет,\n' +
      'Самуи, Панган, Чиангмай, Хуа Хин и другие\n\n' +
      '🔄 *Возврат?*\n' +
      'Только если товар не соответствует заказу.\n' +
      'Фото дефекта обязательно для замены.\n\n' +
      '🎁 *Есть скидки за объём?*\n' +
      'Да! Чем больше берёте — тем ниже цена за грамм.\n' +
      'Смотрите цены в карточках товаров 👇';
  }

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── SUPPORT ────────────────────────────────────────────────────────────────
bot.action('support', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  let text;

  if (l === 'th') {
    text = '📞 *ซัพพอร์ต Parvati*\n\n' +
      'สำหรับคำถามเกี่ยวกับคำสั่งซื้อ จัดส่ง และความร่วมมือ:\n\n' +
      '👤 *ผู้จัดการ:* @dr_Andromeda\n' +
      '📱 *Telegram:* @Parvati_WeedThiBot\n\n' +
      '💬 หรือพิมพ์ข้อความตรงนี้ — เราจะตอบกลับเร็วๆ นี้!\n\n' +
      '🕐 *เวลาทำการ:*\n' +
      'ทุกวัน 10:00-22:00 น. (ICT, GMT+7)\n\n' +
      '⏰ *นอกเวลาทำการ:*\n' +
      'ฝากข้อความไว้ — เราจะตอบกลับในตอนเช้า';
  } else if (l === 'en') {
    text = '📞 *Parvati Support*\n\n' +
      'For orders, delivery and partnerships:\n\n' +
      '👤 *Manager:* @dr_Andromeda\n' +
      '📱 *Telegram:* @Parvati_WeedThiBot\n\n' +
      '💬 Or just write here — we\'ll respond shortly!\n\n' +
      '🕐 *Working hours:*\n' +
      'Daily 10:00-22:00 (ICT, GMT+7)\n\n' +
      '⏰ *After hours:*\n' +
      'Leave a message — we\'ll reply in the morning';
  } else {
    text = '📞 *Поддержка Parvati*\n\n' +
      'По вопросам заказов, доставки и сотрудничества:\n\n' +
      '👤 *Менеджер:* @dr_Andromeda\n' +
      '📱 *Telegram:* @Parvati_WeedThiBot\n\n' +
      '💬 Или просто напишите сюда — ответим в ближайшее время!\n\n' +
      '🕐 *Режим работы:*\n' +
      'Ежедневно 10:00-22:00 (ICT, GMT+7)\n\n' +
      '⏰ *В нерабочее время:*\n' +
      'Оставьте сообщение — ответим с утра';
  }

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── ABOUT ──────────────────────────────────────────────────────────────────
bot.action('about', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  let text;

  if (l === 'th') {
    text = 'ℹ️ *เกี่ยวกับ Parvati Weed Thailand*\n\n' +
      '🏝️ *เราเป็นใคร*\n' +
      'Parvati — บริการจัดส่งกัญชาและกระท่อมพรีเมียมทั่วประเทศไทย\n' +
      'ดำเนินงานตั้งแต่ปี 2024 ลูกค้าที่พึงพอใจนับพันราย\n\n' +
      '🏆 *มาตรฐานของเรา:*\n' +
      '• 💎 เฉพาะเกรดพรีเมียม: 4A, 5A, 5A+\n' +
      '• ✈️ นำเข้าสดจาก USA และ Cali\n' +
      '• 📦 บรรจุภัณฑ์สุญญากาศ — ไร้กลิ่น\n' +
      '• 🚚 จัดส่งรวดเร็วทั่วประเทศ\n' +
      '• 🔒 ความลับเต็มรูปแบบ\n' +
      '• 📞 ซัพพอร์ตทุกวันในเวลาทำการ\n\n' +
      '🎯 *พันธกิจของเรา:*\n' +
      'ทำให้กัญชาคุณภาพสูงเข้าถึงทุกคนในประเทศไทย — เร็ว ปลอดภัย และไม่เปิดเผย\n\n' +
      '🤝 *พันธมิตร:*\n' +
      'เชื่อมโยงกับ Cafe 13 — สถานที่ iconic บนเกาะพะงัน 🍃☕\n' +
      'ร่วมงานกับผู้นำเข้าชั้นนำจาก USA และ Cali\n\n' +
      '📍 *เขตฐาน:* เกาะพะงัน สุราษฎร์ธานี\n' +
      '🌍 *จัดส่ง:* ทั่วประเทศ';
  } else if (l === 'en') {
    text = 'ℹ️ *About Parvati Weed Thailand*\n\n' +
      '🏝️ *Who We Are*\n' +
      'Parvati — premium cannabis and kratom delivery service throughout Thailand.\n' +
      'Operating since 2024, thousands of satisfied customers.\n\n' +
      '🏆 *Our Standards:*\n' +
      '• 💎 Top grades only: 4A, 5A, 5A+\n' +
      '• ✈️ Fresh import from USA and Cali\n' +
      '• 📦 Anonymous vacuum packaging — odorless\n' +
      '• 🚚 Fast nationwide delivery\n' +
      '• 🔒 Full confidentiality\n' +
      '• 📞 24/7 support during working hours\n\n' +
      '🎯 *Our Mission:*\n' +
      'Making quality cannabis accessible to everyone in Thailand — fast, safe, and discreet.\n\n' +
      '🤝 *Partners:*\n' +
      'Affiliated with Cafe 13 — iconic spot on Koh Phangan 🍃☕\n' +
      'Working with leading USA and Cali importers.\n\n' +
      '📍 *Base region:* Koh Phangan, Surat Thani\n' +
      '🌍 *Delivery:* Nationwide';
  } else {
    text = 'ℹ️ *О Parvati Weed Thailand*\n\n' +
      '🏝️ *Кто мы*\n' +
      'Parvati — премиум сервис доставки каннабиса и кратома по всему Таиланду.\n' +
      'Работаем с 2024 года, тысячи довольных клиентов.\n\n' +
      '🏆 *Наши стандарты:*\n' +
      '• 💎 Только топ грейды: 4A, 5A, 5A+\n' +
      '• ✈️ Свежий импорт из USA и Cali\n' +
      '• 📦 Анонимная вакуумная упаковка — без запаха\n' +
      '• 🚚 Быстрая доставка по всей стране\n' +
      '• 🔒 Полная конфиденциальность\n' +
      '• 📞 Поддержка 24/7 в рабочее время\n\n' +
      '🎯 *Наша миссия:*\n' +
      'Сделать качественный каннабис доступным для каждого в Таиланде — быстро, безопасно и дискретно.\n\n' +
      '🤝 *Партнёры:*\n' +
      'Связаны с Cafe 13 — культовым местом на Koh Phangan 🍃☕\n' +
      'Сотрудничаем с ведущими импортёрами USA и Cali strains.\n\n' +
      '📍 *Базовый регион:* Koh Phangan, Surat Thani\n' +
      '🌍 *Доставка:* Вся страна';
  }

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── HOW TO ORDER ────────────────────────────────────────────────────────────
bot.action('howto', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  let text;

  if (l === 'th') {
    text = '📖 *วิธีสั่งซื้อ:*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '1️⃣ เข้า 🛍️ *ร้านค้า*\n' +
      '2️⃣ เลือกหมวดหมู่: 🌿 ดอก, 🍪 เอ็ดดี้, 🚬 จอยต์...\n' +
      '3️⃣ กดสินค้า → ดูรายละเอียดและราคา\n' +
      '4️⃣ กด ➕ *เพิ่ม* — สินค้าในตะกร้า\n' +
      '5️⃣ ทำซ้ำสำหรับสินค้าอื่น\n' +
      '6️⃣ เข้า 🛒 *ตะกร้า* → ตรวจสอบ\n' +
      '7️⃣ กด ✅ *สั่งซื้อ*\n' +
      '8️⃣ เลือกวิธีชำระเงิน 💳\n' +
      '9️⃣ ใส่ข้อมูลติดต่อ (โทร/TG)\n' +
      '🔟 ใส่ที่อยู่จัดส่ง 📍\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '✅ เสร็จ! เราจะติดต่อเพื่อยืนยัน\n\n' +
      '💡 *เคล็ดลับ:*\n' +
      'ต้องการสินค้าหลายอย่าง? เลือกใส่ตะกร้า\n' +
      'เหมือนร้านค้าออนไลน์ — ทั้งหมดในคำสั่งซื้อเดียว!\n\n' +
      '💳 *ช่องทางชำระเงิน:*\n' +
      '🇹🇭 PromptPay QR\n' +
      '💵 เงินสด\n' +
      '₿ คริปโต (USDT/BTC)';
  } else if (l === 'en') {
    text = '📖 *How to Order:*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '1️⃣ Tap 🛍️ *Shop*\n' +
      '2️⃣ Choose category: 🌿 Flower, 🍪 Edibles, 🚬 Pre-rolls...\n' +
      '3️⃣ Tap product → see description & prices\n' +
      '4️⃣ Tap ➕ *Add* — item in cart\n' +
      '5️⃣ Repeat for other items\n' +
      '6️⃣ Go to 🛒 *Cart* → review your order\n' +
      '7️⃣ Tap ✅ *Checkout*\n' +
      '8️⃣ Choose payment method 💳\n' +
      '9️⃣ Enter contact (phone/Telegram)\n' +
      '🔟 Enter delivery address 📍\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '✅ Done! We\'ll contact to confirm\n\n' +
      '💡 *Tip:*\n' +
      'Want multiple items? Build your cart\n' +
      'like an online store — all in one order!\n\n' +
      '💳 *Payment methods:*\n' +
      '🇹🇭 PromptPay QR\n' +
      '💵 Cash to courier\n' +
      '₿ Crypto (USDT/BTC)';
  } else {
    text = '📖 *Как сделать заказ:*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '1️⃣ Зайдите в 🛍️ *Магазин*\n' +
      '2️⃣ Выберите категорию: 🌿 Шишки, 🍪 Эдиблс, 🚬 Косяки...\n' +
      '3️⃣ Нажмите на товар → изучите описание и цены\n' +
      '4️⃣ Нажмите ➕ *Добавить* — товар в корзине\n' +
      '5️⃣ Повторите для других товаров\n' +
      '6️⃣ Зайдите в 🛒 *Корзину* → проверьте состав\n' +
      '7️⃣ Нажмите ✅ *Оформить заказ*\n' +
      '8️⃣ Выберите способ оплаты 💳\n' +
      '9️⃣ Введите контакт (телефон/Telegram)\n' +
      '🔟 Введите адрес доставки 📍\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '✅ Готово! Мы свяжемся для подтверждения\n\n' +
      '💡 *Подсказка:*\n' +
      'Хотите несколько товаров? Собирайте корзину\n' +
      'как в интернет-магазине — всё в одном заказе!\n\n' +
      '💳 *Способы оплаты:*\n' +
      '🇹🇭 PromptPay QR\n' +
      '💵 Наличные курьеру\n' +
      '₿ Криптовалюта (USDT/BTC)';
  }

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── ERROR HANDLER ───────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  const msg = err.description || err.message || String(err);
  // Silence "message not modified" errors — harmless user double-tap
  if (msg.includes('message is not modified')) return;
  console.error('⚠️ Bot error:', msg);
  try {
    ctx.telegram.sendMessage(ADMIN_ID, '⚠️ Bot error: ' + msg.substring(0, 300));
  } catch(e) {}
});

// ─── LAUNCH ──────────────────────────────────────────────────────────────
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not set');
  process.exit(1);
}

bot.launch();
console.log('🌿 Parvati Premium v2.7 (Promos + Reviews + Thai) running!');
console.log(`📊 DB: ${DB_PATH}`);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));