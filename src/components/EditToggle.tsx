import { useEditor } from "../context/EditorContext";
import styles from "./EditToggle.module.css";

export function EditToggle() {
  const { editMode, toggleEditMode, reset } = useEditor();

  return (
    <div className={styles.wrap}>
      {editMode && (
        <button className={styles.resetBtn} onClick={() => { if (confirm("Reset all groupings and team assignments?")) reset(); }}>
          reset all
        </button>
      )}
      <button
        className={`${styles.btn} ${editMode ? styles.active : ""}`}
        onClick={toggleEditMode}
      >
        {editMode ? "✎ editing" : "✎ manage"}
      </button>
    </div>
  );
}
