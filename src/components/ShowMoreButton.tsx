import styles from "./ShowMoreButton.module.css";

interface Props {
  shown: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}

export function ShowMoreButton({ shown, total, expanded, onToggle }: Props) {
  if (total <= shown && !expanded) return null;
  return (
    <button className={styles.btn} onClick={onToggle}>
      {expanded
        ? "▲ Show less"
        : `▼ Show all ${total} contributors`}
    </button>
  );
}
