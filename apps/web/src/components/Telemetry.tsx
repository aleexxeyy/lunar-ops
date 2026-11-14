import { lazy, Suspense, useState } from "react";
import type { ResourceKey } from "@lunar-ops/contracts";
import { resourceLabels } from "./resources";
export { resourceLabels } from "./resources";
const Chart = lazy(() => import("./ResourceChart"));
export function ResourceChart({ resource }: { resource: ResourceKey }) {
  return (
    <Suspense
      fallback={<div className="chart" aria-label="???????? ??????????" />}
    >
      <Chart resource={resource} />
    </Suspense>
  );
}

export function Telemetry() {
  const [resource, setResource] = useState<ResourceKey>("energy");
  return (
    <section className="panel telemetry-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RESOURCE MONITOR</span>
          <h2>Телеметрия</h2>
        </div>
        <span className="micro">НА КОНЕЦ ДНЯ</span>
      </div>
      <div className="chart-legend">
        {(Object.keys(resourceLabels) as ResourceKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setResource(key)}
            aria-pressed={resource === key}
            className={resource === key ? "active" : ""}
          >
            <i style={{ background: resourceLabels[key].color }} />
            {resourceLabels[key].name}
          </button>
        ))}
      </div>
      <ResourceChart resource={resource} />
    </section>
  );
}
