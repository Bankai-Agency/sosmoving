# Каталог анимаций сайта - ТЗ для миграции на новый стэк

Дата среза: 29.08.2026. Источник: `ixData` движка Webflow IX2, выгружен из живого
рантайма (`window.Webflow.require('ix2').store.getState().ixData`); во всех трёх
вебфлоу-бандлах сайта данные побайтно идентичны.

Файлы рядом:
- `ix2-catalog.json` - обработанный каталог: события с разрешёнными целями
  (селектор/элемент/страница), статусом active/dead и привязкой к страницам;
  action-листы со степами (durations, easings, значения).
- `ix2-raw.json` - сырой ixData как есть (источник истины при спорах).

Перегенерация: дампнуть ixData с любой страницы и прогнать скрипт сборки
(снимал через playwright: открыть страницу, дождаться загрузки скриптов,
забрать store.getState().ixData; затем кросс-референс по `public/pages/*.html`
и `src/data/shared/*.html`).

## Итог в цифрах

- 75 событий в экспорте, из них **46 живых** и **29 мёртвых** (цель-элемент
  или цель-страница отсутствует в актуальной вёрстке - наследие редизайнов
  в Webflow; на живом сайте они тоже ничего не делают. Мигрировать не надо).
- 46 живых событий схлопываются в **17 action-листов**, то есть **11 логических анимаций** (пары hover-in/out и open/close считаю одной).
- Все анимации активны на всех брейкпоинтах (mediaQueries: main/medium/small/tiny),
  кроме отмеченных отдельно.

## 11 живых анимаций (17 action-листов)

| # | actionList | Название | Где | Миграция |
|---|-----------|----------|-----|----------|
| 1 | a-6 / a-7 | Open/Close Nav DD | навбар (все страницы) | Navbar-компонент, motion |
| 2 | a-8 / a-9 | Open/Close Nav Inner DD | навбар | Navbar-компонент, motion |
| 3 | a-12 / a-13 | Navbar Open/Close (моб. меню + Lottie бургер) | навбар | Navbar-компонент, motion + lottie |
| 4 | a-2 / a-3 | Services Item Hover | карточки услуг, ~564 стр. | чистый CSS |
| 5 | a-29 / a-30 | Yellow-button hover | жёлтые кнопки, ~129 стр. | чистый CSS |
| 6 | a-32 / a-33 | Fake-video hover | видео-карточки, ~134 стр. | чистый CSS |
| 7 | a-31 | Modal open | модалка формы, ~129 стр. | motion AnimatePresence |
| 8 | a-34 | multistepFormAnim | hero-форма квоты, ~135 стр. | React state + motion |
| 9 | a-35 | CtaMultistepFormAnim | CTA-форма, ~559 стр. | React state + motion |
| 10 | a-16 | About C Animation (ленты фото, луп) | 6 стр.: /, about-us, meet-our-team, careers, local-moving, long-distance (+shared-load) | CSS keyframes или motion loop |
| 11 | a | About C / Scroll Animation (scrub) | фото-колонки, ~120 городских и about-страниц | motion useScroll + useTransform |

## Спеки по группам

### 1-3. Навбар (единственный компонент со сложными интеракциями)

- **Open Nav DD** (a-6): на дропдауне открывается `.navbar-dd-list` -
  scale 0.8→1 + opacity 0→1, 500ms ease. Close (a-7) - зеркально.
- **Open Nav Inner DD** (a-8, hover): у элемента display none→block,
  затем scale 0.8→1 + opacity 0→1, 500ms ease. Close (a-9): scale/opacity
  вниз 500ms, потом display none.
- **Navbar Open** (a-12, моб. меню): `.navbar-menu` opacity 0→1 300ms ease,
  параллельно Lottie бургера играет кадры 0→43 за 500ms. Close (a-13):
  opacity→0 300ms, Lottie обратно к 0.
  Lottie-файл: `/images/general/645ab1d9792287c1ad5bf042_hamburger-yellow.json`
  (элемент `.navbar-lottie`, renderer svg, duration 1.62s). В новом стэке -
  lottie-react/dotlottie, либо заменить на CSS-бургер из трёх полосок.

### 4-6. Ховеры (мигрируются в чистый CSS, motion не нужен)

- **Services Item Hover** (a-2/a-3): внутри карточки `.services-item-image`
  opacity 1→0 (hover) и обратно, `.services-item-arrow` scale 0.8↔1,
  `.services-icon` scale 1↔0.8 + opacity 1↔0. In 500ms linear
  (init-стейт из первой группы), out 300ms ease.
- **Yellow-button hover** (a-29/a-30): фон rgb(250,236,31)→rgb(229,217,5),
  текст rgb(21,20,20)→белый, 300ms easeInOut; плюс переключение
  `display` у `.path.yellow` (иконка). Обратно зеркально.
- **Fake-video hover** (a-32/a-33): `.fake-video__btn` scale 1→1.2 и обратно,
  1000ms outQuint.

### 7. Модалка (a-31, клик)

Начальный стейт: display none, opacity 0, translateY 100%. Открытие:
translateY→0 200ms ease, display block, opacity→1 200ms ease.
В React - AnimatePresence + initial/animate/exit.

### 8-9. Мультистеп-формы (a-34, a-35)

Переход шаг 1 → шаг 2 (клик по «Get My Quote»):
1. step-2 скрыт; inputs шага 2 подготовлены: opacity 0, translateX 100%;
2. inputs шага 1 уезжают: translateX→-100%, opacity→0, 1000ms outQuint;
3. display: step-1 none, step-2 flex;
4. inputs шага 2 въезжают: translateX→0, opacity→1, 1000ms outQuint.

a-35 - то же самое для CTA-формы (классы `.cta-form-*`). В React это state
переключения шага + motion-варианты; вместе с формой мигрирует и логика
sos-main.js (маски, датапикер, select2, Maps-автокомплит, POST в MoveBoard) -
это самая рискованная часть миграции, анимация тут дело десятое.

### 10. Ленты фото - луп (a-16, PAGE_FINISH)

Вертикальная маркиза в секции About-C: левый трек yPercent 100→0,
правый 0→100, 10 000ms linear, повтор бесконечный, бесшовность на
клон-блоках (`.about-c-images-clone-top/-bottom` = копии `.about-c-images-center`).
Уже воспроизведена на GSAP в `public/custom-scripts.js` (фолбэк из-за гонки
PAGE_FINISH с window.load - см. комментарий там же). В новом стэке -
CSS keyframes (transform: translateY) или motion с repeat: Infinity;
клоны собирать в компоненте из одного массива фото.

### 11. Фото-колонки - скролл-scrub (a, SCROLLING_IN_VIEW)

На городских и about-страницах колонки фото привязаны к прогрессу скролла
секции (не триггер, а scrub со smoothing 90): обычные треки yPercent 0→100,
`.is-right-track` - 100→0, по мере прокрутки секции через вьюпорт
(startsEntering, offset 50%). В новом стэке - `useScroll({ target, offset })`
+ `useTransform(scrollYProgress, [0,1], ['0%','100%'])` + spring для smoothing.

## Не-IX2 анимации (тоже входят в объём миграции)

- **Слайдеры slick** (jQuery): карусель отзывов, галерея. Замена -
  embla/keen-slider.
- **CSS-ховеры/транзишены** в `webflow.css` - мигрируют вместе с вёрсткой
  компонентов (Tailwind transition-классы).
- **Exit-попап, лайтбокс галереи, тучбар** - кастомный ваниль-JS в
  `public/custom-scripts.js`, переносится как React-компоненты.
- **Smooth scroll к якорям** - jQuery/GSAP ScrollToPlugin; в новом стэке
  scroll-behavior или Lenis.

## Словарь easing-ов Webflow → CSS/motion

| Webflow | CSS cubic-bezier | motion |
|---------|------------------|--------|
| ease | ease | "easeOut" близко; точнее [0.25, 0.1, 0.25, 1] |
| easeInOut | ease-in-out | [0.42, 0, 0.58, 1] |
| outQuint | cubic-bezier(0.23, 1, 0.32, 1) | [0.23, 1, 0.32, 1] |
| linear | linear | "linear" |

## Замечания

- `useFirstGroupAsInitialState: true` у листа означает: первая группа степов -
  это НАЧАЛЬНОЕ состояние, которое IX2 применяет инлайн-стилями при загрузке
  (например, скрытые inputs шага 2). При миграции эти значения становятся
  initial-пропсами компонента, иначе будет FOUC.
- 29 мёртвых событий перечислены в `ix2-catalog.json` со `status: "dead"` -
  их цели отсутствуют в актуальной вёрстке, не переносить.
- IX2 не уважает prefers-reduced-motion; в новом стэке стоит уважать
  (motion `useReducedMotion`), это осознанное улучшение, а не потеря паритета.
- Гонка PAGE_FINISH с window.load (задокументирована в custom-scripts.js)
  в новом стэке исчезает сама: анимации стартуют из компонентов.
