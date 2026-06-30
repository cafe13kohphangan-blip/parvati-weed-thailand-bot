// Run Parvati weed Thailand bot
process.env.BOT_TOKEN = '8284820278:AAGibaELwGgE_lfB0H1yZgUSn32dxqHuXaQ';
process.env.ADMIN_ID = '237228075';

console.log('🚀 Starting Parvati weed Thailand bot...');
console.log('🤖 Token:', process.env.BOT_TOKEN.substring(0, 10) + '...');
console.log('👑 Admin:', process.env.ADMIN_ID);
console.log('📦 Products:', require('./products').products.length, 'items');
console.log('📋 Categories:', require('./products').categories.length);
console.log('');

require('./bot.js');