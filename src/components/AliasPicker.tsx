import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor } from "../context/EditorContext";
import styles from "./AliasPicker.module.css";

interface Props {
  targetDisplayName: string;
  currentGitNames: string[];
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function AliasPicker({ targetDisplayName, currentGitNames, anchorRef, onClose }: Props) {
  const { storedPeople, mergeInto, gitIdentities } = useEditor();
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [anchorRef]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const claimedNames = new Set(storedPeople.flatMap((p) => p.gitNames));
  const currentSet = new Set(currentGitNames);

  const q = query.toLowerCase();
  const available = gitIdentities.filter((id) => {
    if (currentSet.has(id.name)) return false;
    if (claimedNames.has(id.name)) return false;
    if (q && !id.name.toLowerCase().includes(q) && !id.email?.toLowerCase().includes(q)) return false;
    return true;
  });

  return createPortal(
    <div
      ref={containerRef}
      className={styles.picker}
      style={{ top: pos.top, left: pos.left }}
    >
      <input
        ref={inputRef}
        className={styles.search}
        placeholder="Search git identity…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.list}>
        {available.length === 0 && (
          <div className={styles.empty}>No unclaimed identities</div>
        )}
        {available.map((id) => (
          <button
            key={id.name}
            className={styles.item}
            onMouseDown={(e) => {
              e.preventDefault();
              mergeInto(targetDisplayName, id.name);
              onClose();
            }}
          >
            <span className={styles.itemInfo}>
              <span className={styles.itemName}>{id.name}</span>
              {id.email && <span className={styles.itemEmail}>{id.email}</span>}
            </span>
            <span className={styles.itemCommits}>{id.commits}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
