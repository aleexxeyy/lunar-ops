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
      description: "Перший політ. Стандартне споживання ресурсів.",
      consumptionMultiplier: 1,
    },
    commander: {
      name: "Командир",
      description: "Споживання ресурсів вище на 35%. Кожен вибір важливий.",
      consumptionMultiplier: 1.35,
    },
  },
  actions: [
    {
      id: "research",
      name: "Дослідити реголіт",
      description:
        "Дослідіть місячний ґрунт і здобудьте наукові дані. Лабораторія підвищує результативність досліджень.",
      effect: { resources: { energy: -12, water: -4 }, science: 18 },
    },
    {
      id: "oxygen",
      name: "Поповнити запас кисню",
      description:
        "Проведіть технічне обслуговування електролізера та поповніть запас кисню.",
      effect: { resources: { energy: -8, oxygen: 24 }, parts: -6 },
    },
    {
      id: "water",
      name: "Очистити воду",
      description:
        "Запустіть додатковий цикл очищення води в замкненій системі.",
      effect: { resources: { energy: -8, water: 24 } },
    },
    {
      id: "rest",
      name: "Відпочинок екіпажу",
      description:
        "Виділіть час на відновлення: +12 здоров’я кожному учаснику.",
      effect: { resources: { energy: -4, morale: 20 }, health: 12 },
    },
  ],
  modules: [
    {
      id: "solar",
      name: "Сонячні панелі",
      code: "PWR-01",
      description: "Кожен рівень виробляє 9 одиниць енергії за день.",
      production: { energy: 9 },
      science: 0,
    },
    {
      id: "recycler",
      name: "Система життєзабезпечення",
      code: "LSS-02",
      description: "Кожен рівень відновлює 5 одиниць кисню за день.",
      production: { oxygen: 5 },
      science: 0,
    },
    {
      id: "greenhouse",
      name: "Гідропонний відсік",
      code: "BIO-03",
      description:
        "Кожен рівень відновлює 4 одиниці води та підвищує настрій на 2 за день.",
      production: { water: 4, morale: 2 },
      science: 0,
    },
    {
      id: "laboratory",
      name: "Наукова лабораторія",
      code: "SCI-04",
      description:
        "Кожен рівень дає 2 наукові бали за день. Поліпшення також підвищує результативність досліджень.",
      production: {},
      science: 2,
    },
  ],
  roles: {
    engineer: {
      name: "Інженер",
      description: "+2 енергії за день",
      effect: { resources: { energy: 2 } },
    },
    scientist: {
      name: "Дослідник",
      description: "+3 наукові бали за день",
      effect: { science: 3 },
    },
    medic: {
      name: "Медик",
      description: "+3 здоров’я всім за день",
      effect: { health: 3 },
    },
  },
  crew: [
    { id: "nova", name: "Алекс Морган", callsign: "NOVA", role: "engineer" },
    { id: "echo", name: "Саша Кім", callsign: "ECHO", role: "scientist" },
    { id: "pulse", name: "Рей Окада", callsign: "PULSE", role: "medic" },
  ],
  upgrade: { baseCost: 18, costPerLevel: 8, energyCost: 5, maxLevel: 3 },
  criticalThreshold: 20,
  criticalHealthLoss: 15,
  researchBonusPerLabLevel: 6,
  events: [
    {
      id: "solar-storm",
      day: 2,
      title: "Сонячна буря",
      description:
        "Датчики зафіксували потік заряджених частинок. Виберіть спосіб захисту екіпажу.",
      lesson:
        "На Місяці майже немає атмосфери та глобального магнітного поля. Укриття й прогноз космічної погоди допомагають знизити радіаційний ризик.",
      choices: [
        {
          id: "shield",
          label: "Активувати захист",
          explanation: "Витратити енергію та зберегти робочий графік.",
          effect: { resources: { energy: -14, morale: 2 } },
        },
        {
          id: "shelter",
          label: "Перечекати в укритті",
          explanation: "Зберегти енергію, призупинивши частину досліджень.",
          effect: { resources: { morale: -6 }, science: -4 },
        },
      ],
    },
    {
      id: "air-leak",
      day: 4,
      title: "Розгерметизація відсіку",
      description:
        "У з’єднанні шлюзу виявлено витік. Відремонтуйте вузол або ізолюйте відсік.",
      lesson:
        "Герметичні відсіки дають змогу локалізувати витік. На реальній базі контроль тиску та резервні запаси життєво необхідні.",
      choices: [
        {
          id: "repair",
          label: "Установити новий ущільнювач",
          explanation: "Використати запасні деталі та відновити тиск.",
          effect: { parts: -14, resources: { oxygen: 8 } },
        },
        {
          id: "isolate",
          label: "Ізолювати відсік",
          explanation: "Зупинити витік, втративши частину кисню.",
          effect: { resources: { oxygen: -16, energy: -4 } },
        },
      ],
    },
    {
      id: "ice-signal",
      day: 6,
      title: "Сигнал під поверхнею",
      description:
        "Радар виявив перспективну ділянку біля кратера. Відправити експедицію чи провести дистанційне спостереження?",
      lesson:
        "У постійно затінених ділянках біля полюсів Місяця може зберігатися водяний лід — важливий ресурс для майбутніх експедицій.",
      choices: [
        {
          id: "expedition",
          label: "Відправити експедицію",
          explanation:
            "Витратити ресурси заради вагомого наукового результату.",
          effect: { resources: { energy: -15, water: -8 }, science: 25 },
        },
        {
          id: "remote",
          label: "Сканувати з бази",
          explanation: "Отримати менше даних без витрати запасів.",
          effect: { science: 8 },
        },
      ],
    },
  ],
};
