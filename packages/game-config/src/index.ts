import type { MissionConfig } from "@lunar-ops/contracts";

export const missionConfig: MissionConfig = {
  duration: 7,
  scienceTarget: 60,
  actionsPerDay: 2,
  resourceCap: 100,
  initialResources: { energy: 90, oxygen: 92, water: 80, morale: 86 },
  initialParts: 70,
  initialHealth: 100,
  dailyConsumption: { energy: 18, oxygen: 14, water: 12, morale: 6 },
  difficulties: {
    cadet: {
      name: "Кадет",
      description: "Первый полёт. Стандартный расход ресурсов.",
      consumptionMultiplier: 1,
    },
    commander: {
      name: "Командир",
      description: "Расход ресурсов выше на 35%. Каждый выбор важен.",
      consumptionMultiplier: 1.35,
    },
  },
  actions: [
    {
      id: "research",
      name: "Исследовать реголит",
      description:
        "Изучите лунный грунт и получите научные данные. Лаборатория усиливает результат.",
      effect: { resources: { energy: -12, water: -4 }, science: 18 },
    },
    {
      id: "oxygen",
      name: "Восстановить кислород",
      description:
        "Проведите обслуживание электролизёра и пополните запас кислорода.",
      effect: { resources: { energy: -8, oxygen: 24 }, parts: -6 },
    },
    {
      id: "water",
      name: "Переработать воду",
      description:
        "Запустите дополнительный цикл очистки воды в замкнутой системе.",
      effect: { resources: { energy: -8, water: 24 } },
    },
    {
      id: "rest",
      name: "Отдых экипажа",
      description:
        "Выделите время на восстановление: +12 здоровья каждому участнику.",
      effect: { resources: { energy: -4, morale: 20 }, health: 12 },
    },
  ],
  modules: [
    {
      id: "solar",
      name: "Солнечный массив",
      code: "PWR-01",
      description: "Каждый уровень вырабатывает 9 энергии за день.",
      production: { energy: 9 },
      science: 0,
    },
    {
      id: "recycler",
      name: "Система жизнеобеспечения",
      code: "LSS-02",
      description: "Каждый уровень возвращает 5 кислорода за день.",
      production: { oxygen: 5 },
      science: 0,
    },
    {
      id: "greenhouse",
      name: "Гидропонный отсек",
      code: "BIO-03",
      description: "Каждый уровень возвращает 4 воды и 2 морали за день.",
      production: { water: 4, morale: 2 },
      science: 0,
    },
    {
      id: "laboratory",
      name: "Научная лаборатория",
      code: "SCI-04",
      description:
        "Каждый уровень даёт 2 науки за день. Улучшение также усиливает исследования.",
      production: {},
      science: 2,
    },
  ],
  roles: {
    engineer: {
      name: "Инженер",
      description: "+2 энергии за день",
      effect: { resources: { energy: 2 } },
    },
    scientist: {
      name: "Исследователь",
      description: "+3 науки за день",
      effect: { science: 3 },
    },
    medic: {
      name: "Медик",
      description: "+3 здоровья всем за день",
      effect: { health: 3 },
    },
  },
  crew: [
    { id: "nova", name: "Алекс Морган", callsign: "NOVA", role: "engineer" },
    { id: "echo", name: "Саша Ким", callsign: "ECHO", role: "scientist" },
    { id: "pulse", name: "Рэй Окада", callsign: "PULSE", role: "medic" },
  ],
  upgrade: { baseCost: 18, costPerLevel: 8, energyCost: 5, maxLevel: 3 },
  criticalThreshold: 20,
  criticalHealthLoss: 15,
  researchBonusPerLabLevel: 6,
  events: [
    {
      id: "solar-storm",
      day: 2,
      title: "Солнечная буря",
      description:
        "Датчики зафиксировали поток заряженных частиц. Выберите способ защиты экипажа.",
      lesson:
        "На Луне почти нет атмосферы и глобального магнитного поля. Укрытия и прогноз космической погоды помогают снизить радиационный риск.",
      choices: [
        {
          id: "shield",
          label: "Активировать защиту",
          explanation: "Потратить энергию и сохранить рабочий график.",
          effect: { resources: { energy: -14, morale: 2 } },
        },
        {
          id: "shelter",
          label: "Переждать в укрытии",
          explanation: "Сохранить энергию, приостановив часть исследований.",
          effect: { resources: { morale: -6 }, science: -4 },
        },
      ],
    },
    {
      id: "air-leak",
      day: 4,
      title: "Разгерметизация отсека",
      description:
        "В соединении шлюза обнаружена утечка. Отремонтируйте узел или изолируйте отсек.",
      lesson:
        "Герметичные отсеки позволяют локализовать утечку. На реальной базе контроль давления и резервные запасы жизненно необходимы.",
      choices: [
        {
          id: "repair",
          label: "Установить новый уплотнитель",
          explanation: "Использовать запасные детали и восстановить давление.",
          effect: { parts: -14, resources: { oxygen: 8 } },
        },
        {
          id: "isolate",
          label: "Изолировать отсек",
          explanation: "Отсечь утечку с потерей части кислорода.",
          effect: { resources: { oxygen: -16, energy: -4 } },
        },
      ],
    },
    {
      id: "ice-signal",
      day: 6,
      title: "Сигнал под поверхностью",
      description:
        "Радар обнаружил перспективный участок у кратера. Отправить экспедицию или провести удалённое наблюдение?",
      lesson:
        "В постоянно затенённых областях у полюсов Луны может сохраняться водяной лёд — важный ресурс для будущих экспедиций.",
      choices: [
        {
          id: "expedition",
          label: "Отправить экспедицию",
          explanation: "Потратить ресурсы ради большого научного результата.",
          effect: { resources: { energy: -15, water: -8 }, science: 25 },
        },
        {
          id: "remote",
          label: "Сканировать с базы",
          explanation: "Получить меньше данных без расхода запасов.",
          effect: { science: 8 },
        },
      ],
    },
  ],
};
