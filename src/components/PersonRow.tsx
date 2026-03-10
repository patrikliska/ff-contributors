import { useState, useRef } from 'react';
import { type ResolvedContributor } from '../hooks/useContributorData';
import { useEditor } from '../context/EditorContext';
import { AliasTooltip } from './AliasTooltip';
import { AliasPicker } from './AliasPicker';
import styles from './PersonRow.module.css';

interface Props {
  contributor: ResolvedContributor;
  rank: number;
  maxCommits: number;
  totalCommits: number;
  accentColor: string;
  animationDelay: number;
}

export function PersonRow({ contributor, rank, maxCommits, totalCommits, accentColor, animationDelay }: Props) {
  const { editMode, setTeam, rename, removeAlias, splitPerson, teams } = useEditor();

  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showAliasPicker, setShowAliasPicker] = useState(false);
  const [renameValue, setRenameValue] = useState(contributor.displayName);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addAliasBtnRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  const barWidth = `${(contributor.commits / maxCommits) * 100}%`;
  const pct = ((contributor.commits / totalCommits) * 100).toFixed(1);
  const hasMultipleIdentities = contributor.identities.length > 1;
  const currentGitNames = contributor.identities.map((id) => id.name);
  // Primary git name = the one matching displayName, or first
  const primaryGitName = currentGitNames.find((n) => n === contributor.displayName) ?? currentGitNames[0];

  const handleMouseEnter = () => {
    setHovered(true);
    if (hasMultipleIdentities && !editMode) {
      tooltipTimer.current = setTimeout(() => setShowTooltip(true), 300);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setShowTooltip(false);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
  };

  const handleRename = () => {
    rename(contributor.displayName, renameValue.trim());
  };

  return (
    <div
      className={styles.wrapper}
      style={{
        animationDelay: `${animationDelay}ms`,
        zIndex: editOpen || showTooltip ? 50 : undefined,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main row */}
      <div className={`${styles.row} ${editOpen ? styles.rowActive : ''}`}>
        <span className={styles.rank}>{String(rank).padStart(2, '0')}</span>

        <div className={styles.nameWrap}>
          <span ref={nameRef} className={styles.name} style={{ color: hovered ? accentColor : undefined }}>
            {contributor.displayName}
          </span>
          {contributor.lastCommit && <span className={styles.lastCommit}>{contributor.lastCommit}</span>}
          {showTooltip && hasMultipleIdentities && (
            <AliasTooltip displayName={contributor.displayName} totalCommits={contributor.commits} identities={contributor.identities} anchorRef={nameRef} />
          )}
        </div>

        <div className={styles.barTrack}>
          <div
            className={styles.bar}
            style={{
              width: barWidth,
              background: accentColor,
              boxShadow: hovered ? `0 0 14px ${accentColor}99` : undefined,
            }}
          />
        </div>

        <div className={styles.countWrap}>
          <span className={styles.count} style={{ color: hovered ? accentColor : undefined }}>
            {contributor.commits}
          </span>
          <span className={styles.pct}>{pct}%</span>
        </div>

        {editMode && (
          <button
            className={`${styles.editBtn} ${editOpen ? styles.editBtnActive : ''}`}
            onClick={() => {
              setEditOpen((o) => !o);
              setShowAliasPicker(false);
              setRenameValue(contributor.displayName);
            }}
            title='Edit person'
          >
            ✎
          </button>
        )}
      </div>

      {/* Edit panel */}
      {editOpen && editMode && (
        <div className={styles.editPanel}>
          {/* Rename */}
          <div className={styles.editRow}>
            <span className={styles.editLabel}>NAME</span>
            <input
              className={styles.renameInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
            />
            <button className={styles.saveBtn} onClick={handleRename}>
              save
            </button>
          </div>

          {/* Team picker */}
          <div className={styles.editRow}>
            <span className={styles.editLabel}>TEAM</span>
            <div className={styles.teamPills}>
              {teams.map((t) => (
                <button
                  key={t.name}
                  className={`${styles.teamPill} ${contributor.team === t.name ? styles.teamPillActive : ''}`}
                  style={contributor.team === t.name ? { borderColor: t.color, color: t.color } : undefined}
                  onClick={() => setTeam(contributor.displayName, contributor.team === t.name ? undefined : t.name)}
                >
                  {t.name}
                </button>
              ))}
              {contributor.team && (
                <button className={styles.clearTeam} onClick={() => setTeam(contributor.displayName, undefined)}>
                  ✕ clear
                </button>
              )}
            </div>
          </div>

          {/* Aliases */}
          <div className={styles.editRow}>
            <span className={styles.editLabel}>ALIASES</span>
            <div className={styles.aliasChips}>
              {contributor.identities.map((id) => (
                <span key={id.name} className={styles.chip}>
                  <span className={styles.chipInfo}>
                    <span className={styles.chipName}>{id.name}</span>
                    {id.email && <span className={styles.chipEmail}>{id.email}</span>}
                  </span>
                  <span className={styles.chipCommits}>{id.commits}</span>
                  {id.name !== primaryGitName && (
                    <button className={styles.chipRemove} onClick={() => removeAlias(contributor.displayName, id.name)} title='Remove alias'>
                      ✕
                    </button>
                  )}
                </span>
              ))}

              <div className={styles.addAliasWrap}>
                <button ref={addAliasBtnRef} className={styles.addAliasBtn} onClick={() => setShowAliasPicker((s) => !s)}>
                  + add alias
                </button>
                {showAliasPicker && (
                  <AliasPicker targetDisplayName={contributor.displayName} currentGitNames={currentGitNames} anchorRef={addAliasBtnRef} onClose={() => setShowAliasPicker(false)} />
                )}
              </div>
            </div>
          </div>

          {/* Split (reset) */}
          {hasMultipleIdentities && (
            <div className={styles.editFooter}>
              <button
                className={styles.splitBtn}
                onClick={() => {
                  splitPerson(contributor.displayName);
                  setEditOpen(false);
                }}
              >
                ⚡ split all aliases back to individual entries
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
