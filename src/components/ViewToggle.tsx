import styles from "./ViewToggle.module.css";

interface Props {
  view: "people" | "teams";
  onChange: (v: "people" | "teams") => void;
}

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.btn} ${view === "people" ? styles.active : ""}`}
        onClick={() => onChange("people")}
      >
        People
      </button>
      <span className={styles.sep}>○</span>
      <button
        className={`${styles.btn} ${view === "teams" ? styles.active : ""}`}
        onClick={() => onChange("teams")}
      >
        Teams
      </button>
    </div>
  );
}
