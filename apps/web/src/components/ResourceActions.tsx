import type { ResourceKey } from "@lunar-ops/contracts";
import { commandsBlocked, useMission } from "../store";
import { resourceLabels } from "./resources";
import { EffectBadges } from "./MissionPanels";
import { Icon } from "./Icon";

export function ResourceActions({ resource }: { resource: ResourceKey }) {
  const { mission, config, openDialog, send } = useMission();
  const blocked = useMission(commandsBlocked);
  if (!mission || !config) return null;
  const { actionId, moduleId } = resourceLabels[resource];
  const action = config.actions.find((item) => item.id === actionId);
  const module = config.modules.find((item) => item.id === moduleId)!;
  return (
    <div className="resource-actions">
      {action && (
        <>
          <p>{action.description}</p>
          <EffectBadges effect={mission.actionEffects[action.id]} />
          <button
            className="button primary full-width"
            disabled={blocked || !mission.availableActions[action.id].available}
            onClick={() => void send({ type: "action", actionId: action.id })}
          >
            {action.name}
            <Icon name="arrow" size={16} />
          </button>
          <p className="muted">
            {mission.availableActions[action.id].reason ??
              "Расходует одну операцию текущего дня."}
          </p>
        </>
      )}
      <button
        className="button secondary full-width"
        onClick={() => openDialog({ type: "module", moduleId })}
      >
        {module.name}
        <Icon name="arrowUp" size={16} />
      </button>
    </div>
  );
}
