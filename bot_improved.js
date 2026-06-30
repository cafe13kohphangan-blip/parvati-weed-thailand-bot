// Parvati weed Thailand - Improved with visible cart
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');

// Delivery regions
const deliveryRegions = [
  { id: 'bangkok', name_en: 'Bangkok', name_ru: 'Бангкок', price: 100 },
  { id: 'phuket', name_en: 'Phuket', name_ru: 'Пхукет', price: 500 },
  { id: 'samui', name_en: 'Samui', name_ru: 'Самуи', price: 600 },
  { id: 'pangyan', name_en: 'Pangyan', name_ru: 'Пангану', price: 700 },
];

const userState = {};

function t(chatId, en, ru) {
  const lang = userState[chatId]?.lang || 'en';
  return lang === 'ru' ? ru : en;
}

function showCart(chatId, ctx, message = null) {
  const cart = userState[chatId]?.cart || [];
  if (cart.length === 0) {
    const text = t(chatId, '🛒 Your cart is empty', '🛒 Ваша корзина пуста');
    if (message) {
      return ctx.editMessageText(text, mainMenu(chatId));
    } else {
      return ctx.reply(text, mainMenu(chatId));
    }
  }
  
  let text = t(chatId, '🛒 Your Cart:\n\n', '🛒 Ваша корзина:\n\n');
  let total = 0;
  cart.forEach(item => {
    const p = products.find(pr => pr.id === item.id);
    if (p) {
      const itemTotal = p.price * item.qty;
      total += itemTotal;
      text += `${p.name_en} × ${item.qty} = ${itemTotal} THB\n`;
      text += `${p.desc_en}\n\n`;
    }
  });
  text += `💵 Total: ${total} THB\n\n`;
  text += t(chatId, 'Choose delivery region:', 'Выберите регион доставки:');
  
  const regionButtons = deliveryRegions.map(region => [
    Markup.button.callback(`${region.name_en} (${region.price} THB)`, `delivery_${region.id}`)
  ]);
  regionButtons.push([
    Markup.button.callback(t(chatId, '🛍️ Continue Shopping', '🛍️ Продолжить покупки'), 'shop'),
    Markup.button.callback(t(chatId, '🗑️ Clear Cart', '🗑️ Очистить корзину'), 'clear_cart')
  ]);
  
  if (message) {
    return ctx.editMessageText(text, { reply_markup: { inline_keyboard: regionButtons } });
  } else {
    return ctx.reply(text, { reply_markup: { inline_keyboard: regionButtons } });
  }
}

// Main menu
function mainMenu(chatId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.callback(t(chatId, '🛍️ Shop', '🛍️ Магазин'), 'shop')],
        [Markup.button.callback(t(chatId, '🛒 Cart', '🛒 Корзина'), 'cart')],
        [Markup.button.callback(t(chatId, '🌍 Language', '🌍 Язык'), 'change_lang')],
      ]
    }
  };
}

const bot = new Telegraf(BOT_TOKEN);

// Start command
bot.start(async (ctx) => {
  const buttons = [
    [Markup.button.callback('🇬🇧 English', 'lang_en')],
    [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
  ];
  await ctx.reply('🌿 Welcome to Parvati weed Thailand!\nChoose your language / Выберите язык:', {
    reply_markup: { inline_keyboard: buttons }
  });
});

// Language selection
bot.action('lang_en', async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { lang: 'en', cart: [] };
  await ctx.editMessageText('🌿 Welcome to Parvati weed Thailand!', mainMenu(chatId));
});

bot.action('lang_ru', async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { lang: 'ru', cart: [] };
  await ctx.editMessageText('🌿 Добро пожаловать в Parvati weed Thailand!', mainMenu(chatId));
});

// Change language
bot.action('change_lang', async (ctx) => {
  const buttons = [
    [Markup.button.callback('🇬🇧 English', 'lang_en')],
    [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
  ];
  await ctx.editMessageText('Choose your language / Выберите язык:', {
    reply_markup: { inline_keyboard: buttons }
  });
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
      Markup.button.callback(`${p.name_en} - ${p.price} THB`, `add_${p.id}`)
    ]);
    buttons.push([Markup.button.callback(t(chatId, '🔙 Back', '🔙 Назад'), 'shop')]);
    await ctx.editMessageText(
      `${cat.name_en} / ${cat.name_ru}\n${t(chatId, 'Choose product:', 'Выберите товар:')}`,
      { reply_markup: { inline_keyboard: buttons } }
    );
  });
});

// Add to cart - SHOW CART AFTER ADDING
products.forEach(p => {
  bot.action(`add_${p.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    if (!userState[chatId]) userState[chatId] = { lang: 'en', cart: [] };
    const cart = userState[chatId].cart || [];
    const existing = cart.find(i => i.id === p.id);
    if (existing) existing.qty += 1;
    else cart.push({ id: p.id, qty: 1 });
    
    await ctx.answerCbQuery(
      t(chatId, `Added ${p.name_en}`, `Добавлено ${p.name_ru}`)
    );
    
    // SHOW CART VISUALLY
    await showCart(chatId, ctx, true);
  });
});

// Show cart
bot.action('cart', async (ctx) => {
  const chatId = ctx.chat.id;
  await showCart(chatId, ctx, true);
});

// Clear cart
bot.action('clear_cart', async (ctx) => {
  const chatId = ctx.chat.id;
  if (userState[chatId]) userState[chatId].cart = [];
  await ctx.editMessageText(
    t(chatId, '🗑️ Cart cleared!', '🗑️ Корзина очищена!'),
    mainMenu(chatId)
  );
});

// Delivery region selection
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
            [Markup.button.callback(t(chatId, '❌ Cancel', '❌ Отмена'), 'cart')]
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
  
  await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' });
  
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

// Launch
if (BOT_TOKEN) {
  bot.launch();
  console.log('🤖 Parvati weed Thailand bot running (improved cart)...');
} else {
  console.log('❌ Set BOT_TOKEN env variable');
}
