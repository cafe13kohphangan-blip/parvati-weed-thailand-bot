// Parvati Weed Thailand - Premium Delivery Bot v2.0
const { Telegraf, Markup } = require('telegraf');
const { categories, products } = require('./products_premium');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = Number(process.env.ADMIN_ID || '237228075');

// ========== CONFIG ==========
const DELIVERY_REGIONS = [
  { id: 'bangkok', name_en: '🚕 Bangkok',     name_ru: '🚕 Бангкок',       price: 100,  time_en: '2-4h',  time_ru: '2-4ч' },
  { id: 'phuket',  name_en: '🚕 Phuket',      name_ru: '🚕 Пхукет',        price: 500,  time_en: '1-2d',  time_ru: '1-2д' },
  { id: 'samui',   name_en: '🚕 Koh Samui',   name_ru: '🚕 Самуи',         price: 600,  time_en: '1-2d',  time_ru: '1-2д' },
  { id: 'pangan',  name_en: '🚕 Koh Phangan', name_ru: '🚕 Панган',         price: 700,  time_en: '1-2d',  time_ru: '1-2д' },
];

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
// userState[chatId] = {
//   lang: 'en'|'ru',
//   cart: [{ productId, qty, size, price }],
//   deliveryRegion: null,
//   paymentMethod: null,
// }
const userState = {};

function t(chatId, en, ru) {
  const lang = userState[chatId]?.lang || 'en';
  return lang === 'ru' ? ru : en;
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function formatPrice(price) {
  return `${price.toLocaleString()} THB`;
}

// Generate PromptPay QR payload (simple Thai QR)
function generatePromptPayQR(amount, refId) {
  // Standard Thai PromptPay payload format
  // 00 01 = merchant present
  // 29 16 = merchant account (target mobile)
  // Just return a placeholder — actual QR would need PromptPay API
  const promptpayId = '0900100000'; // Replace with your PromptPay ID
  return {
    promptpayId,
    amount,
    refId,
    qrRaw: `00020101021129370016A000000677010111${promptpayId}53037645802TH${amount.toFixed(2).padStart(6, '0')}6304`,
    note: `Order #${refId}`
  };
}

function getGradeEmoji(grade) {
  const map = {
    '5A+': '💎',
    '5A': '⭐',
    '4A': '🌟',
    '3A': '✨',
    'A': '✅',
  };
  return map[grade] || '';
}

function buildProductCard(p, lang, sizes = null) {
  const isEn = lang === 'en';
  const name = isEn ? p.name_en : p.name_ru;
  const effects = isEn ? p.effects_en : p.effects_ru;
  const desc = isEn ? p.desc_en : p.desc_ru;

  let caption = `*${name}*\n`;
  if (p.grade) caption += `${getGradeEmoji(p.grade)} Grade: ${p.grade} | ${p.type}\n`;
  if (p.thc) caption += `⚡ THC: ${p.thc}\n\n`;

  if (effects.length > 0) {
    caption += `🔥 *${isEn ? 'Effects' : 'Эффекты'}:* `;
    caption += effects.map(e => `#${e}`).join(' · ');
    caption += '\n\n';
  }

  caption += `💎 *${isEn ? 'Prices' : 'Цены'}:*\n`;
  const priceKeys = sizes || Object.keys(p.prices);
  priceKeys.forEach(size => {
    if (p.prices[size]) {
      caption += `▫️ ${size} — ${formatPrice(p.prices[size])}\n`;
    }
  });

  caption += `\n📝 ${desc}`;

  return caption;
}

function buildCartText(chatId) {
  const state = userState[chatId];
  if (!state || !state.cart || state.cart.length === 0) return null;

  const isEn = state.lang === 'en';
  let text = isEn ? '🛒 *Your Cart:*\n\n' : '🛒 *Ваша корзина:*\n\n';
  let total = 0;

  state.cart.forEach((item, i) => {
    const p = products.find(pr => pr.id === item.productId);
    if (!p) return;
    const itemName = isEn ? p.name_en : p.name_ru;
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    text += `${i + 1}. ${itemName} (${item.size}) × ${item.qty} = ${formatPrice(itemTotal)}\n`;
  });

  text += `\n💵 ${isEn ? 'Subtotal' : 'Подытог'}: ${formatPrice(total)}`;

  if (state.deliveryRegion) {
    text += `\n🚚 ${isEn ? 'Delivery' : 'Доставка'}: ${formatPrice(state.deliveryRegion.price)}`;
    text += `\n💰 *${isEn ? 'Total' : 'Итого'}: ${formatPrice(total + state.deliveryRegion.price)}*`;
  }

  return { text, total };
}

// ══════════════════════════════════════════
// KEYBOARDS
// ══════════════════════════════════════════

function mainMenuKeyboard(chatId) {
  const isEn = userState[chatId]?.lang !== 'ru';
  return Markup.inlineKeyboard([
    [Markup.button.callback(isEn ? '🛍️ Shop' : '🛍️ Магазин', 'shop')],
    [Markup.button.callback(isEn ? '🛒 Cart' : '🛒 Корзина', 'cart')],
    [Markup.button.callback(isEn ? '🌍 Language: EN' : '🌍 Язык: RU', 'change_lang')],
  ]);
}

function categoryKeyboard(chatId) {
  const isEn = userState[chatId]?.lang !== 'ru';
  const buts = categories.map(cat => [
    Markup.button.callback(isEn ? cat.name_en : cat.name_ru, `cat_${cat.id}`)
  ]);
  buts.push([Markup.button.callback(isEn ? '🔙 Main Menu' : '🔙 Главное меню', 'back_main')]);
  return Markup.inlineKeyboard(buts);
}

function productSizeKeyboard(p, chatId) {
  const isEn = userState[chatId]?.lang !== 'ru';
  const sizes = Object.keys(p.prices);
  const buts = sizes.map(size => [
    Markup.button.callback(
      `${size} — ${formatPrice(p.prices[size])}`,
      `add_${p.id}_${size}`
    )
  ]);
  buts.push([
    Markup.button.callback(isEn ? '🔙 Back' : '🔙 Назад', `cat_${p.cat}`),
    Markup.button.callback(isEn ? '🛒 Cart' : '🛒 Корзина', 'cart'),
  ]);
  return Markup.inlineKeyboard(buts);
}

function deliveryKeyboard(chatId) {
  const isEn = userState[chatId]?.lang !== 'ru';
  const buts = DELIVERY_REGIONS.map(r => [
    Markup.button.callback(
      isEn ? `${r.name_en} (${formatPrice(r.price)}, ${r.time_en})` :
             `${r.name_ru} (${formatPrice(r.price)}, ${r.time_ru})`,
      `delivery_${r.id}`
    )
  ]);
  buts.push([Markup.button.callback(isEn ? '🔙 Back' : '🔙 Назад', 'cart')]);
  return Markup.inlineKeyboard(buts);
}

function paymentKeyboard(chatId) {
  const isEn = userState[chatId]?.lang !== 'ru';
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇹🇭 PromptPay QR', 'pay_qr')],
    [Markup.button.callback('💵 Cash to Courier', 'pay_cash')],
    [Markup.button.callback('₿ Crypto (USDT/BTC)', 'pay_crypto')],
    [Markup.button.callback(isEn ? '🔙 Back' : '🔙 Назад', 'checkout')],
  ]);
}

function cartKeyboard(chatId) {
  const state = userState[chatId];
  const isEn = state?.lang !== 'ru';

  if (!state?.cart?.length) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(isEn ? '🛍️ Start Shopping' : '🛍️ Начать покупки', 'shop')],
      [Markup.button.callback(isEn ? '🔙 Main Menu' : '🔙 Главное меню', 'back_main')],
    ]);
  }

  const buts = [];
  // Add +/- buttons for each cart item
  state.cart.forEach((item, i) => {
    buts.push([
      Markup.button.callback('➖', `cart_dec_${i}`),
      Markup.button.callback(`${item.qty}`, `cart_item_${i}`),
      Markup.button.callback('➕', `cart_inc_${i}`),
      Markup.button.callback('🗑️', `cart_del_${i}`),
    ]);
  });

  buts.push([Markup.button.callback(isEn ? '📍 Choose Delivery' : '📍 Выбрать доставку', 'checkout')]);
  buts.push([
    Markup.button.callback(isEn ? '🗑️ Clear Cart' : '🗑️ Очистить корзину', 'clear_cart'),
    Markup.button.callback(isEn ? '🛍️ Continue' : '🛍️ Продолжить', 'shop'),
  ]);
  buts.push([Markup.button.callback(isEn ? '🔙 Main Menu' : '🔙 Главное меню', 'back_main')]);

  return Markup.inlineKeyboard(buts);
}

// ══════════════════════════════════════════
// BOT
// ══════════════════════════════════════════

const bot = new Telegraf(BOT_TOKEN);

// ---- START / LANGUAGE ----
bot.start(async (ctx) => {
  await ctx.reply(
    '🌿 *Welcome to Parvati Weed Thailand!*\nChoose your language:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
    ])
  );
});

bot.action('lang_en', async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { lang: 'en', cart: [], deliveryRegion: null, paymentMethod: null };
  await ctx.editMessageText('🌿 *Welcome!* What would you like to do?', {
    parse_mode: 'Markdown',
    ...mainMenuKeyboard(chatId).reply_markup ? { reply_markup: mainMenuKeyboard(chatId).reply_markup } : {},
  });
});

bot.action('lang_ru', async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { lang: 'ru', cart: [], deliveryRegion: null, paymentMethod: null };
  await ctx.editMessageText('🌿 *Добро пожаловать!* Чем могу помочь?', {
    parse_mode: 'Markdown',
    ...mainMenuKeyboard(chatId).reply_markup ? { reply_markup: mainMenuKeyboard(chatId).reply_markup } : {},
  });
});

bot.action('change_lang', async (ctx) => {
  const chatId = ctx.chat.id;
  const currentLang = userState[chatId]?.lang || 'en';
  if (currentLang === 'en') {
    userState[chatId] = { ...userState[chatId], lang: 'ru' };
    await ctx.editMessageText('🌿 *Добро пожаловать!* Чем могу помочь?', {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(chatId).reply_markup ? { reply_markup: mainMenuKeyboard(chatId).reply_markup } : {},
    });
  } else {
    userState[chatId] = { ...userState[chatId], lang: 'en' };
    await ctx.editMessageText('🌿 *Welcome!* What would you like to do?', {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(chatId).reply_markup ? { reply_markup: mainMenuKeyboard(chatId).reply_markup } : {},
    });
  }
});

// ---- NAVIGATION ----
bot.action('back_main', async (ctx) => {
  const chatId = ctx.chat.id;
  const isEn = userState[chatId]?.lang !== 'ru';
  await ctx.editMessageText(
    isEn ? '🌿 *Main Menu*' : '🌿 *Главное меню*',
    { parse_mode: 'Markdown', ...mainMenuKeyboard(chatId).reply_markup }
  );
});

// ---- SHOP - CATEGORIES ----
bot.action('shop', async (ctx) => {
  const chatId = ctx.chat.id;
  const isEn = userState[chatId]?.lang !== 'ru';
  await ctx.editMessageText(
    isEn ? '📂 *Choose category:*' : '📂 *Выберите категорию:*',
    { parse_mode: 'Markdown', ...categoryKeyboard(chatId).reply_markup }
  );
});

// ---- CATEGORY PRODUCTS ----
categories.forEach(cat => {
  bot.action(`cat_${cat.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const isEn = userState[chatId]?.lang !== 'ru';
    const catProducts = products.filter(p => p.cat === cat.id);

    if (catProducts.length === 0) {
      await ctx.editMessageText(
        isEn ? '😕 No products in this category' : '😕 Нет товаров в этой категории',
        { reply_markup: categoryKeyboard(chatId).reply_markup }
      );
      return;
    }

    const catName = isEn ? cat.name_en : cat.name_ru;
    let text = `${catName}\n`;

    catProducts.forEach((p, i) => {
      const pName = isEn ? p.name_en : p.name_ru;
      text += `\n${i + 1}. ${getGradeEmoji(p.grade)} *${pName}*`;
      if (p.grade) text += ` \\[${p.grade}\\]`;
      const minPrice = Math.min(...Object.values(p.prices));
      text += ` — ${isEn ? 'from' : 'от'} ${formatPrice(minPrice)}`;
    });

    const buts = catProducts.map(p => [
      Markup.button.callback(
        `${isEn ? p.name_en : p.name_ru} — ${formatPrice(Math.min(...Object.values(p.prices)))}`,
        `view_${p.id}`
      )
    ]);
    buts.push([
      Markup.button.callback(isEn ? '🔙 Back to Categories' : '🔙 Назад к категориям', 'shop'),
      Markup.button.callback(isEn ? '🛒 Cart' : '🛒 Корзина', 'cart'),
    ]);

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buts }
    });
  });
});

// ---- VIEW PRODUCT CARD ----
products.forEach(p => {
  bot.action(`view_${p.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    const isEn = userState[chatId]?.lang !== 'ru';
    const caption = buildProductCard(p, userState[chatId]?.lang || 'en');

    if (p.image) {
      try {
        await ctx.replyWithPhoto(
          { source: p.image },
          {
            caption,
            parse_mode: 'Markdown',
            ...productSizeKeyboard(p, chatId).reply_markup
          }
        );
        return;
      } catch (e) {
        // fallback to text if image fails
      }
    }

    // Text-only card
    await ctx.editMessageText(caption, {
      parse_mode: 'Markdown',
      ...productSizeKeyboard(p, chatId).reply_markup
    });
  });
});

// ---- ADD TO CART ----
products.forEach(p => {
  const sizes = Object.keys(p.prices);
  sizes.forEach(size => {
    bot.action(`add_${p.id}_${size}`, async (ctx) => {
      const chatId = ctx.chat.id;
      if (!userState[chatId]) userState[chatId] = { lang: 'en', cart: [], deliveryRegion: null };
      if (!userState[chatId].cart) userState[chatId].cart = [];

      const price = p.prices[size];
      const existing = userState[chatId].cart.find(
        item => item.productId === p.id && item.size === size
      );

      if (existing) {
        existing.qty += 1;
      } else {
        userState[chatId].cart.push({
          productId: p.id,
          size,
          price,
          qty: 1,
        });
      }

      const isEn = userState[chatId]?.lang !== 'ru';
      const pName = isEn ? p.name_en : p.name_ru;
      await ctx.answerCbQuery(
        isEn ? `✅ Added ${pName} (${size})` : `✅ Добавлено ${pName} (${size})`
      );

      // Show cart after adding
      await showCart(chatId, ctx, true);
    });
  });
});

// ---- CART ----
bot.action('cart', async (ctx) => {
  const chatId = ctx.chat.id;
  await showCart(chatId, ctx, true);
});

async function showCart(chatId, ctx, editMode = false) {
  const state = userState[chatId];
  const isEn = state?.lang !== 'ru';
  const cartData = buildCartText(chatId);

  if (!cartData) {
    const msg = isEn ? '🛒 *Your cart is empty*' : '🛒 *Ваша корзина пуста*';
    if (editMode) {
      await ctx.editMessageText(msg, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(isEn ? '🛍️ Start Shopping' : '🛍️ Начать покупки', 'shop')],
          [Markup.button.callback(isEn ? '🔙 Main Menu' : '🔙 Главное меню', 'back_main')],
        ]).reply_markup
      });
    } else {
      await ctx.reply(msg, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(isEn ? '🛍️ Start Shopping' : '🛍️ Начать покупки', 'shop')],
          [Markup.button.callback(isEn ? '🔙 Main Menu' : '🔙 Главное меню', 'back_main')],
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

// ---- CART CONTROLS ----
bot.action(/^cart_inc_(\d+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const idx = parseInt(ctx.match[1]);
  if (userState[chatId]?.cart?.[idx]) {
    userState[chatId].cart[idx].qty += 1;
  }
  await showCart(chatId, ctx, true);
});

bot.action(/^cart_dec_(\d+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const idx = parseInt(ctx.match[1]);
  if (userState[chatId]?.cart?.[idx]) {
    userState[chatId].cart[idx].qty = Math.max(1, userState[chatId].cart[idx].qty - 1);
  }
  await showCart(chatId, ctx, true);
});

bot.action(/^cart_del_(\d+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const idx = parseInt(ctx.match[1]);
  if (userState[chatId]?.cart) {
    userState[chatId].cart.splice(idx, 1);
  }
  await showCart(chatId, ctx, true);
});

// ---- CLEAR CART ----
bot.action('clear_cart', async (ctx) => {
  const chatId = ctx.chat.id;
  if (userState[chatId]) {
    userState[chatId].cart = [];
    userState[chatId].deliveryRegion = null;
  }
  await showCart(chatId, ctx, true);
});

// ---- CHECKOUT / DELIVERY ----
bot.action('checkout', async (ctx) => {
  const chatId = ctx.chat.id;
  const isEn = userState[chatId]?.lang !== 'ru';
  const cartData = buildCartText(chatId);

  if (!cartData) {
    await showCart(chatId, ctx, true);
    return;
  }

  let text = cartData.text;
  text += `\n\n📍 *${isEn ? 'Choose delivery region:' : 'Выберите регион доставки:'}*`;

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: deliveryKeyboard(chatId).reply_markup
  });
});

// ---- DELIVERY REGION SELECTION ----
DELIVERY_REGIONS.forEach(region => {
  bot.action(`delivery_${region.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    userState[chatId].deliveryRegion = region;

    const isEn = userState[chatId]?.lang !== 'ru';
    const cartData = buildCartText(chatId);
    const total = cartData.total + (region ? region.price : 0);

    let text = isEn ? '✅ *Order Summary*\n\n' : '✅ *Итог заказа*\n\n';
    text += cartData.text;
    if (region) {
      text += `\n🚚 ${isEn ? 'Delivery' : 'Доставка'}: ${region.name_en} (${formatPrice(region.price)}, ${isEn ? region.time_en : region.time_ru})`;
    }
    text += `\n\n💰 *${isEn ? 'Total' : 'Итого'}: ${formatPrice(total)}*`;
    text += `\n\n💳 *${isEn ? 'Choose payment:' : 'Выберите оплату:'}*`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentKeyboard(chatId).reply_markup
    });
  });
});

// ---- PAYMENT SELECTION ----
bot.action('pay_cash', async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId].paymentMethod = 'cash';
  await finalizeOrder(ctx, chatId);
});

bot.action('pay_crypto', async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId].paymentMethod = 'crypto';
  await finalizeOrder(ctx, chatId);
});

bot.action('pay_qr', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = userState[chatId];
  const isEn = state?.lang !== 'ru';
  const cartData = buildCartText(chatId);
  const total = cartData.total + (state.deliveryRegion?.price || 0);
  const refId = Date.now().toString(36).toUpperCase();

  const qrData = generatePromptPayQR(total, refId);

  const text = isEn
    ? `🇹🇭 *PromptPay QR Payment*\n\n` +
      `Amount: ${formatPrice(total)}\n` +
      `Ref: ${refId}\n\n` +
      `Scan the QR code below with your banking app:\n\n` +
      `📱 PromptPay ID: ${qrData.promptpayId}\n\n` +
      `After payment, send a screenshot here to confirm.`
    : `🇹🇭 *Оплата через PromptPay QR*\n\n` +
      `Сумма: ${formatPrice(total)}\n` +
      `Реф: ${refId}\n\n` +
      `Сканируйте QR-код ниже через банковское приложение:\n\n` +
      `📱 PromptPay ID: ${qrData.promptpayId}\n\n` +
      `После оплаты отправьте скриншот сюда для подтверждения.`;

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback(isEn ? '✅ I Paid' : '✅ Я Оплатил', `confirm_paid_${refId}`)],
      [Markup.button.callback(isEn ? '❌ Cancel' : '❌ Отмена', 'back_main')],
    ]).reply_markup
  });
});

bot.action(/^confirm_paid_(.+)$/, async (ctx) => {
  const chatId = ctx.chat.id;
  const refId = ctx.match[1];
  userState[chatId].paymentMethod = 'promptpay';
  userState[chatId].paymentRef = refId;
  await finalizeOrder(ctx, chatId);
});

// ---- FINALIZE ORDER ----
async function finalizeOrder(ctx, chatId) {
  const state = userState[chatId];
  const isEn = state?.lang !== 'ru';
  const cartData = buildCartText(chatId);
  const region = state.deliveryRegion || DELIVERY_REGIONS[0];
  const total = cartData.total + (region ? region.price : 0);

  // Build admin notification
  let orderText = `🛒 *New Order — Parvati Weed Thailand*\n\n`;
  orderText += `👤 *User:* [${chatId}](tg://user?id=${chatId})\n`;
  orderText += `🌐 *Lang:* ${state.lang === 'ru' ? 'Russian' : 'English'}\n`;
  orderText += `💳 *Payment:* ${state.paymentMethod || 'not set'}\n`;
  if (state.paymentRef) orderText += `📋 *Ref:* ${state.paymentRef}\n\n`;
  orderText += `━━━━━━━━━━━━━━━━\n\n`;

  state.cart.forEach(item => {
    const p = products.find(pr => pr.id === item.productId);
    if (p) {
      orderText += `${p.name_en} × ${item.qty} (${item.size}) = ${formatPrice(item.price * item.qty)}\n`;
    }
  });

  orderText += `\n🚚 *Delivery:* ${region.name_en} (${formatPrice(region.price)})`;
  orderText += `\n💰 *Total:* ${formatPrice(total)}`;
  orderText += `\n⏱ *Delivery time:* ${isEn ? region.time_en : region.time_ru}`;

  // Send to admin
  try {
    await ctx.telegram.sendMessage(ADMIN_ID, orderText, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('Failed to notify admin:', e.message);
  }

  // Confirmation to user
  let confirmText = isEn
    ? `✅ *Order confirmed!*\n\nYour order #${chatId.toString().slice(-4)} has been sent.\n\n📲 We will contact you within 15 minutes.\n\nThank you for choosing Parvati Weed Thailand! 🌿`
    : `✅ *Заказ подтверждён!*\n\nВаш заказ #${chatId.toString().slice(-4)} отправлен.\n\n📲 Мы свяжемся с вами в течение 15 минут.\n\nСпасибо за выбор Parvati Weed Thailand! 🌿`;

  // Clear cart after order
  state.cart = [];
  state.deliveryRegion = null;
  state.paymentMethod = null;
  state.paymentRef = null;

  await ctx.editMessageText(confirmText, {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(chatId).reply_markup
  });
}

// ---- FALLBACK ----
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!userState[chatId]) {
    return ctx.reply(
      '🌿 Welcome! Use /start to begin.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Start', 'lang_en')],
        [Markup.button.callback('🚀 Начать', 'lang_ru')],
      ])
    );
  }
  await ctx.reply(
    userState[chatId]?.lang !== 'ru'
      ? 'Use the buttons below 👇'
      : 'Используйте кнопки ниже 👇',
    { reply_markup: mainMenuKeyboard(chatId).reply_markup }
  );
});

// ---- LAUNCH ----
if (!BOT_TOKEN) {
  console.error('❌ Set BOT_TOKEN environment variable');
  process.exit(1);
}

bot.launch();
console.log('🌿 Parvati Weed Thailand Premium Bot v2.0 running...');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));