// Parvati weed Thailand - SQLite persistent version
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');

// ─── SQLite ────────────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'data', 'parvati.db');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const db = new Database(DB_PATH);

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
    qty INTEGER DEFAULT 1,
    added_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (chat_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    delivery INTEGER DEFAULT 100,
    status TEXT DEFAULT 'new',
    contact TEXT DEFAULT '',
    address TEXT DEFAULT '',
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
  return db.prepare(`
    SELECT c.product_id, c.qty, p.name_ru, p.name_en, p.price
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.chat_id = ?
  `).all(chatId);
}

function cartTotal(chatId) {
  const items = getCart(chatId);
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function formatCart(chatId) {
  const items = getCart(chatId);
  if (!items.length) return null;
  const lang = getLang(chatId);
  let text = t(chatId, '🛒 Your cart:\n\n', '🛒 Ваша корзина:\n\n');
  let total = 0;
  items.forEach(i => {
    const name = lang === 'ru' ? i.name_ru : i.name_en;
    const itemTotal = i.price * i.qty;
    total += itemTotal;
    text += `${name} × ${i.qty} = ${itemTotal}฿\n`;
  });
  const delivery = 100;
  text += `\n🚚 ${t(chatId, 'Delivery', 'Доставка')}: ${delivery}฿\n`;
  text += `💵 ${t(chatId, 'Items', 'Товары')}: ${total}฿\n`;
  text += `💰 ${t(chatId, 'Total', 'Итого')}: ${total + delivery}฿`;
  return { text, total };
}

// ─── Bot ───────────────────────────────────────────────────────────────
const bot = new Telegraf(BOT_TOKEN);

// START
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const from = ctx.from;
  db.prepare(`
    INSERT INTO users (chat_id, lang, name, username)
    VALUES (?, 'ru', ?, ?)
    ON CONFLICT(chat_id) DO UPDATE SET last_seen = datetime('now'), name = ?, username = ?
  `).run(chatId, from.first_name || '', from.username || '', from.first_name || '', from.username || '');

  await ctx.reply('🌿 Parvati weed Thailand', Markup.keyboard([
    ['🛍️ Магазин', '🛒 Корзина'],
    ['🌍 Язык', '📍 Доставка']
  ]).resize());
});

// МАГАЗИН
bot.hears('🛍️ Магазин', async (ctx) => {
  const buttons = categories.map(cat => [cat.name_ru]);
  buttons.push(['🔙 Назад']);
  await ctx.reply(t(ctx.chat.id, 'Choose category:', 'Выберите категорию:'), Markup.keyboard(buttons).resize());
});

// КАТЕГОРИИ
categories.forEach(cat => {
  bot.hears(cat.name_ru, async (ctx) => {
    const lang = getLang(ctx.chat.id);
    const catProducts = products.filter(p => p.cat === cat.id);
    const buttons = catProducts.map(p => [`${lang === 'ru' ? p.name_ru : p.name_en} - ${p.price}฿`]);
    buttons.push(['🔙 Назад']);
    await ctx.reply(`${cat.name_ru}:`, Markup.keyboard(buttons).resize());
  });
});

// ДОБАВЛЕНИЕ В КОРЗИНУ
products.forEach(p => {
  const ruRegex = new RegExp(`^${escapeRegex(p.name_ru)} - ${p.price}฿$`);
  const enRegex = p.name_en ? new RegExp(`^${escapeRegex(p.name_en)} - ${p.price}฿$`) : null;

  const handler = async (ctx) => {
    const chatId = ctx.chat.id;
    const existing = db.prepare('SELECT * FROM carts WHERE chat_id = ? AND product_id = ?').get(chatId, p.id);
    if (existing) {
      db.prepare('UPDATE carts SET qty = qty + 1 WHERE chat_id = ? AND product_id = ?').run(chatId, p.id);
    } else {
      db.prepare('INSERT INTO carts (chat_id, product_id, qty) VALUES (?, ?, 1)').run(chatId, p.id);
    }

    const cart = formatCart(chatId);
    let text = `✅ ${t(chatId, 'Added to cart!', 'Добавлено в корзину!')}\n\n${cart.text}`;
    if (cart) {
      text += `\n\n${t(chatId, 'Continue shopping?', 'Продолжить покупки?')}`;
    }

    await ctx.reply(text, Markup.keyboard([
      ['🛍️ Магазин', '✅ Оформить заказ'],
      ['🗑️ Очистить корзину', '🔙 Назад']
    ]).resize());
  };

  bot.hears(ruRegex, handler);
  if (enRegex) bot.hears(enRegex, handler);
});

// КОРЗИНА
bot.hears('🛒 Корзина', async (ctx) => {
  const chatId = ctx.chat.id;
  const cart = formatCart(chatId);
  if (!cart) {
    return ctx.reply(`🛒 ${t(chatId, 'Cart is empty', 'Корзина пуста')}`);
  }
  await ctx.reply(cart.text, Markup.keyboard([
    ['✅ Оформить заказ', '🗑️ Очистить корзину'],
    ['🛍️ Продолжить покупки', '🔙 Назад']
  ]).resize());
});

// ПРОДОЛЖИТЬ ПОКУПКИ
bot.hears('🛍️ Продолжить покупки', async (ctx) => {
  const buttons = categories.map(cat => [cat.name_ru]);
  buttons.push(['🔙 Назад']);
  await ctx.reply(t(ctx.chat.id, 'Choose category:', 'Выберите категорию:'), Markup.keyboard(buttons).resize());
});

// ОФОРМЛЕНИЕ ЗАКАЗА
bot.hears('✅ Оформить заказ', async (ctx) => {
  const chatId = ctx.chat.id;
  const items = getCart(chatId);
  if (!items.length) {
    return ctx.reply(`🛒 ${t(chatId, 'Cart is empty!', 'Корзина пуста!')}`);
  }

  // Просим контакт
  await ctx.reply(
    t(chatId,
      '📝 Please enter your contact info (phone or Telegram):',
      '📝 Напишите ваш контакт (телефон или Telegram):'
    ),
    Markup.keyboard([['🔙 Назад']]).resize()
  );
  ctx.session = { awaiting: 'contact' };
});

// ОБРАБОТКА КОНТАКТА
bot.hears(/^[\w@\s+\-()]+$/, async (ctx) => {
  const chatId = ctx.chat.id;
  if (!ctx.session?.awaiting) return;

  if (ctx.session.awaiting === 'contact') {
    ctx.session.contact = ctx.message.text;
    ctx.session.awaiting = 'address';
    await ctx.reply(
      t(chatId,
        '📍 Now enter your delivery address:',
        '📍 Теперь напишите адрес доставки:'
      ),
      Markup.keyboard([['🔙 Назад']]).resize()
    );
  } else if (ctx.session.awaiting === 'address') {
    const contact = ctx.session.contact;
    const address = ctx.message.text;
    delete ctx.session;

    // Сохраняем заказ
    const items = getCart(chatId);
    const total = cartTotal(chatId) + 100;
    const itemsJson = JSON.stringify(items.map(i => ({ id: i.product_id, name_ru: i.name_ru, name_en: i.name_en, qty: i.qty, price: i.price })));
    db.prepare('INSERT INTO orders (chat_id, items, total, contact, address) VALUES (?, ?, ?, ?, ?)').run(chatId, itemsJson, total, contact, address);

    // Уведомление админу
    const lang = getLang(chatId);
    let orderText = `🛒 *${t(chatId, 'New order!', 'Новый заказ!')}*\n\n`;
    items.forEach(i => {
      orderText += `${lang === 'ru' ? i.name_ru : i.name_en} × ${i.qty} = ${i.price * i.qty}฿\n`;
    });
    orderText += `\n💰 ${t(chatId, 'Total', 'Итого')}: ${total}฿`;
    orderText += `\n👤 ${t(chatId, 'Contact', 'Контакт')}: ${contact}`;
    orderText += `\n📍 ${t(chatId, 'Address', 'Адрес')}: ${address}`;
    orderText += `\n🆔 ${t(chatId, 'User', 'Пользователь')}: ${chatId}`;

    try { await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' }); } catch(e) {}

    // Очищаем корзину
    db.prepare('DELETE FROM carts WHERE chat_id = ?').run(chatId);

    await ctx.reply(
      t(chatId,
        '✅ Order confirmed! We will contact you shortly.',
        '✅ Заказ подтверждён! Мы свяжемся с вами в ближайшее время.'
      ),
      Markup.keyboard([['🛍️ Магазин']]).resize()
    );
  }
});

// ОЧИСТКА КОРЗИНЫ
bot.hears('🗑️ Очистить корзину', async (ctx) => {
  db.prepare('DELETE FROM carts WHERE chat_id = ?').run(ctx.chat.id);
  await ctx.reply(t(ctx.chat.id, '🗑️ Cart cleared!', '🗑️ Корзина очищена!'), Markup.keyboard([['🛍️ Магазин']]).resize());
});

// НАЗАД
bot.hears('🔙 Назад', async (ctx) => {
  delete ctx.session;
  await ctx.reply('🌿 Parvati weed Thailand', Markup.keyboard([
    ['🛍️ Магазин', '🛒 Корзина'],
    ['🌍 Язык', '📍 Доставка']
  ]).resize());
});

// ЯЗЫК
bot.hears('🌍 Язык', async (ctx) => {
  await ctx.reply(t(ctx.chat.id, 'Choose language:', 'Выберите язык:'), Markup.keyboard([
    ['🇷🇺 Русский', '🇬🇧 English'],
    ['🔙 Назад']
  ]).resize());
});

// ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА
bot.hears('🇷🇺 Русский', async (ctx) => {
  db.prepare('UPDATE users SET lang = ? WHERE chat_id = ?').run('ru', ctx.chat.id);
  await ctx.reply('🇷🇺 Язык изменён на русский', Markup.keyboard([
    ['🛍️ Магазин', '🛒 Корзина'],
    ['🌍 Язык', '📍 Доставка']
  ]).resize());
});

bot.hears('🇬🇧 English', async (ctx) => {
  db.prepare('UPDATE users SET lang = ? WHERE chat_id = ?').run('en', ctx.chat.id);
  await ctx.reply('🇬🇧 Language changed to English', Markup.keyboard([
    ['🛍️ Shop', '🛒 Cart'],
    ['🌍 Language', '📍 Delivery']
  ]).resize());
});

// АНГЛИЙСКИЕ КНОПКИ ПОСЛЕ ПЕРЕКЛЮЧЕНИЯ
bot.hears('🛍️ Shop', async (ctx) => {
  const buttons = categories.map(cat => [cat.name_en]);
  buttons.push(['🔙 Back']);
  await ctx.reply('Choose category:', Markup.keyboard(buttons).resize());
});

categories.forEach(cat => {
  bot.hears(cat.name_en, async (ctx) => {
    const catProducts = products.filter(p => p.cat === cat.id);
    const buttons = catProducts.map(p => [`${p.name_en} - ${p.price}฿`]);
    buttons.push(['🔙 Back']);
    await ctx.reply(`${cat.name_en}:`, Markup.keyboard(buttons).resize());
  });
});

bot.hears('🔙 Back', async (ctx) => {
  const lang = getLang(ctx.chat.id);
  await ctx.reply('🌿 Parvati weed Thailand', Markup.keyboard([
    [lang === 'ru' ? '🛍️ Магазин' : '🛍️ Shop', '🛒 Cart'],
    ['🌍 Language', '📍 Delivery']
  ]).resize());
});

bot.hears('🌍 Language', async (ctx) => {
  await ctx.reply('Choose language:', Markup.keyboard([
    ['🇷🇺 Русский', '🇬🇧 English'],
    ['🔙 Back']
  ]).resize());
});

// ДОСТАВКА
bot.hears('📍 Доставка', async (ctx) => {
  await ctx.reply(
    t(ctx.chat.id,
      '🚚 Delivery:\n\nFixed price: 100฿\nDelivery across all regions of Thailand',
      '🚚 Доставка:\n\nФиксированная цена: 100฿\nДоставка по всем регионам Таиланда'
    ),
    Markup.keyboard([['🔙 Назад']]).resize()
  );
});

bot.hears('📍 Delivery', async (ctx) => {
  await ctx.reply(
    '🚚 Delivery:\n\nFixed price: 100฿\nDelivery across all regions of Thailand',
    Markup.keyboard([['🔙 Back']]).resize()
  );
});

// ─── Admin commands ────────────────────────────────────────────────────
bot.hears('/stats', async (ctx) => {
  if (ctx.chat.id !== ADMIN_ID) return;
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const orders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const activeCarts = db.prepare('SELECT COUNT(DISTINCT chat_id) as c FROM carts').get().c;
  await ctx.reply(
    `📊 *Parvati Stats*\n\n👤 Users: ${users}\n📦 Orders: ${orders}\n🛒 Active carts: ${activeCarts}`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('/orders', async (ctx) => {
  if (ctx.chat.id !== ADMIN_ID) return;
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all();
  if (!orders.length) return ctx.reply('No orders yet');
  let text = '📋 *Last 10 orders:*\n\n';
  orders.forEach(o => {
    text += `#${o.id} | ${o.created_at}\n💰 ${o.total}฿ | 📍 ${o.address}\n👤 ${o.contact} | 📊 ${o.status}\n\n`;
  });
  await ctx.reply(text, { parse_mode: 'Markdown' });
});

// ─── ESCAPE ────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── LAUNCH ────────────────────────────────────────────────────────────
if (BOT_TOKEN) {
  bot.launch();
  console.log('🤖 Parvati bot (SQLite) запущен!');
  console.log(`📊 База данных: ${DB_PATH}`);
} else {
  console.log('❌ Нет токена! Укажите BOT_TOKEN в .env');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));