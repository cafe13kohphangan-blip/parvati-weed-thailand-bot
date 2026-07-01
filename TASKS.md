# 📋 Parvati Weed Thailand — Project Board

**Репозиторий:** [parvati-weed-thailand-bot](https://github.com/cafe13kohphangan-blip/parvati-weed-thailand-bot)
**Бот:** [@Parvati_WeedThiBot](https://t.me/Parvati_WeedThiBot)
**Support:** @dr_Andromeda, @karma_chakra_bot

**Приоритеты:** P1 🔴 Высокий | P2 🟡 Средний | P3 🟢 Низкий
**Статусы:** 🔴 TODO | 🟡 IN PROGRESS | 🟣 REVIEW | ✅ DONE | ⛔ BLOCKED

---

## P1 🔴 — Критично (MVP)

| # | Задача | Статус | Ответственный | Описание |
|---|-------|--------|---------------|----------|
| 1 | 🏗️ **База бота (SQLite + Telegraf)** | ✅ DONE | @karma_chakra_bot | node:sqlite, inline keyboards, 3 слоя оплаты |
| 2 | 📦 **Каталог товаров (15 шт)** | ✅ DONE | @karma_chakra_bot | 5 категорий: шишки, эдиблс, прероллы, кратом, аксессуары |
| 3 | 🖼️ **Фото товаров (6 сортов)** | ✅ DONE | @karma_chakra_bot | OG Kush, Amnesia, Gelato, Northern, Trop Cherry, Double CK |
| 4 | 📏 **Выбор размера при Add** | ✅ DONE | @karmadharma_bot | Кнопки размера при добавлении в корзину |
| 5 | 🚚 **Выбор региона при checkout** | ✅ DONE | @karmadharma_bot | Бангкок/Пхукет/Самуи/Панган + цена доставки |
| 6 | 💳 **PromptPay QR генерация** | 🟡 TODO | @karmadharma_bot | Статический QR или API для генерации |

## P2 🟡 — Важно

| # | Задача | Статус | Ответственный | Описание |
|---|-------|--------|---------------|----------|
| 7 | 🌐 **Английская версия** | ✅ DONE | @karma_chakra_bot | Все разделы EN+RU |
| 8 | ❓ **FAQ раздел** | ✅ DONE | @karma_chakra_bot | 6 вопросов с ответами |
| 9 | ℹ️ **"О нас" раздел** | ✅ DONE | @karma_chakra_bot | Описание сервиса |
| 10 | 📖 **"Как заказать"** | ✅ DONE | @karma_chakra_bot | Пошаговая инструкция |
| 11 | 🖼️ **Картинки в карточках** | ✅ DONE | @karma_chakra_bot | Все 6 flower strains |
| 12 | ⭐ **Отзывы / Testimonials** | ✅ DONE | @karma_chakra_bot | Рейтинг 1-5 + текст, после заказа |
| 13 | 📋 **История заказов** | ✅ DONE | @karmadharma_bot | `/myorders` команда |
| 14 | 📊 **Админ-панель** | ✅ DONE | @karmadharma_bot | `/stats`, `/orders` с инфо о промо/отзывах |

## P3 🟢 — Опционально (Roadmap)

| # | Задача | Статус | Ответственный | Описание |
|---|-------|--------|---------------|----------|
| 15 | 🏷️ **Промокоды** | ✅ DONE | @karmadharma_bot | Система скидок: WELCOME10, PARVATI20, CAFE13, FREESHIP, VIP5A |
| 16 | 🔔 **Уведомления о статусе** | 🟡 TODO | @karmadharma_bot | Статус заказа в реальном времени |
| 17 | 🌍 **Тайский язык (TH)** | ✅ DONE | @karmadharma_bot | Локализация RU/EN/TH всех разделов |
| 18 | 🤖 **AI-рекомендации** | 🟢 TODO | @karma_chakra_bot | Подбор сортов по эффектам |
| 19 | 📱 **Web-админка** | 🟢 TODO | @karmadharma_bot | React/Next.js панель управления |
| 20 | 🔗 **Интеграция с NOWPayments** | 🟢 TODO | @karmadharma_bot | Автоматические крипто-платежи |
| 21 | 📸 **Парсинг Choo Choo Hemp** | 🟢 TODO | @karma_chakra_bot | wishlist.choochoohemp.com/strains |
| 22 | 🧹 **Выбор размера/региона** | ✅ DONE | @karmadharma_bot | В корзине указывать размер и регион |

---

## 📊 Прогресс по спринтам

### Спринт 1 (Завершён 🏁)
- ✅ База бота
- ✅ Каталог 15 товаров
- ✅ Карточки с грейдами/эффектами/THC
- ✅ Корзина + 3 способа оплаты
- ✅ FAQ + Support + About + How to Order
- ✅ 6 фото сортов
- ✅ GitHub репозиторий

### Спринт 2 (Завершён 🏁)
- ✅ 🖼️ Приветственный экран с премиум-изображением + age check
- ✅ 🌍 Выбор языка на старте (RU/EN/TH)
- ✅ 📝 Улучшенные описания товаров (премиум)
- ✅ ℹ️ Доработанные страницы: About, FAQ, Delivery, How To, Support
- ✅ 📏 Выбор размера при Add
- ✅ 🚚 Выбор региона при checkout
- ✅ ⭐ Отзывы после заказа (1-5 + текст)
- ✅ 📋 История заказов /myorders
- ✅ 📊 Админ панель /stats /orders

### Спринт 3 (Текущий 🏃)
- ✅ 🏷️ Промокоды: WELCOME10, PARVATI20, CAFE13, FREESHIP, VIP5A
- ✅ 🌍 Тайский язык (TH) — все разделы
- [ ] 🔔 Уведомления о статусе заказа
- [ ] 🔗 Интеграция с NOWPayments
- [ ] 📱 Web-админка

---

**Последнее обновление:** 2026-07-01
**Текущая версия:** v2.7
**Обновлять:** @karma_chakra_bot после каждого крупного изменения