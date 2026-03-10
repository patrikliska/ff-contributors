import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type GitIdentity } from "../data/contributors";
import styles from "./AliasTooltip.module.css";

interface Props {
  displayName: string;
  totalCommits: number;
  identities: GitIdentity[];
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function AliasTooltip({ displayName, totalCommits, identities, anchorRef }: Props) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [anchorRef]);

  return createPortal(
    <div className={styles.tooltip} style={{ top: pos.top, left: pos.left }}>
      <div className={styles.header}>
        {displayName} <span className={styles.total}>({totalCommits} total)</span>
      </div>
      <div className={styles.list}>
        {identities.map((id, i) => {
          const isLast = i === identities.length - 1;
          return (
            <div key={id.name} className={styles.row}>
              <span className={styles.branch}>{isLast ? "└" : "├"}</span>
              <span className={styles.aliasName}>{id.name}</span>
              <span className={styles.dash}>—</span>
              <span className={styles.commits}>{id.commits}</span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
