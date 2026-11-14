import type { ResourceKey } from "@lunar-ops/contracts";

export const resourceLabels: Record<
  ResourceKey,
  { name: string; color: string; code: string; description: string }
> = {
  energy: {
    name: "Энергия",
    color: "#c0f779",
    code: "PWR",
    description:
      "Питает модули базы и все операции. Солнечный массив и инженеры снижают ежедневный расход.",
  },
  oxygen: {
    name: "Кислород",
    color: "#69dce5",
    code: "O₂",
    description:
      "Обеспечивает дыхание экипажа. Улучшайте жизнеобеспечение и обслуживайте электролизёр.",
  },
  water: {
    name: "Вода",
    color: "#8bafff",
    code: "H₂O",
    description:
      "Нужна экипажу и исследованиям. Гидропонный отсек и дополнительная переработка восстанавливают запас.",
  },
  morale: {
    name: "Мораль",
    color: "#de9dff",
    code: "MOR",
    description:
      "Показывает психологическое состояние экипажа. Отдых и гидропонный отсек помогают сохранить её.",
  },
};
