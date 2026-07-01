// Parvati Weed Thailand - Premium v2.1 (SQLite + Inline + Payments)
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');
const DELIVERY_FEE = 100;

// Delivery regions
const DELIVERY_REGIONS = [
  { id: 'bkk', name_en: '🚕 Bangkok', name_ru: '🚕 Бангкок', price: 100, time_en: '2-4h', time_ru: '2-4ч' },
  { id: 'phuket', name_en: '🚕 Phuket', name_ru: '🚕 Пхукет', price: 500, time_en: '1-2d', time_ru: '1-2д' },
  { id: 'samui', name_en: '🚕 Koh Samui', name_ru: '🚕 Самуи', price: 600, time_en: '1-2d', time_ru: '1-2д' },
  { id: 'pangan', name_en: '🚕 Koh Phangan', name_ru: '🚕 Панган', price: 700, time_en: '1-2d', time_ru: '1-2д' },
  { id: 'other', name_en: '🚕 Other regions', name_ru: '🚕 Другие регионы', price: 800, time_en: '1-3d', time_ru: '1-3д' },
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
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Helpers ───────────────────────────────────────────────────────────
function getLang(chatId) {
  const row = db.prepare('SELECT lang FROM users WHERE chat_id = ?').get(chatId);
  return row ? row.lang : 'ru';
}

function t(chatId, en, ru) {
  return getLang(chatId) === 'en' ? en : ru;
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
      name_en: p.name_en
    };
  }).filter(Boolean);
}

function cartTotal(chatId) {
  const items = getCart(chatId);
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function formatCartText(chatId) {
  const items = getCart(chatId);
  if (!items.length) return null;
  const lang = getLang(chatId);
  let text = `🛒 *${lang === 'ru' ? 'Корзина' : 'Cart'}:*\n\n`;
  let total = 0;
  items.forEach(i => {
    const name = lang === 'ru' ? i.name_ru : i.name_en;
    const itemTotal = i.price * i.qty;
    total += itemTotal;
    text += `• ${name} (${i.size}) × ${i.qty} = ${itemTotal}฿\n`;
  });
  text += `\n💵 ${lang === 'ru' ? 'Товары' : 'Items'}: ${total}฿`;
  text += `\n🚚 ${lang === 'ru' ? 'Доставка' : 'Delivery'}: ${DELIVERY_FEE}฿`;
  text += `\n💰 *${lang === 'ru' ? 'Итого' : 'Total'}: ${total + DELIVERY_FEE}฿*`;
  return { text, total };
}

function formatProductCard(p, lang) {
  const isRu = lang === 'ru';
  const name = isRu ? (p.name_ru || p.name_en) : p.name_en;
  const desc = isRu ? (p.desc_ru || p.desc_en) : p.desc_en;
  const effects = isRu ? (p.effects_ru || []) : (p.effects_en || []);

  const ge = { '5A+': '💎', '5A': '⭐', '4A': '🌟', '3A': '✨', 'A': '✅' };
  let caption = `🌿 *${name}*\n`;

  if (p.grade) caption += `${ge[p.grade] || ''} Grade: ${p.grade}`;
  if (p.type) caption += ` | ${p.type}`;
  if (p.thc) caption += `\n⚡ THC: ${p.thc}`;
  caption += '\n\n';

  if (effects.length > 0) {
    caption += `🔥 ${isRu ? 'Эффекты' : 'Effects'}: `;
    caption += effects.join(' · ');
    caption += '\n\n';
  }

  caption += `📝 ${desc}\n\n`;
  caption += `💎 *${isRu ? 'Цены' : 'Prices'}:*\n`;
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
  return Markup.inlineKeyboard([
    [Markup.button.callback(l === 'ru' ? '🛍️ Магазин' : '🛍️ Shop', 'shop')],
    [
      Markup.button.callback(l === 'ru' ? '🛒 Корзина' : '🛒 Cart', 'cart'),
      Markup.button.callback(l === 'ru' ? '📍 Доставка' : '📍 Delivery', 'delivery_info')
    ],
    [
      Markup.button.callback(l === 'ru' ? '❓ FAQ' : '❓ FAQ', 'faq'),
      Markup.button.callback(l === 'ru' ? '📞 Поддержка' : '📞 Support', 'support')
    ],
    [
      Markup.button.callback(l === 'ru' ? 'ℹ️ О нас' : 'ℹ️ About', 'about'),
      Markup.button.callback(l === 'ru' ? '📖 Как заказать' : '📖 How to Order', 'howto'),
      Markup.button.callback(l === 'ru' ? '🌍 RU' : '🌍 EN', 'change_lang')
    ],
  ]);
}

function categoryKeyboard(chatId) {
  const l = getLang(chatId);
  const buts = categories.map(cat => [
    Markup.button.callback(l === 'ru' ? cat.name_ru : cat.name_en, `cat_${cat.id}`)
  ]);
  buts.push([Markup.button.callback(l === 'ru' ? '🔙 Главное меню' : '🔙 Main Menu', 'back_main')]);
  return Markup.inlineKeyboard(buts);
}

function productKeyboard(p, chatId) {
  const l = getLang(chatId);
  const sizes = Object.keys(p.prices || {});
  // Size selection buttons
  const sizeRow = sizes.map(s =>
    Markup.button.callback(`${s} — ${p.prices[s].toLocaleString()}฿`, `size_${p.id}_${s}`)
  );
  // Split into rows of 3 max
  const rows = [];
  for (let i = 0; i < sizeRow.length; i += 3) {
    rows.push(sizeRow.slice(i, i + 3));
  }
  rows.push([
    Markup.button.callback(l === 'ru' ? '🔙 Назад' : '🔙 Back', `cat_${p.cat}`),
    Markup.button.callback(l === 'ru' ? '🛒 Корзина' : '🛒 Cart', 'cart')
  ]);
  return Markup.inlineKeyboard(rows);
}

function cartKeyboard(chatId) {
  const l = getLang(chatId);
  const items = getCart(chatId);
  const buts = [];

  // Add remove buttons for each item
  items.forEach((i, idx) => {
    buts.push([
      Markup.button.callback(`➖ ${l === 'ru' ? i.name_ru : i.name_en}`, `cart_dec_${i.product_id}`),
      Markup.button.callback(`🗑️`, `cart_rm_${i.product_id}`)
    ]);
  });

  buts.push([
    Markup.button.callback(l === 'ru' ? '✅ Оформить заказ' : '✅ Checkout', 'checkout'),
    Markup.button.callback(l === 'ru' ? '🗑️ Очистить' : '🗑️ Clear', 'clear_cart')
  ]);
  buts.push([
    Markup.button.callback(l === 'ru' ? '🛍️ Продолжить' : '🛍️ Continue', 'shop'),
    Markup.button.callback(l === 'ru' ? '🔙 Назад' : '🔙 Back', 'back_main')
  ]);
  return Markup.inlineKeyboard(buts);
}

function paymentKeyboard(chatId) {
  const l = getLang(chatId);
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇹🇭 PromptPay QR', 'pay_qr')],
    [Markup.button.callback('💵 ' + (l === 'ru' ? 'Наличные курьеру' : 'Cash to Courier'), 'pay_cash')],
    [Markup.button.callback('₿ Crypto (USDT/BTC)', 'pay_crypto')],
    [Markup.button.callback(l === 'ru' ? '🔙 Назад' : '🔙 Back', 'cart')]
  ]);
}

// ══════════════════════════════════════════
// BOT
// ══════════════════════════════════════════

const bot = new Telegraf(BOT_TOKEN);
const answers = {}; // For session state (contact/address input)

// ─── WELCOME IMAGE PATH ────────────────────────────────────────────────
const WELCOME_IMG = path.join(__dirname, 'images', 'welcome.png');

// ─── AGE VERIFICATION ──────────────────────────────────────────────────
function ageVerificationKeyboard(chatId) {
  const l = getLang(chatId);
  return Markup.inlineKeyboard([
    [Markup.button.callback(l === 'ru' ? '✅ Мне есть 18+' : '✅ I am 18+', 'age_confirm')],
    [Markup.button.callback(l === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский', 'change_lang')]
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
  const welcomeCaption = l === 'ru'
    ? '🌿 *Parvati Weed Thailand*\n\n🏝️ Премиум сервис доставки по всему Таиланду\n\n⚠️ *Подтвердите, что вам есть 18+*'
    : '🌿 *Parvati Weed Thailand*\n\n🏝️ Premium delivery service throughout Thailand\n\n⚠️ *Please confirm you are 18+*';

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
  const welcomeText = l === 'ru'
    ? '🌿 *Добро пожаловать в Parvati!*\n\nВаш премиум сервис доставки в Таиланде 🏝️\n\n🏆 *Почему мы:*\n• Только топ грейды: 4A, 5A, 5A+ 💎\n• Анонимная доставка по всей стране 📦\n• Оплата: QR PromptPay / наличные / крипта 💳\n• Поддержка 24/7 — всегда на связи 📞\n• Низкие цены от 200฿ за грамм 🔥\n\n👇 Начните с меню:'
    : '🌿 *Welcome to Parvati!*\n\nYour premium delivery service in Thailand 🏝️\n\n🏆 *Why us:*\n• Top grades only: 4A, 5A, 5A+ 💎\n• Anonymous nationwide delivery 📦\n• Payment: QR PromptPay / cash / crypto 💳\n• 24/7 support — always available 📞\n• Low prices from 200฿ per gram 🔥\n\n👇 Start with the menu:';
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
  const newLang = current === 'ru' ? 'en' : 'ru';
  db.prepare('UPDATE users SET lang = ? WHERE chat_id = ?').run(newLang, chatId);
  await ctx.editMessageText(
    newLang === 'ru' ? '🌿 *Parvati Weed Thailand*' : '🌿 *Parvati Weed Thailand*',
    { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard(chatId).reply_markup }
  );
});

// ─── SHOP ────────────────────────────────────────────────────────────────
bot.action('shop', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  await ctx.editMessageText(
    l === 'ru' ? '📂 *Выберите категорию:*' : '📂 *Choose category:*',
    { parse_mode: 'Markdown', reply_markup: categoryKeyboard(chatId).reply_markup }
  );
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────
categories.forEach(cat => {
  bot.action(`cat_${cat.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const l = getLang(chatId);
    const catProducts = products.filter(p => p.cat === cat.id);
    const catName = l === 'ru' ? cat.name_ru : cat.name_en;

    if (!catProducts.length) {
      return ctx.editMessageText(
        l === 'ru' ? '😕 Нет товаров' : '😕 No products',
        { reply_markup: categoryKeyboard(chatId).reply_markup }
      );
    }

    let text = `${catName}\n\n`;
    const buts = catProducts.map(p => {
      const pName = l === 'ru' ? p.name_ru : p.name_en;
      text += `• *${pName}* — ${Math.min(...Object.values(p.prices || {0: 0}))}฿\n`;
      return [Markup.button.callback(`${pName} — ${Math.min(...Object.values(p.prices || {0: 0}))}฿`, `view_${p.id}`)];
    });
    buts.push([Markup.button.callback(l === 'ru' ? '🔙 Назад' : '🔙 Back', 'shop')]);

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
      const pName = l === 'ru' ? p.name_ru : p.name_en;
      await ctx.answerCbQuery(`✅ ${pName} (${s}) +1`);
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
  const cartData = formatCartText(chatId);

  if (!cartData) {
    const msg = l === 'ru' ? '🛒 *Корзина пуста*' : '🛒 *Cart is empty*';
    if (editMode) {
      await ctx.editMessageText(msg, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(l === 'ru' ? '🛍️ В магазин' : '🛍️ Shop', 'shop')],
          [Markup.button.callback(l === 'ru' ? '🔙 Главное меню' : '🔙 Main Menu', 'back_main')]
        ]).reply_markup
      });
    } else {
      await ctx.reply(msg, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(l === 'ru' ? '🛍️ В магазин' : '🛍️ Shop', 'shop')],
          [Markup.button.callback(l === 'ru' ? '🔙 Главное меню' : '🔙 Main Menu', 'back_main')]
        ]).reply_markup
      });
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
bot.action(/^cart_dec_(.+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const productId = ctx.match[1];
  const item = db.prepare('SELECT * FROM carts WHERE chat_id = ? AND product_id = ?').get(chatId, productId);
  if (item) {
    if (item.qty <= 1) {
      db.prepare('DELETE FROM carts WHERE chat_id = ? AND product_id = ?').run(chatId, productId);
    } else {
      db.prepare('UPDATE carts SET qty = qty - 1 WHERE chat_id = ? AND product_id = ?').run(chatId, productId);
    }
  }
  await showCart(chatId, ctx, true);
});

bot.action(/^cart_rm_(.+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const productId = ctx.match[1];
  db.prepare('DELETE FROM carts WHERE chat_id = ? AND product_id = ?').run(chatId, productId);
  await showCart(chatId, ctx, true);
});

bot.action('clear_cart', async (ctx) => {
  const chatId = ctx.chat.id;
  db.prepare('DELETE FROM carts WHERE chat_id = ?').run(chatId);
  await showCart(chatId, ctx, true);
});

function regionKeyboard(chatId) {
  const l = getLang(chatId);
  const rows = DELIVERY_REGIONS.map(r => [
    Markup.button.callback(`${r.name_en} — ${r.price}฿ (${l === 'ru' ? r.time_ru : r.time_en})`, `region_${r.id}`)
  ]);
  rows.push([Markup.button.callback(l === 'ru' ? '🔙 Назад' : '🔙 Back', 'cart')]);
  return Markup.inlineKeyboard(rows);
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────
bot.action('checkout', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const cartData = formatCartText(chatId);
  if (!cartData) return showCart(chatId, ctx, true);

  let text = cartData.text;
  text += `\n\n📍 *${l === 'ru' ? 'Выберите регион доставки:' : 'Choose delivery region:'}*`;

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
    answers[chatId] = { ...answers[chatId], region: r.id, delivery_fee: r.price };

    const cartData = formatCartText(chatId);
    let text = cartData.text;
    text += `\n🚚 ${r.name_en}: +${r.price}฿`;
    text += `\n💰 *${l === 'ru' ? 'Итого' : 'Total'}: ${cartData.total + r.price}฿*`;
    text += `\n\n💳 *${l === 'ru' ? 'Выберите способ оплаты:' : 'Choose payment:'}*`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentKeyboard(chatId).reply_markup
    });
  });
});

// ─── PAYMENT ──────────────────────────────────────────────────────────────
bot.action('pay_cash', async (ctx) => {
  const chatId = ctx.chat.id;
  await ctx.editMessageText(
    getLang(chatId) === 'ru'
      ? '💵 *Оплата наличными курьеру*\n\nНапишите ваш контакт (телефон или Telegram):'
      : '💵 *Cash to Courier*\n\nPlease enter your contact (phone or Telegram):',
    { parse_mode: 'Markdown' }
  );
  answers[chatId] = { awaiting: 'contact', payment: 'cash' };
});

bot.action('pay_crypto', async (ctx) => {
  const chatId = ctx.chat.id;
  const cartData = formatCartText(chatId);
  const total = cartData.total + DELIVERY_FEE;
  const wallet = '0x1234...ABCD'; // Replace with your wallet

  await ctx.editMessageText(
    getLang(chatId) === 'ru'
      ? `₿ *Оплата криптой*\n\nСумма: ${total}฿\n\nОтправьте USDT (TRC20) на:\n\`${wallet}\`\n\nПосле отправки напишите ваш контакт:`
      : `₿ *Crypto Payment*\n\nAmount: ${total}฿\n\nSend USDT (TRC20) to:\n\`${wallet}\`\n\nAfter sending, enter your contact:`,
    { parse_mode: 'Markdown' }
  );
  answers[chatId] = { awaiting: 'contact', payment: 'crypto' };
});

bot.action('pay_qr', async (ctx) => {
  const chatId = ctx.chat.id;
  const cartData = formatCartText(chatId);
  const total = cartData.total + DELIVERY_FEE;
  const promptpayId = '0900100000'; // Replace with your PromptPay

  await ctx.editMessageText(
    getLang(chatId) === 'ru'
      ? `🇹🇭 *PromptPay QR*\n\nСумма: ${total}฿\n\n📱 PromptPay ID: \`${promptpayId}\`\n\nСканируйте в приложении банка.\nПосле оплаты напишите ваш контакт:`
      : `🇹🇭 *PromptPay QR*\n\nAmount: ${total}฿\n\n📱 PromptPay ID: \`${promptpayId}\`\n\nScan with your banking app.\nAfter payment, enter your contact:`,
    { parse_mode: 'Markdown' }
  );
  answers[chatId] = { awaiting: 'contact', payment: 'promptpay' };
});

// ─── CONTACT / ADDRESS INPUT ──────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const ans = answers[chatId];

  if (ans?.awaiting === 'contact') {
    ans.contact = ctx.message.text;
    ans.awaiting = 'address';
    await ctx.reply(
      getLang(chatId) === 'ru'
        ? '📍 Теперь напишите адрес доставки:'
        : '📍 Now enter delivery address:',
      Markup.keyboard([['🔙 Назад']]).resize()
    );
    return;
  }

  if (ans?.awaiting === 'address') {
    const l = getLang(chatId);
    const address = ctx.message.text;
    const items = getCart(chatId);
    const total = cartTotal(chatId) + DELIVERY_FEE;

    // Save order
    const itemsJson = JSON.stringify(items.map(i => ({
      product_id: i.product_id, name_ru: i.name_ru, name_en: i.name_en,
      qty: i.qty, price: i.price
    })));
    db.prepare('INSERT INTO orders (chat_id, items, total, contact, address, payment) VALUES (?, ?, ?, ?, ?, ?)')
      .run(chatId, itemsJson, total, ans.contact, address, ans.payment);

    // Admin notification
    let orderText = `🛒 *${l === 'ru' ? 'Новый заказ!' : 'New Order!'}*\n\n`;
    items.forEach(i => {
      const name = l === 'ru' ? i.name_ru : i.name_en;
      orderText += `${name} × ${i.qty} = ${i.price * i.qty}฿\n`;
    });
    orderText += `\n💰 ${l === 'ru' ? 'Итого' : 'Total'}: ${total}฿`;
    orderText += `\n💳 ${l === 'ru' ? 'Оплата' : 'Payment'}: ${ans.payment}`;
    orderText += `\n👤 ${l === 'ru' ? 'Контакт' : 'Contact'}: ${ans.contact}`;
    orderText += `\n📍 ${l === 'ru' ? 'Адрес' : 'Address'}: ${address}`;
    orderText += `\n🆔 User: ${chatId}`;

    try { await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' }); } catch(e) {}

    // Clear cart
    db.prepare('DELETE FROM carts WHERE chat_id = ?').run(chatId);
    delete answers[chatId];

    await ctx.reply(
      l === 'ru'
        ? '✅ *Заказ подтверждён!*\nМы свяжемся с вами в ближайшее время 📲\n\nСпасибо за выбор Parvati Weed Thailand! 🌿'
        : '✅ *Order confirmed!*\nWe will contact you shortly 📲\n\nThank you for choosing Parvati Weed Thailand! 🌿',
      { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard(chatId).reply_markup }
    );
    return;
  }

  // ─── ADMIN COMMANDS ────────────────────────────────────────────────────
  if (chatId === ADMIN_ID && ctx.message.text === '/stats') {
    const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const orders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    const activeCarts = db.prepare('SELECT COUNT(DISTINCT chat_id) as c FROM carts').get().c;
    return ctx.reply(
      `📊 *Parvati Stats*\n\n👤 Users: ${users}\n📦 Orders: ${orders}\n🛒 Active carts: ${activeCarts}`,
      { parse_mode: 'Markdown' }
    );
  }

  if (chatId === ADMIN_ID && ctx.message.text === '/orders') {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all();
    if (!orders.length) return ctx.reply('No orders yet');
    let text = '📋 *Last 10 orders:*\n\n';
    orders.forEach(o => {
      text += `#${o.id} | ${o.created_at}\n💰 ${o.total}฿ | 📍 ${o.address}\n👤 ${o.contact} | 💳 ${o.payment} | 📊 ${o.status}\n\n`;
    });
    return ctx.reply(text, { parse_mode: 'Markdown' });
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
    getLang(chatId) === 'ru' ? 'Используйте кнопки 👇' : 'Use the buttons 👇',
    { reply_markup: mainMenuKeyboard(chatId).reply_markup }
  );
});

// ─── DELIVERY INFO ─────────────────────────────────────────────────────────
bot.action('delivery_info', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  let text = l === 'ru'
    ? '🚚 *Доставка Parvati*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📍 *Регионы и стоимость:*'
    : '🚚 *Parvati Delivery*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📍 *Regions & pricing:*';
  DELIVERY_REGIONS.forEach(r => {
    text += `\n${r.name_en} — ${r.price}฿ (${l === 'ru' ? r.time_ru : r.time_en})`;
  });
  text += l === 'ru'
    ? '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' +
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
      '• Работаем с 10:00 до 22:00 ежедневно'
    : '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' +
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
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── FAQ ──────────────────────────────────────────────────────────────────
bot.action('faq', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const text = l === 'ru'
    ? '❓ *Часто задаваемые вопросы*\n\n' +
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
      'Смотрите цены в карточках товаров 👇'
    : '❓ *Frequently Asked Questions*\n\n' +
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
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── SUPPORT ────────────────────────────────────────────────────────────────
bot.action('support', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const text = l === 'ru'
    ? '📞 *Поддержка Parvati*\n\n' +
      'По вопросам заказов, доставки и сотрудничества:\n\n' +
      '👤 *Менеджер:* @dr_Andromeda\n' +
      '📱 *Telegram:* @Parvati_WeedThiBot\n\n' +
      '💬 Или просто напишите сюда — ответим в ближайшее время!\n\n' +
      '🕐 *Режим работы:*\n' +
      'Ежедневно 10:00-22:00 (ICT, GMT+7)\n\n' +
      '⏰ *В нерабочее время:*\n' +
      'Оставьте сообщение — ответим с утра'
    : '📞 *Parvati Support*\n\n' +
      'For orders, delivery and partnerships:\n\n' +
      '👤 *Manager:* @dr_Andromeda\n' +
      '📱 *Telegram:* @Parvati_WeedThiBot\n\n' +
      '💬 Or just write here — we\'ll respond shortly!\n\n' +
      '🕐 *Working hours:*\n' +
      'Daily 10:00-22:00 (ICT, GMT+7)\n\n' +
      '⏰ *After hours:*\n' +
      'Leave a message — we\'ll reply in the morning';
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── ABOUT ──────────────────────────────────────────────────────────────────
bot.action('about', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const text = l === 'ru'
    ? 'ℹ️ *О Parvati Weed Thailand*\n\n' +
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
      '🌍 *Доставка:* Вся страна'
    : 'ℹ️ *About Parvati Weed Thailand*\n\n' +
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
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
});

// ─── HOW TO ORDER ────────────────────────────────────────────────────────────
bot.action('howto', async (ctx) => {
  const chatId = ctx.chat.id;
  const l = getLang(chatId);
  const text = l === 'ru'
    ? '📖 *Как сделать заказ:*\n\n' +
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
      '₿ Криптовалюта (USDT/BTC)'
    : '📖 *How to Order:*\n\n' +
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
console.log('🌿 Parvati Premium v2.1 (SQLite + Inline) running!');
console.log(`📊 DB: ${DB_PATH}`);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));