# Презентация — пример

Макет финальной презентации Lunar Ops для NASA Space Apps Challenge Dnipro 2026
(челлендж [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=details)).

Это черновик: всё в `[квадратных скобках]` — заглушки, которые нужно заменить
(название команды и проекта, контакты, участники, скриншот игры, детали использования данных NASA).

## Требования мануала

- Не больше **7 слайдов**, включая титульный, на **английском** (иначе проект не допускают к Global Judging).
- Рекомендованное содержание: название команды, участники, выбранный челлендж, визуализация проекта,
  как работает решение, пользовательский опыт, как используются данные NASA / Space Agency Partners.

## Структура

| # | Файл | Слайд |
|---|---|---|
| 1 | `slides/cover.html` | Титульный: команда, проект, челлендж, колледж, контакты |
| 2 | `slides/mission.html` | Mission Briefing — проблема и цель |
| 3 | `slides/how.html` | How it works — игровой цикл одного сола, панель ресурсов (макет) |
| 4 | `slides/experience.html` | Player Experience — скриншот и преимущества |
| 5 | `slides/data.html` | Real NASA Data — DONKI, OSDR, RadLab, Mars Trek, CSA |
| 6 | `slides/crew.html` | Crew — участники |
| 7 | `slides/next.html` | Further plans, источники, благодарность |

## Файлы

- `LunarOps_SpaceApps_Dnipro_2026.pptx` — **PowerPoint-версия**, полностью редактируемая (текст, фигуры, таблица, заметки докладчика).
  Шрифты: Arial (заголовки), Calibri (текст), Consolas (подписи) — есть в любом Office.
- `build_pptx.py` — скрипт, которым собран .pptx (`python build_pptx.py out.pptx assets/`, нужны `python-pptx`, `Pillow`, `numpy`).
  Можно не трогать — дальше удобнее править прямо в PowerPoint.
- `preview.html` — открыть в браузере, чтобы пролистать все слайды (упрощённый предпросмотр, без иконок и анимаций).
- `deck.json` — порядок слайдов, разделы, шрифты.
- `deck.css` — общие стили: палитра (космический синий `#0B1026`, марсианский оранжевый `#FF7A3D`, бирюзовый `#38D9C4`),
  шрифты Space Grotesk / Nunito Sans / JetBrains Mono.
- `slides/*.html` — по одному файлу на слайд; в `<aside>` — заметки докладчика на русском.

Основная редактируемая версия лежит в Claude Slides (оттуда экспорт в PPTX/PDF). Эти файлы — её копия-исходник.

## Что ещё не готово

В репозитории пока только каркас монорепо (React + Vite, NestJS, `game-core`, `game-config`, `contracts`),
игровой логики и UI ещё нет — скриншоты игры и значения шкал на слайде 3 нужно будет добавить, когда появится прототип.
