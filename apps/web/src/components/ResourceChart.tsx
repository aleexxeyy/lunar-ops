import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResourceKey } from "@lunar-ops/contracts";
import { useMission } from "../store";
import { resourceLabels } from "./resources";

export default function ResourceChart({ resource }: { resource: ResourceKey }) {
  const history = useMission((s) => s.mission!.history);
  const color = resourceLabels[resource].color;
  return (
    <div
      className="chart"
      role="img"
      aria-label={`История: ${resourceLabels[resource].name}. ${history.map((p) => `День ${p.day}: ${p[resource]}%`).join("; ")}`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={history}
          margin={{ top: 12, right: 12, left: -30, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#253138"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tickFormatter={(day: number) =>
              `D${day.toString().padStart(2, "0")}`
            }
            tick={{ fill: "#71868c", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: "#71868c", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#142127",
              border: "1px solid #3d5558",
              borderRadius: 6,
              color: "#f1f6f3",
              fontSize: 12,
            }}
            labelFormatter={(day) => `День ${day}`}
            formatter={(value) => [`${value}%`, resourceLabels[resource].name]}
          />
          <Line
            type="linear"
            dataKey={resource}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
