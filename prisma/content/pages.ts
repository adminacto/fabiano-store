/**
 * Начальные тексты информационных страниц. Seed кладёт их в StaticPage только если страницы ещё нет —
 * правки администратора не перезаписываются.
 * Формат: "## " — подзаголовок, "- " — пункт списка, пустая строка — новый абзац.
 * ВАЖНО: юридические тексты (privacy, terms) — базовые шаблоны, перед запуском их должен проверить юрист.
 */
type Page = { slug: string; title: string; body: string };
export const STATIC_PAGES: Record<"uz" | "ru" | "en", Page[]> = {
  uz: [
    {
      slug: "about",
      title: "FABIANO haqida",
      body: `FABIANO — oʻz uslubini qadrlaydiganlar uchun yaratilgan zamonaviy kiyim brendi.

Biz har bir buyumni sifatli matolar, aniq bichim va mayda detallarga eʼtibor bilan tanlaymiz. Kiyim — bu shunchaki kiyim emas, balki oʻzingizni ifoda etish usuli.

## Bizning tamoyillarimiz
- Sifatli matolar va puxta tikuv
- Har kuni kiyish mumkin boʻlgan zamonaviy dizayn
- Oʻzbekiston boʻylab qulay yetkazib berish`,
    },
    {
      slug: "contact",
      title: "Aloqa",
      body: `Savollaringiz boʻlsa, biz bilan bogʻlaning — albatta yordam beramiz.

Telefon raqami, elektron pochta va ijtimoiy tarmoqlar sahifaning pastki qismida koʻrsatilgan.

## Ish vaqti
Dushanba — shanba, 10:00 dan 19:00 gacha.`,
    },
    {
      slug: "faq",
      title: "Savol-javob",
      body: `## Buyurtmani qanday rasmiylashtiraman?
Mahsulotni tanlang, oʻlcham va rangni belgilang, savatga qoʻshing va «Rasmiylashtirish» tugmasini bosing.

## Roʻyxatdan oʻtmasdan buyurtma bersa boʻladimi?
Ha, mehmon sifatida buyurtma berishingiz mumkin. Hisob ochsangiz, buyurtmalar tarixini kuzatish osonroq boʻladi.

## Oʻlchamni qanday tanlayman?
Har bir mahsulot sahifasida oʻlchamlar jadvali mavjud.

## Buyurtma qachon yetkaziladi?
Yetkazib berish muddati va narxi rasmiylashtirish sahifasida tanlangan usulga qarab koʻrsatiladi.`,
    },
    {
      slug: "shipping-returns",
      title: "Yetkazib berish va qaytarish",
      body: `## Yetkazib berish
Biz Oʻzbekiston boʻylab yetkazib beramiz. Mavjud usullar, narx va muddat buyurtmani rasmiylashtirishda koʻrsatiladi.

## Qaytarish
Mahsulot kiyilmagan, yorliqlari va qadogʻi saqlangan boʻlsa, uni qaytarish yoki almashtirish mumkin. Qaytarish uchun biz bilan bogʻlaning.`,
    },
    {
      slug: "privacy",
      title: "Maxfiylik siyosati",
      body: `Ushbu siyosat FABIANO onlayn doʻkoni shaxsiy maʼlumotlaringizni qanday toʻplashi va ishlatishini tushuntiradi.

## Qanday maʼlumotlarni toʻplaymiz
- Ism, telefon raqami, elektron pochta va yetkazib berish manzili — buyurtmani bajarish uchun
- Buyurtmalar tarixi — hisobingizda koʻrsatish uchun

## Maʼlumotlardan foydalanish
Maʼlumotlaringiz faqat buyurtmani bajarish, yetkazib berish va siz bilan bogʻlanish uchun ishlatiladi. Biz ularni uchinchi shaxslarga sotmaymiz.

## Bogʻlanish
Maʼlumotlaringizni oʻzgartirish yoki oʻchirish uchun biz bilan bogʻlaning.`,
    },
    {
      slug: "terms",
      title: "Foydalanish shartlari",
      body: `FABIANO saytidan foydalanib, siz quyidagi shartlarga rozilik bildirasiz.

## Buyurtmalar
Buyurtma mahsulot omborda mavjud boʻlganda qabul qilinadi. Narxlar soʻmda koʻrsatilgan.

## Toʻlov
Toʻlov rasmiylashtirish sahifasida koʻrsatilgan usullar orqali amalga oshiriladi.

## Oʻzgarishlar
Biz ushbu shartlarni yangilash huquqini saqlab qolamiz. Amaldagi tahrir doimo shu sahifada eʼlon qilinadi.`,
    },
  ],
  ru: [
    {
      slug: "about",
      title: "О FABIANO",
      body: `FABIANO — современный бренд одежды для тех, кто ценит собственный стиль.

Мы отбираем каждую вещь с вниманием к ткани, крою и деталям. Мода — это больше, чем одежда. Это способ выразить себя.

## Наши принципы
- Качественные ткани и аккуратный пошив
- Современный дизайн на каждый день
- Удобная доставка по всему Узбекистану`,
    },
    {
      slug: "contact",
      title: "Контакты",
      body: `Если у вас есть вопросы — напишите или позвоните нам, мы обязательно поможем.

Телефон, электронная почта и социальные сети указаны внизу страницы.

## Время работы
Понедельник — суббота, с 10:00 до 19:00.`,
    },
    {
      slug: "faq",
      title: "Вопросы и ответы",
      body: `## Как оформить заказ?
Выберите товар, размер и цвет, добавьте в корзину и нажмите «Оформить заказ».

## Можно ли заказать без регистрации?
Да, можно оформить заказ как гость. С аккаунтом удобнее следить за историей заказов.

## Как выбрать размер?
На странице каждого товара есть таблица размеров.

## Когда доставят заказ?
Срок и стоимость доставки показываются при оформлении заказа в зависимости от выбранного способа.`,
    },
    {
      slug: "shipping-returns",
      title: "Доставка и возврат",
      body: `## Доставка
Мы доставляем по всему Узбекистану. Доступные способы, стоимость и сроки показываются при оформлении заказа.

## Возврат
Товар можно вернуть или обменять, если он не был в носке и сохранены бирки и упаковка. Для возврата свяжитесь с нами.`,
    },
    {
      slug: "privacy",
      title: "Политика конфиденциальности",
      body: `Эта политика объясняет, как интернет-магазин FABIANO собирает и использует ваши персональные данные.

## Какие данные мы собираем
- Имя, телефон, электронную почту и адрес доставки — для выполнения заказа
- Историю заказов — чтобы показывать её в вашем аккаунте

## Использование данных
Данные используются только для выполнения и доставки заказа и связи с вами. Мы не продаём их третьим лицам.

## Связь
Чтобы изменить или удалить свои данные, свяжитесь с нами.`,
    },
    {
      slug: "terms",
      title: "Условия использования",
      body: `Пользуясь сайтом FABIANO, вы соглашаетесь со следующими условиями.

## Заказы
Заказ принимается при наличии товара на складе. Цены указаны в сумах.

## Оплата
Оплата производится способами, указанными на странице оформления заказа.

## Изменения
Мы оставляем за собой право обновлять эти условия. Действующая редакция всегда опубликована на этой странице.`,
    },
  ],
  en: [
    {
      slug: "about",
      title: "About FABIANO",
      body: `FABIANO is a modern fashion brand for people who value their own style.

Every piece is chosen with attention to fabric, cut and detail. Fashion is more than clothing. It's how you express yourself.

## What we stand for
- Quality fabrics and careful tailoring
- Modern design for everyday wear
- Convenient delivery across Uzbekistan`,
    },
    {
      slug: "contact",
      title: "Contact",
      body: `If you have any questions, call or message us — we will be glad to help.

Our phone, email and social media are listed at the bottom of the page.

## Opening hours
Monday — Saturday, 10:00 to 19:00.`,
    },
    {
      slug: "faq",
      title: "FAQ",
      body: `## How do I place an order?
Choose a product, select size and colour, add it to your cart and press "Checkout".

## Can I order without an account?
Yes, guest checkout is available. With an account it is easier to track your orders.

## How do I choose my size?
Every product page has a size guide.

## When will my order arrive?
Delivery time and cost are shown at checkout depending on the method you choose.`,
    },
    {
      slug: "shipping-returns",
      title: "Shipping & Returns",
      body: `## Shipping
We deliver across Uzbekistan. Available methods, prices and delivery times are shown at checkout.

## Returns
Items can be returned or exchanged if they have not been worn and still have their tags and packaging. Contact us to arrange a return.`,
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      body: `This policy explains how the FABIANO online store collects and uses your personal data.

## What we collect
- Name, phone, email and delivery address — to fulfil your order
- Order history — to show it in your account

## How we use it
Your data is used only to fulfil and deliver orders and to contact you. We do not sell it to third parties.

## Contact
To change or delete your data, please contact us.`,
    },
    {
      slug: "terms",
      title: "Terms of Service",
      body: `By using the FABIANO website you agree to the following terms.

## Orders
Orders are accepted while items are in stock. Prices are shown in Uzbek sum.

## Payment
Payment is made using the methods shown at checkout.

## Changes
We may update these terms. The current version is always published on this page.`,
    },
  ],
};
