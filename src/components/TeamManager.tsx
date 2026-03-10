import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor } from '../context/EditorContext';
import styles from './TeamManager.module.css';

const PRESET_COLORS = [
  '#00f0ff', '#ff3e6c', '#22d65e', '#facc15', '#a855f7',
  '#f97316', '#3b82f6', '#f472b6', '#14b8a6', '#e879f9',
  '#fb7185', '#38bdf8', '#4ade80', '#818cf8', '#fbbf24',
];

interface Props {
  onClose: () => void;
}

function TeamManagerModal({ onClose }: Props) {
  const { teams, addTeam, removeTeam, updateTeam } = useEditor();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEdit = (name: string, color: string) => {
    setEditingName(name);
    setEditName(name);
    setEditColor(color);
  };

  const confirmEdit = () => {
    if (editingName) updateTeam(editingName, editName, editColor);
    setEditingName(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addTeam(newName.trim(), newColor);
    setNewName('');
    setNewColor(PRESET_COLORS[(teams.length + 1) % PRESET_COLORS.length]);
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>MANAGE TEAMS</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Existing teams */}
        <div className={styles.list}>
          {teams.length === 0 && (
            <div className={styles.empty}>No teams yet — create one below</div>
          )}
          {teams.map((t) => (
            <div key={t.name} className={styles.teamItem}>
              {editingName === t.name ? (
                <>
                  <ColorDot color={editColor} />
                  <input
                    className={styles.editInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingName(null); }}
                    autoFocus
                  />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <button className={styles.saveBtn} onClick={confirmEdit}>save</button>
                  <button className={styles.cancelBtn} onClick={() => setEditingName(null)}>cancel</button>
                </>
              ) : (
                <>
                  <ColorDot color={t.color} />
                  <span className={styles.teamName} style={{ color: t.color }}>{t.name}</span>
                  <button className={styles.editBtn} onClick={() => startEdit(t.name, t.color)}>edit</button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => { if (confirm(`Remove team "${t.name}"? Members will be unassigned.`)) removeTeam(t.name); }}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new team */}
        <div className={styles.addSection}>
          <span className={styles.addLabel}>NEW TEAM</span>
          <div className={styles.addRow}>
            <ColorDot color={newColor} />
            <input
              className={styles.nameInput}
              placeholder="Team name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <ColorPicker value={newColor} onChange={setNewColor} />
            <button className={styles.addBtn} onClick={handleAdd} disabled={!newName.trim()}>
              + add
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ColorDot({ color }: { color: string }) {
  return <span className={styles.dot} style={{ background: color }} />;
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.colorPicker}>
      <div className={styles.presets}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            className={`${styles.preset} ${value === c ? styles.presetActive : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
      </div>
      <input
        ref={inputRef}
        type="color"
        className={styles.colorInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title="Custom color"
      />
    </div>
  );
}

export function TeamManagerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={styles.triggerBtn} onClick={() => setOpen(true)}>
        ⊞ teams
      </button>
      {open && <TeamManagerModal onClose={() => setOpen(false)} />}
    </>
  );
}
