// Parvati weed Thailand - SIMPLE FAST VERSION
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');

const userState = {};

function t(chatId, en, ru) {
  return (userState[chatId]?.lang === 'ru') ? ru : en;
}

const bot = new Telegraf(BOT_TOKEN);

// FAST START - сразу русский
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { lang: 'ru', cart: [] };
  
  await ctx.reply('🌿 Parvati weed Thailand', Markup.keyboard([
    ['🛍️ Магазин', '🛒 Корзина'],
    ['🌍 Язык', '📍 Доставка']
  ]).resize());
});

// Магазин - кнопки категорий
bot.hears('🛍️ Магазин', async (ctx) => {
  const buttons = categories.map(cat => [cat.name_ru]);
  buttons.push(['🔙 Назад']);
  await ctx.reply('Выберите категорию:', Markup.keyboard(buttons).resize());
});

// Категории
categories.forEach(cat => {
  bot.hears(cat.name_ru, async (ctx) => {
    const catProducts = products.filter(p => p.cat === cat.id);
    const buttons = catProducts.map(p => [`${p.name_ru} - ${p.price}฿`]);
    buttons.push(['🔙 Назад']);
    await ctx.reply(`${cat.name_ru}:`, Markup.keyboard(buttons).resize());
  });
});

// Добавление товара (по названию)
products.forEach(p => {
  bot.hears(`${p.name_ru} - ${p.price}฿`, async (ctx) => {
    const chatId = ctx.chat.id;
    if (!userState[chatId]) userState[chatId] = { lang: 'ru', cart: [] };
    
    const cart = userState[chatId].cart || [];
    const existing = cart.find(i => i.id === p.id);
    if (existing) existing.qty += 1;
    else cart.push({ id: p.id, qty: 1 });
    
    // Показываем корзину сразу
    let text = '✅ Добавлено в корзину!\n\n🛒 Корзина:\n';
    let total = 0;
    cart.forEach(item => {
      const prod = products.find(pr => pr.id === item.id);
      if (prod) {
        const itemTotal = prod.price * item.qty;
        total += itemTotal;
        text += `${prod.name_ru} × ${item.qty} = ${itemTotal}฿\n`;
      }
    });
    const delivery = 100;
    text += `\n🚚 Доставка: ${delivery}฿\n`;
    text += `💵 Товары: ${total}฿\n`;
    text += `💰 Итого: ${total + delivery}฿\n\nПродолжить покупки?`;
    
    await ctx.reply(text, Markup.keyboard([
      ['🛍️ Магазин', '✅ Оформить заказ'],
      ['🗑️ Очистить корзину', '🔙 Назад']
    ]).resize());
  });
});

// Корзина
bot.hears('🛒 Корзина', async (ctx) => {
  const chatId = ctx.chat.id;
  const cart = userState[chatId]?.cart || [];
  
  if (cart.length === 0) {
    return ctx.reply('🛒 Корзина пуста');
  }
  
  let text = '🛒 Ваша корзина:\n\n';
  let total = 0;
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.id);
    if (p) {
      const itemTotal = p.price * item.qty;
      total += itemTotal;
      text += `${p.name_ru} × ${item.qty} = ${itemTotal}฿\n`;
    }
  });
  const delivery = 100;
  text += `\n🚚 Доставка: ${delivery}฿\n`;
  text += `💵 Товары: ${total}฿\n`;
  text += `💰 Итого: ${total + delivery}฿\n\nОформить заказ?`;
  
  await ctx.reply(text, Markup.keyboard([
    ['✅ Оформить заказ', '🗑️ Очистить корзину'],
    ['🛍️ Продолжить покупки']
  ]).resize());
});

// Оформление заказа
bot.hears('✅ Оформить заказ', async (ctx) => {
  const chatId = ctx.chat.id;
  const cart = userState[chatId]?.cart || [];
  
  if (cart.length === 0) {
    return ctx.reply('🛒 Корзина пуста!');
  }
  
  let orderText = '*🛒 Новый заказ Parvati weed Thailand*\n\n';
  let total = 0;
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.id);
    if (p) {
      const itemTotal = p.price * item.qty;
      total += itemTotal;
      orderText += `${p.name_ru} × ${item.qty} = ${itemTotal}฿\n`;
    }
  });
  const delivery = 100;
  orderText += `\n🚚 Доставка: ${delivery}฿\n`;
  orderText += `💵 Товары: ${total}฿\n`;
  orderText += `💰 Итого: ${total + delivery}฿\n👤 Пользователь: ${chatId}`;
  
  await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' });
  userState[chatId].cart = [];
  
  await ctx.reply('✅ Заказ отправлен! Мы свяжемся с вами в Telegram.', 
    Markup.keyboard([['🛍️ Магазин']]).resize());
});

// Очистка корзины
bot.hears('🗑️ Очистить корзину', async (ctx) => {
  const chatId = ctx.chat.id;
  if (userState[chatId]) userState[chatId].cart = [];
  await ctx.reply('🗑️ Корзина очищена!', 
    Markup.keyboard([['🛍️ Магазин']]).resize());
});

// Назад
bot.hears('🔙 Назад', async (ctx) => {
  await ctx.reply('🌿 Главное меню:', Markup.keyboard([
    ['🛍️ Магазин', '🛒 Корзина'],
    ['🌍 Язык', '📍 Доставка']
  ]).resize());
});

// Язык
bot.hears('🌍 Язык', async (ctx) => {
  await ctx.reply('Выберите язык:', Markup.keyboard([
    ['🇷🇺 Русский', '🇬🇧 English'],
    ['🔙 Назад']
  ]).resize());
});

// Доставка
bot.hears('📍 Доставка', async (ctx) => {
  await ctx.reply('🚚 Доставка:\n\nФиксированная цена: 100฿\nДоставка по всем регионам Таиланда', 
    Markup.keyboard([['🔙 Назад']]).resize());
});

// Запуск
if (BOT_TOKEN) {
  bot.launch();
  console.log('🤖 Parvati bot (SIMPLE) запущен!');
} else {
  console.log('❌ Нет токена!');
}