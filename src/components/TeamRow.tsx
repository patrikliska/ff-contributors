import { useState } from "react";
import { type TeamGroup } from "../hooks/useContributorData";
import { getAccentColor } from "../utils/colors";
import styles from "./TeamRow.module.css";

interface Props {
  group: TeamGroup;
  maxCommits: number;
  totalCommits: number;
  animationDelay: number;
}

export function TeamRow({ group, maxCommits, totalCommits, animationDelay }: Props) {
  const [expanded, setExpanded] = useState(false);

  const teamColor = group.team?.color ?? "rgba(255,255,255,0.3)";
  const teamName = group.team?.name ?? "Unassigned";
  const barWidth = `${(group.totalCommits / maxCommits) * 100}%`;
  const pct = ((group.totalCommits / totalCommits) * 100).toFixed(1);

  return (
    <>
      <div
        className={styles.row}
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span className={styles.chevron} style={{ color: teamColor }}>
          {expanded ? "▾" : "▸"}
        </span>

        <div className={styles.nameWrap}>
          <span className={styles.name} style={{ color: teamColor }}>
            {teamName}
          </span>
          <span className={styles.memberCount}>
            {group.contributors.length} member{group.contributors.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className={styles.barTrack}>
          <div className={styles.bar} style={{ width: barWidth, background: teamColor }} />
        </div>

        <div className={styles.countWrap}>
          <span className={styles.count}>{group.totalCommits}</span>
          <span className={styles.pct}>{pct}%</span>
        </div>
      </div>

      {expanded &&
        group.contributors.map((c, i) => {
          const subWidth = `${(c.commits / group.totalCommits) * 100}%`;
          const color = getAccentColor(i);
          const subPct = ((c.commits / totalCommits) * 100).toFixed(1);
          return (
            <div key={c.displayName} className={styles.memberRow}>
              <span className={styles.memberDot} style={{ color }}>·</span>
              <span className={styles.memberName}>{c.displayName}</span>
              <div className={styles.barTrack}>
                <div className={styles.bar} style={{ width: subWidth, background: color, opacity: 0.75 }} />
              </div>
              <div className={styles.countWrap}>
                <span className={styles.memberCount2}>{c.commits}</span>
                <span className={styles.pct}>{subPct}%</span>
              </div>
            </div>
          );
        })}
    </>
  );
}
