import styles from "./Header.module.css";

interface Props {
  totalContributors: number;
  totalCommits: number;
  topCommits: number;
  lastUpdated: string;
}

export function Header({ totalContributors, totalCommits, topCommits, lastUpdated }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.dots}>
        <span className={styles.dot} style={{ background: "#ff5f57" }} />
        <span className={styles.dot} style={{ background: "#febc2e" }} />
        <span className={styles.dot} style={{ background: "#28c840" }} />
        <span className={styles.title}>Frontend Framework SERVER</span>
      </div>

      <h1 className={styles.heading}>
        <span className={styles.git}>git</span> contributors
      </h1>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{totalContributors}</div>
          <div className={styles.statLabel}>AUTHORS</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{totalCommits.toLocaleString()}</div>
          <div className={styles.statLabel}>TOTAL COMMITS</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{topCommits}</div>
          <div className={styles.statLabel}>TOP CONTRIBUTOR</div>
        </div>
      </div>

      <div className={styles.updated}>Updated: {lastUpdated}</div>
    </header>
  );
}
