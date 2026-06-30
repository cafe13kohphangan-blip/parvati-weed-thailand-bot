// Parvati weed Thailand Telegram Bot
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products_final_kratom');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');

// Delivery regions
const deliveryRegions = [
  { id: 'bangkok', name_en: 'Bangkok', name_ru: 'Бангкок', price: 100, delivery_time_en: '2-4 hours', delivery_time_ru: '2-4 часа' },
  { id: 'phuket', name_en: 'Phuket', name_ru: 'Пхукет', price: 500, delivery_time_en: '1-2 days', delivery_time_ru: '1-2 дня' },
  { id: 'samui', name_en: 'Samui', name_ru: 'Самуи', price: 600, delivery_time_en: '1-2 days', delivery_time_ru: '1-2 дня' },
  { id: 'pangyan', name_en: 'Pangyan', name_ru: 'Пангану', price: 700, delivery_time_en: '1-2 days', delivery_time_ru: '1-2 дня' },
];

const userState = {}; // chatId -> { lang, cart: [{ id, qty }], deliveryRegion }

function t(chatId, en, ru) {
  const lang = userState[chatId]?.lang || 'en';
  return lang === 'ru' ? ru : en;
}

// Language selection menu
function langMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇬🇧 English', 'lang_en')],
    [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
  ]);
}

// Main menu
function mainMenu(chatId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          Markup.button.callback(t(chatId, '🛍️ Shop', '🛍️ Магазин'), 'shop'),
          Markup.button.callback(t(chatId, '🛒 Cart', '🛒 Корзина'), 'cart')
        ],
        [Markup.button.callback(t(chatId, '🌍 Language', '🌍 Язык'), 'change_lang')],
        [Markup.button.callback(t(chatId, '📍 Delivery Info', '📍 Доставка'), 'delivery_info')],
      ]
    }
  };
}

const bot = new Telegraf(BOT_TOKEN);

// Start command - language selection
bot.start(async (ctx) => {
  await ctx.reply(
    '🌿 Welcome to Parvati weed Thailand!\nChoose your language / Выберите язык:',
    langMenu()
  );
});

// Language selection
bot.action('lang_en', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!userState[chatId]) userState[chatId] = { lang: 'en', cart: [] };
  userState[chatId].lang = 'en';
  await ctx.editMessageText(
    '🌿 Welcome to Parvati weed Thailand!',
    mainMenu(chatId)
  );
});

bot.action('lang_ru', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!userState[chatId]) userState[chatId] = { lang: 'ru', cart: [] };
  userState[chatId].lang = 'ru';
  await ctx.editMessageText(
    '🌿 Добро пожаловать в Parvati weed Thailand!',
    mainMenu(chatId)
  );
});

// Change language
bot.action('change_lang', async (ctx) => {
  await ctx.editMessageText(
    'Choose your language / Выберите язык:',
    langMenu()
  );
});

// Delivery info
bot.action('delivery_info', async (ctx) => {
  const chatId = ctx.chat.id;
  let text = t(chatId, '🚚 Delivery Information:\n\n', '🚚 Информация о доставке:\n\n');
  deliveryRegions.forEach(region => {
    text += `📍 ${region.name_en} (${region.name_ru}) - ${region.price} THB\n`;
    text += t(chatId, `   ⏰ ${region.delivery_time_en}\n`, `   ⏰ ${region.delivery_time_ru}\n`);
  });
  await ctx.editMessageText(text, mainMenu(chatId));
});

// Shop - categories
bot.action('shop', async (ctx) => {
  const chatId = ctx.chat.id;
  const buttons = categories.map(cat => [
    Markup.button.callback(cat.name_en, `cat_${cat.id}`)
  ]);
  buttons.push([Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад'), 'back_main')]);
  await ctx.editMessageText(
    t(chatId, 'Choose a category:', 'Выберите категорию:'),
    { reply_markup: { inline_keyboard: buttons } }
  );
});

// Show category products
categories.forEach(cat => {
  bot.action(`cat_${cat.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const catProducts = products.filter(p => p.cat === cat.id);
    const buttons = catProducts.map(p => [
      Markup.button.callback(
        `${p.name_en} - ${p.price} THB`, 
        `add_${p.id}`
      )
    ]);
    buttons.push([Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад'), 'back_cat')]);
    await ctx.editMessageText(
      `${cat.name_en} / ${cat.name_ru}\n${t(chatId, 'Choose product:', 'Выберите товар:')}`,
      { reply_markup: { inline_keyboard: buttons } }
    );
  });
});

// Add to cart
products.forEach(p => {
  bot.action(`add_${p.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    if (!userState[chatId]) userState[chatId] = { lang: 'en', cart: [] };
    const cart = userState[chatId].cart || [];
    const existing = cart.find(i => i.id === p.id);
    if (existing) existing.qty += 1;
    else cart.push({ id: p.id, qty: 1 });
    await ctx.answerCbQuery(
      t(chatId, `Added ${p.name_en} to cart!`, `Добавлено ${p.name_ru} в корзину!`)
    );
  });
});

// Show cart
bot.action('cart', async (ctx) => {
  const chatId = ctx.chat.id;
  const cart = userState[chatId]?.cart || [];
  if (cart.length === 0) {
    await ctx.editMessageText(
      t(chatId, '🛒 Your cart is empty', '🛒 Ваша корзина пуста'),
      mainMenu(chatId)
    );
    return;
  }
  
  let text = t(chatId, '🛒 Your Cart:\n\n', '🛒 Ваша корзина:\n\n');
  let total = 0;
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.id);
    if (p) {
      const itemTotal = p.price * item.qty;
      total += itemTotal;
      text += `${p.name_en} × ${item.qty} = ${itemTotal} THB\n`;
    }
  });
  text += `\n💵 Total: ${total} THB\n\n`;
  
  // Delivery region selection
  const regionButtons = deliveryRegions.map(region => [
    Markup.button.callback(
      `${region.name_en} (${region.price} THB)`,
      `delivery_${region.id}`
    )
  ]);
  regionButtons.push([Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад'), 'back_main')]);
  
  await ctx.editMessageText(
    text + t(chatId, 'Choose delivery region:', 'Выберите регион доставки:'),
    { reply_markup: { inline_keyboard: regionButtons } }
  );
});

// Choose delivery region
deliveryRegions.forEach(region => {
  bot.action(`delivery_${region.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    userState[chatId].deliveryRegion = region;
    const cart = userState[chatId]?.cart || [];
    let total = 0;
    cart.forEach(item => {
      const p = products.find(pr => pr.id === item.id);
      if (p) total += p.price * item.qty;
    });
    const finalTotal = total + region.price;
    
    // Confirm order
    await ctx.editMessageText(
      t(chatId, 
        `✅ Order Summary:\n\n` +
        `📍 Delivery: ${region.name_en} (${region.price} THB)\n` +
        `💵 Subtotal: ${total} THB\n` +
        `💰 Total: ${finalTotal} THB\n\n` +
        `Confirm order?`,
        
        `✅ Итог заказа:\n\n` +
        `📍 Доставка: ${region.name_ru} (${region.price} THB)\n` +
        `💵 Промежуточный итог: ${total} THB\n` +
        `💰 Общая сумма: ${finalTotal} THB\n\n` +
        `Подтвердить заказ?`
      ),
      {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback(t(chatId, '✅ Confirm', '✅ Подтвердить'), 'confirm_order')],
            [Markup.button.callback(t(chatId, '❌ Cancel', '❌ Отмена'), 'back_main')]
          ]
        }
      }
    );
  });
});

// Confirm order
bot.action('confirm_order', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = userState[chatId];
  const cart = state?.cart || [];
  const region = state?.deliveryRegion || deliveryRegions[0];
  
  let orderText = `*🛒 New Order from Parvati weed Thailand*\n\n`;
  let total = 0;
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.id);
    if (p) {
      const itemTotal = p.price * item.qty;
      total += itemTotal;
      orderText += `${p.name_en} × ${item.qty} = ${itemTotal} THB\n`;
    }
  });
  orderText += `\n📍 Delivery: ${region.name_en} (${region.price} THB)\n`;
  orderText += `💵 Subtotal: ${total} THB\n`;
  orderText += `💰 Total: ${total + region.price} THB\n\n`;
  orderText += `👤 User ID: ${chatId}\n`;
  orderText += `🌐 Language: ${state?.lang || 'en'}`;
  
  // Send to admin
  await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' });
  
  // Clear cart
  userState[chatId].cart = [];
  delete userState[chatId].deliveryRegion;
  
  await ctx.editMessageText(
    t(chatId,
      '✅ Order sent! We will contact you via Telegram shortly 📲\n\nThank you for choosing Parvati weed Thailand 🌿',
      '✅ Заказ отправлен! Мы свяжемся с вами в Telegram 📲\n\nСпасибо за выбор Parvati weed Thailand 🌿'
    ),
    mainMenu(chatId)
  );
});

// Navigation back
bot.action('back_main', async (ctx) => {
  const chatId = ctx.chat.id;
  await ctx.editMessageText(
    t(chatId, '🌿 Main menu:', '🌿 Главное меню:'),
    mainMenu(chatId)
  );
});

bot.action('back_cat', async (ctx) => {
  await ctx.trigger('shop');
});

// Launch
if (BOT_TOKEN) {
  bot.launch();
  console.log('🤖 Parvati weed Thailand bot running...');
} else {
  console.log('❌ Set BOT_TOKEN env variable');
}
