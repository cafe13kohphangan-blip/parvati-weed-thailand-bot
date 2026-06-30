# 🍁 Parvati Weed Thailand Delivery Bot

[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-2CA5E0)](https://t.me/Parvati_WeedThiBot)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933)](https://nodejs.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.0+-00B0FF)](https://telegrafjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Premium cannabis delivery Telegram bot for Thailand with multiple product categories, cart system, and delivery management.

## ✨ Features

- **🛍️ Multi-category Shop** - Kratom, Flower strains, Edibles, Pre-rolls, Accessories
- **🛒 Shopping Cart** - Add/remove items, calculate total
- **💳 Order Management** - Collect customer info, process orders
- **🌍 Multi-language** - English/Russian interface
- **📍 Delivery Info** - Bangkok/Pattaya delivery details
- **📊 Admin Notifications** - Real-time order alerts
- **🚀 Fast & Simple** - Minimalistic interface for quick ordering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/DrAndromeda/parvati-weed-thailand-bot.git
cd parvati-weed-thailand-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your BOT_TOKEN and ADMIN_ID

# Start bot
npm start
```

### Environment Variables
```bash
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_ID=your_telegram_user_id_here
```

## 📁 Project Structure

```
parvati-weed-thailand-bot/
├── bot_simple.js          # Main bot logic (Telegraf)
├── products.js            # Product catalog & categories
├── package.json           # Dependencies
├── .env.example           # Environment template
├── README.md              # This file
├── LICENSE                # MIT License
└── launch.sh              # Launch script (optional)
```

## 🛠️ Development

### Start Development
```bash
npm start
```

### File Descriptions
- **bot_simple.js** - Main bot handler with Telegraf
- **products.js** - Product database with categories
- **launch.sh** - Production launch script with environment variables

## 📦 Product Categories

1. **🍃 Kratom Collection** - Powder, capsules, tea, extracts
2. **🌿 Flower Strains** - OG Kush, Amnesia Haze, Northern Lights, Gelato
3. **🍪 Edibles** - Gummy bears, brownies, cookies
4. **🚬 Pre-rolls** - Ready-to-smoke joints
5. **🔧 Accessories** - Rolling papers, grinders, pipes

## 🤝 Contributing

This is an **OpenClaw Collaborative Project** - for joint development with other teams.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

### Areas for Improvement
- **Payment Integration** - Crypto/fiat payment gateways
- **Delivery Tracking** - Real-time order tracking
- **UI/UX** - Better conversation flows
- **Localization** - Add Thai language
- **Admin Panel** - Web-based order management
- **Analytics** - Sales reports, customer insights

## 👥 Collaborative Development

### 📋 Task Management
We use **TASKS.md** file for organizing work and avoiding duplication:
- [View Task Board](TASKS.md) - Все задачи, статусы и ответственные
- Статусы: TODO, IN PROGRESS, REVIEW, DONE, BLOCKED
- Приоритеты: P1 (высокий), P2 (средний), P3 (низкий)
- Ответственные: @dev1, @dev2, @dev3, @dev4

### 🔄 Workflow
1. **Выберите задачу** из TASKS.md
2. **Обновите статус** на IN PROGRESS
3. **Создайте ветку** от main: `git checkout -b feature/task-id`
4. **Работайте над задачей**, делайте коммиты
5. **Создайте Pull Request**, обновите статус на REVIEW
6. **После аппрува** - мержите, обновите статус на DONE

### 📅 Еженедельные встречи
- **Когда**: Каждую пятницу, |6:00 UTC+7|
- **Где**: Telegram группа разработчиков
- **Цель**: Обзор прогресса, планирование, решение проблем

## 📞 Contact & Support

- **Live Bot**: [@Parvati_WeedThiBot](https://t.me/Parvati_WeedThiBot)
- **GitHub Issues**: [Report bugs or request features](https://github.com/DrAndromeda/parvati-weed-thailand-bot/issues)
- **Collaboration**: For team-based improvements

## ⚠️ Disclaimer

This software is for **educational purposes only**. Check local laws regarding cannabis in your jurisdiction. The creators are not responsible for any illegal use.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Built with [Telegraf.js](https://telegrafjs.org/) - Telegram Bot Framework
- Collaborative development via **OpenClaw Agent Network**
- Real-world deployment tested in Thailand

---

**🚀 Live Production Bot | 🇹🇭 Thailand Delivery | 💎 Premium Cannabis Products**