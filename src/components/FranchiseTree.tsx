"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { NodeKind, NodePriority, SpoilerMode } from "@/db/schema";
import { setLensAction } from "@/lib/actions";
import { LEVEL_NAMES, LEVEL_RANK, powerTier, type Lens } from "@/lib/lens-shared";

export type TreeNodeData = {
  key: string;
  parentKey: string | null;
  label: string;
  kind: NodeKind;
  year: number;
  releaseOrder: number;
  chronoOrder: number;
  units: number;
  unit: string;
  rating: number;
  power: number;
  priority: NodePriority;
  canon: boolean;
  creator: string;
  blurb: string;
  /** null when empty or hidden by the reader's lens */
  mild: string | null;
  heavy: string | null;
  powerNote: string | null;
  mildLocked: boolean;
  heavyLocked: boolean;
};

type Order = "release" | "story" | "rating";

const ORDERS: { value: Order; label: string; hint: string }[] = [
  { value: "release", label: "Release order", hint: "which came first" },
  { value: "story", label: "Story order", hint: "in-universe timeline" },
  { value: "rating", label: "Top rated", hint: "best first" },
];

const KIND_LABEL: Record<NodeKind, string> = {
  source: "Source",
  season: "Season",
  movie: "Film",
  ova: "OVA",
  special: "Special",
  arc: "Arc",
  spinoff: "Spin-off",
  remake: "Remake",
};

const PRIORITY_STYLE: Record<NodePriority, string> = {
  essential: "border-paper bg-paper text-ink",
  recommended: "border-paper/60 text-paper",
  optional: "border-dashed border-paper/40 text-dim",
  skip: "border-line text-mute line-through",
};

const ROUTE_COPY: Record<Lens["level"], string> = {
  beginner: "Essential entries only: enough to finish the story with zero homework.",
  mediocre: "Essentials plus the recommended companions that deepen the story.",
  elite: "Everything canon and every companion work. Only true skips are left out.",
};

const POWER_COPY: Record<Lens["level"], string> = {
  beginner:
    "Beginner depth: you see the shape of the escalation and a tier word. Numbers, deltas and breakdowns open at Mediocre and Elite.",
  mediocre:
    "Mediocre depth: numeric power per entry with the change from the previous one. Per-entry breakdowns open at Elite.",
  elite:
    "Elite depth: numeric power, deltas and the reasoning behind each jump. Power is relative to this franchise's own ceiling (1-100).",
};

function inRoute(level: Lens["level"], node: TreeNodeData): boolean {
  if (level === "beginner") return node.priority === "essential";
  if (level === "mediocre") return node.priority === "essential" || node.priority === "recommended";
  return node.priority !== "skip";
}

function yearLabel(node: TreeNodeData): string {
  return node.kind === "arc" ? `c. ${node.year}` : String(node.year);
}

function unitLabel(node: TreeNodeData): string {
  return node.units > 0 ? `${node.units} ${node.unit}` : "—";
}

function shortLabel(label: string): string {
  return label.length > 15 ? `${label.slice(0, 14)}…` : label;
}

function PowerCurve({ seq, rank }: { seq: TreeNodeData[]; rank: number }) {
  if (seq.length < 2) {
    return (
      <p className="mono text-[9px] text-mute">
        Not enough installments with a measurable power level to plot a curve.
      </p>
    );
  }
  const W = 680;
  const H = 190;
  const padX = 40;
  const padTop = 22;
  const padBottom = 38;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const x = (index: number) => padX + (innerW * index) / (seq.length - 1);
  const y = (power: number) => padTop + innerH - (power / 100) * innerH;
  const line = seq
    .map((node, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(node.power).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(seq.length - 1).toFixed(1)} ${padTop + innerH} L${x(0).toFixed(1)} ${padTop + innerH} Z`;
  const bands = [
    { label: "Mythic", at: 87.5 },
    { label: "Overwhelming", at: 62.5 },
    { label: "Rising", at: 37.5 },
    { label: "Grounded", at: 12.5 },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Power level curve across the franchise">
      {[25, 50, 75].map((guide) => (
        <line
          key={guide}
          x1={padX}
          x2={W - padX}
          y1={y(guide)}
          y2={y(guide)}
          stroke="#232327"
          strokeDasharray="3 5"
        />
      ))}
      {bands.map((band) => (
        <text
          key={band.label}
          x={W - 6}
          y={y(band.at) + 3}
          textAnchor="end"
          fontSize="8"
          fill="#5c5c62"
          style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          {band.label}
        </text>
      ))}
      <path d={area} style={{ fill: "var(--accent)", opacity: 0.12 }} />
      <path d={line} fill="none" strokeWidth="2" style={{ stroke: "var(--accent)" }} />
      {seq.map((node, index) => (
        <g key={node.key}>
          <circle cx={x(index)} cy={y(node.power)} r="4.5" style={{ fill: "var(--accent)" }} />
          {rank >= 1 ? (
            <text x={x(index)} y={y(node.power) - 11} textAnchor="middle" fontSize="11" fill="#f3f3ef">
              {node.power}
            </text>
          ) : null}
          <text x={x(index)} y={H - 14} textAnchor="middle" fontSize="9" fill="#8a8a90">
            {shortLabel(node.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function FranchiseTree({ nodes, lens }: { nodes: TreeNodeData[]; lens: Lens }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [order, setOrder] = useState<Order>("release");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const rank = LEVEL_RANK[lens.level];

  const sorted = useMemo(() => {
    const list = [...nodes];
    if (order === "release") list.sort((a, b) => a.releaseOrder - b.releaseOrder);
    else if (order === "story")
      list.sort((a, b) => a.chronoOrder - b.chronoOrder || a.releaseOrder - b.releaseOrder);
    else list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [nodes, order]);

  const position = useMemo(() => new Map(sorted.map((node, index) => [node.key, index + 1])), [sorted]);

  const tree = useMemo(() => {
    const keys = new Set(nodes.map((node) => node.key));
    const map = new Map<string, TreeNodeData[]>();
    const roots: TreeNodeData[] = [];
    for (const node of sorted) {
      if (node.parentKey && keys.has(node.parentKey)) {
        const bucket = map.get(node.parentKey) ?? [];
        bucket.push(node);
        map.set(node.parentKey, bucket);
      } else {
        roots.push(node);
      }
    }
    return { map, roots };
  }, [nodes, sorted]);

  const powerSeq = useMemo(() => {
    const list = nodes.filter((node) => node.power > 0 && node.canon);
    if (order === "story")
      list.sort((a, b) => a.chronoOrder - b.chronoOrder || a.releaseOrder - b.releaseOrder);
    else list.sort((a, b) => a.releaseOrder - b.releaseOrder);
    return list;
  }, [nodes, order]);

  const deltas = useMemo(() => {
    const map = new Map<string, number | null>();
    powerSeq.forEach((node, index) => {
      map.set(node.key, index === 0 ? null : node.power - powerSeq[index - 1].power);
    });
    return map;
  }, [powerSeq]);

  const route = sorted.filter((node) => inRoute(lens.level, node));
  const best = [...route].sort((a, b) => b.rating - a.rating)[0];
  const peak = powerSeq.reduce((max, node) => Math.max(max, node.power), 0);

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function unlock(mode: SpoilerMode) {
    start(async () => {
      await setLensAction(lens.level, mode);
      router.refresh();
    });
  }

  const allOpen = open.size === nodes.length;
  const mildTarget: SpoilerMode = lens.level === "mediocre" ? "mild" : "full";

  const lockedBox = (grade: "mild" | "heavy"): ReactNode => (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-paper/30 p-3">
      <span className="mono text-[9px] text-mute">{grade} spoiler notes hidden by your lens</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => unlock(grade === "mild" ? mildTarget : "full")}
        className="mono border border-paper/50 px-3 py-1.5 text-[9px] text-paper transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
      >
        {lens.level === "beginner"
          ? "I want spoilers"
          : grade === "mild"
            ? "Show mild"
            : "Show everything"}
      </button>
    </div>
  );

  const renderNode = (node: TreeNodeData): ReactNode => {
    const isOpen = open.has(node.key);
    const kids = tree.map.get(node.key) ?? [];
    const delta = deltas.get(node.key);
    const onRoute = inRoute(lens.level, node);

    return (
      <li key={node.key}>
        <div className={`panel grain ${onRoute ? "border-paper/40" : ""}`}>
          <button
            type="button"
            onClick={() => toggle(node.key)}
            aria-expanded={isOpen}
            className="flex w-full items-start gap-3 p-4 text-left"
          >
            <span className="display grid h-9 w-9 shrink-0 place-items-center border border-line bg-ink-raise text-sm text-paper">
              {position.get(node.key)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="display text-base leading-tight text-paper">{node.label}</span>
                <span className="mono border border-line px-1.5 py-0.5 text-[8px] text-mute">
                  {KIND_LABEL[node.kind]}
                </span>
                <span className={`mono border px-1.5 py-0.5 text-[8px] ${PRIORITY_STYLE[node.priority]}`}>
                  {node.priority}
                </span>
                {node.canon ? null : (
                  <span className="mono border border-line px-1.5 py-0.5 text-[8px] text-mute">
                    non-canon
                  </span>
                )}
              </span>
              <span className="mono mt-1.5 block text-[9px] text-mute">
                {yearLabel(node)}
                {rank >= 1 ? ` · ${unitLabel(node)} · ${node.creator}` : ""}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="display block text-xl accent-text">{node.rating.toFixed(1)}</span>
              <span className="mono block text-[8px] text-mute">{isOpen ? "close" : "open"}</span>
            </span>
          </button>

          <p className="px-4 pb-3 text-[13px] leading-relaxed text-dim">{node.blurb}</p>

          {node.power > 0 ? (
            <div className="flex items-center gap-3 px-4 pb-4">
              <span className="mono w-12 shrink-0 text-[8px] text-mute">power</span>
              <div className="h-1.5 flex-1 bg-line">
                <div className="accent-bg h-full" style={{ width: `${node.power}%` }} />
              </div>
              <span className="mono shrink-0 text-[9px] text-dim">
                {rank === 0 ? powerTier(node.power) : `${node.power} · ${powerTier(node.power)}`}
              </span>
              {rank >= 1 && node.canon && delta !== null && delta !== undefined ? (
                <span className="mono shrink-0 text-[9px] accent-text">
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              ) : null}
            </div>
          ) : null}

          {isOpen ? (
            <div className="rise grid gap-3 border-t border-line p-4">
              <div className="mono text-[9px] text-mute">
                {onRoute ? "On your suggested route" : "Not required for your route"}
              </div>

              {rank >= 1 ? (
                <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                  {[
                    ["Length", unitLabel(node)],
                    ["Studio / author", node.creator || "—"],
                    ["Canon", node.canon ? "Yes" : "No"],
                    [
                      "Position",
                      rank >= 2
                        ? `R${node.releaseOrder} · S${node.chronoOrder}`
                        : `R${node.releaseOrder}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-ink-soft px-3 py-2.5">
                      <dt className="mono text-[8px] text-mute">{label}</dt>
                      <dd className="mt-1 text-[12.5px] text-paper">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {rank >= 2 && node.powerNote ? (
                <div className="border border-line p-3">
                  <div className="mono mb-1.5 text-[9px] text-mute">Power breakdown</div>
                  <p className="text-[13px] leading-relaxed text-dim">{node.powerNote}</p>
                </div>
              ) : null}

              {node.mild ? (
                <div className="border border-paper/25 p-3">
                  <div className="mono mb-1.5 text-[9px] text-paper">Mild spoilers</div>
                  <p className="text-[13px] leading-relaxed text-dim">{node.mild}</p>
                </div>
              ) : node.mildLocked ? (
                lockedBox("mild")
              ) : null}

              {node.heavy ? (
                <div className="border border-paper/40 bg-white/[0.03] p-3">
                  <div className="mono mb-1.5 text-[9px] text-paper">Heavy spoilers</div>
                  <p className="text-[13px] leading-relaxed text-dim">{node.heavy}</p>
                </div>
              ) : node.heavyLocked ? (
                lockedBox("heavy")
              ) : null}
            </div>
          ) : null}
        </div>

        {kids.length > 0 ? <ul>{kids.map(renderNode)}</ul> : null}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ORDERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setOrder(item.value)}
              className={`border px-3 py-2 text-left transition-colors ${
                order === item.value
                  ? "border-paper bg-paper text-ink"
                  : "border-line text-dim hover:border-paper hover:text-paper"
              }`}
            >
              <span className="mono block text-[9px]">{item.label}</span>
              <span className={`mono block text-[7px] ${order === item.value ? "text-ink/60" : "text-mute"}`}>
                {item.hint}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(nodes.map((node) => node.key)))}
          className="mono border border-line px-3 py-2 text-[9px] text-dim transition-colors hover:border-paper hover:text-paper"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* suggested route */}
      <div className="panel grain p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mono text-[9px] text-mute">Suggested route · {LEVEL_NAMES[lens.level]}</div>
          <div className="mono text-[9px] text-mute">
            {route.length} of {nodes.length} entries
            {best ? ` · best rated stop: ${best.label} (${best.rating.toFixed(1)})` : ""}
          </div>
        </div>
        <ol className="mt-4 flex flex-wrap items-stretch gap-2">
          {route.map((node, index) => (
            <li key={node.key} className="flex items-center gap-2">
              <div className="border border-line px-3 py-2">
                <div className="mono text-[8px] text-mute">
                  {index + 1} · {yearLabel(node)}
                </div>
                <div className="mt-1 text-[12.5px] text-paper">{node.label}</div>
                <div className="mono mt-1 text-[9px] accent-text">{node.rating.toFixed(1)}</div>
              </div>
              {index < route.length - 1 ? <span className="mono text-mute">→</span> : null}
            </li>
          ))}
        </ol>
        <p className="mono mt-4 text-[9px] text-mute">{ROUTE_COPY[lens.level]}</p>
      </div>

      {/* power curve */}
      <div className="panel grain p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mono text-[9px] text-mute">
            Power level across the timeline ·{" "}
            {order === "story" ? "story order" : "release order"}
          </div>
          <div className="mono text-[9px] text-mute">
            {rank === 0 ? `peaks at: ${powerTier(peak)}` : `peak ${peak}/100`}
          </div>
        </div>
        <div className="mt-4">
          <PowerCurve seq={powerSeq} rank={rank} />
        </div>
        <p className="mono mt-3 text-[9px] text-mute">{POWER_COPY[lens.level]}</p>
      </div>

      {/* the tree */}
      <ul className="tree">{tree.roots.map(renderNode)}</ul>
    </div>
  );
}
