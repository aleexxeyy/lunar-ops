# Презентация — пример

Макет финальной презентации Lunar Ops для NASA Space Apps Challenge Dnipro 2026
(челлендж [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=details)).

Это черновик: всё в `[квадратных скобках]` — заглушки, которые нужно заменить
(название команды, почта, участники). Содержание слайдов сверено с игрой из
[aleexxeyy/lunar-ops](https://github.com/aleexxeyy/lunar-ops) (коммит 7682286).

## Требования мануала

- Не больше **7 слайдов**, включая титульный, на **английском** (иначе проект не допускают к Global Judging).
- Рекомендованное содержание: название команды, участники, выбранный челлендж, визуализация проекта,
  как работает решение, пользовательский опыт, как используются данные NASA / Space Agency Partners.

## Структура

| # | Файл | Слайд |
|---|---|---|
| 1 | `slides/cover.html` | Титульный: команда, проект, челлендж, колледж, контакты |
| 2 | `slides/mission.html` | Mission Briefing — проблема и цель |
| 3 | `slides/how.html` | How it works — игровой день: ресурсы, 2 операции, событие, итог дня + скриншот |
| 4 | `slides/experience.html` | Player Experience — скриншоты (desktop и телефон) и преимущества |
| 5 | `slides/data.html` | NASA Science — события игры и научные источники (DONKI, OSDR, Moon Trek, CSA, RadLab) |
| 6 | `slides/crew.html` | Crew — участники |
| 7 | `slides/next.html` | Further plans, источники, благодарность |

## Файлы

- `LunarOps_SpaceApps_Dnipro_2026.pptx` — **PowerPoint-версия**, полностью редактируемая (текст, фигуры, таблица, заметки докладчика).
  Шрифты: Arial (заголовки), Calibri (текст), Consolas (подписи) — есть в любом Office.
- `build_pptx.py` — скрипт, которым собран .pptx (`python build_pptx.py out.pptx assets/`, нужны `python-pptx`, `Pillow`, `numpy`;
  в `assets/` должны лежать `shot-event.png`, `shot-dashboard.png`, `shot-mobile.png` из `screenshots/`).
  Можно не трогать — дальше удобнее править прямо в PowerPoint.
- `preview.html` — открыть в браузере, чтобы пролистать все слайды (упрощённый предпросмотр, без иконок и анимаций).
- `deck.json` — порядок слайдов, разделы, шрифты.
- `deck.css` — общие стили: палитра (космический синий `#0B1026`, марсианский оранжевый `#FF7A3D`, бирюзовый `#38D9C4`),
  шрифты Space Grotesk / Nunito Sans / JetBrains Mono.
- `slides/*.html` — по одному файлу на слайд; в `<aside>` — заметки докладчика на русском.
- `screenshots/` — 19 скриншотов игры (1920×1080, `19_mobile.png` — телефон) и обрезки `shot-*.png` для слайдов.

Основная редактируемая версия лежит в Claude Slides (оттуда экспорт в PPTX/PDF). Эти файлы — её копия-исходник.

## Что ещё не готово

- Интерфейс игры на русском, а презентация должна быть на английском — к финалу стоит перевести UI и переснять скриншоты.
- Живых данных NASA в игре пока нет (условная учебная модель). Слайд 5 говорит об этом честно;
  если подключите DONKI через `apps/api`, поправьте нижнюю строку слайда 5 и план UPGRADE на слайде 7.
