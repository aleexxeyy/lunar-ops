import type { ActionId, ModuleId, ResourceKey } from "@lunar-ops/contracts";

export const resourceLabels: Record<
  ResourceKey,
  {
    name: string;
    color: string;
    code: string;
    description: string;
    moduleId: ModuleId;
    actionId?: ActionId;
  }
> = {
  energy: {
    moduleId: "solar",
    name: "Енергія",
    color: "#c0f779",
    code: "PWR",
    description:
      "Забезпечує роботу модулів бази та всіх операцій. Сонячні панелі й інженери зменшують щоденне споживання.",
  },
  oxygen: {
    moduleId: "recycler",
    actionId: "oxygen",
    name: "Кисень",
    color: "#69dce5",
    code: "O₂",
    description:
      "Забезпечує дихання екіпажу. Поліпшуйте систему життєзабезпечення та обслуговуйте електролізер.",
  },
  water: {
    moduleId: "greenhouse",
    actionId: "water",
    name: "Вода",
    color: "#8bafff",
    code: "H₂O",
    description:
      "Потрібна екіпажу та для досліджень. Гідропонний відсік і додаткове очищення відновлюють запас.",
  },
  morale: {
    moduleId: "greenhouse",
    actionId: "rest",
    name: "Настрій",
    color: "#de9dff",
    code: "MOR",
    description:
      "Показує психологічний стан екіпажу. Відпочинок і гідропонний відсік допомагають підтримувати його.",
  },
};
