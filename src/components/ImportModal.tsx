import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditor } from '../context/EditorContext';
import type { GitIdentity } from '../data/contributors';
import scriptContent from '../../scripts/export-contributors.py?raw';
import styles from './ImportModal.module.css';

function downloadScript() {
  const blob = new Blob([scriptContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contributors.py';
  a.click();
  URL.revokeObjectURL(url);
}

interface ParsedFile {
  date: string;
  generatedAt: string;
  identities: GitIdentity[];
}

function parseJsonFile(text: string): ParsedFile {
  const raw = JSON.parse(text);
  if (!Array.isArray(raw.identities)) throw new Error('Missing "identities" array');
  const identities: GitIdentity[] = raw.identities.map((r: Record<string, unknown>) => ({
    name: String(r.name ?? ''),
    commits: Number(r.commits ?? 0),
    email: r.email ? String(r.email) : undefined,
    lastCommit: r.lastCommit ? String(r.lastCommit) : undefined,
  }));
  return {
    date: String(raw.date ?? new Date().toISOString().slice(0, 10)),
    generatedAt: String(raw.generatedAt ?? ''),
    identities,
  };
}

export function ImportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={styles.triggerBtn} onClick={() => setOpen(true)}>
        ↑ import data
      </button>
      {open && createPortal(<ImportModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { importGitIdentities } = useEditor();
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadText = useCallback((text: string) => {
    try {
      setParsed(parseJsonFile(text));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setParsed(null);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => loadText(e.target?.result as string);
    reader.readAsText(file);
  }, [loadText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  async function handleConfirm() {
    if (!parsed) return;
    setSaving(true);
    setError(null);
    const err = await importGitIdentities(parsed.identities, parsed.date);
    setSaving(false);
    if (err) {
      setError(`Supabase error: ${err}`);
    } else {
      onClose();
    }
  }

  return (
    <div
      className={styles.backdrop}
      ref={backdropRef}
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>IMPORT GIT DATA</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          {/* Instructions */}
          <div className={styles.instructions}>
            <span className={styles.step}>1</span>
            <span>Download and place the script in your work folder, then run:</span>
            <div className={styles.cmdRow}>
              <code className={styles.cmd}>python3 contributors.py frontend-framework</code>
              <button className={styles.downloadBtn} onClick={downloadScript} title="Download contributors.py">
                ↓ contributors.py
              </button>
            </div>
          </div>
          <div className={styles.instructions}>
            <span className={styles.step}>2</span>
            Drop or select the generated <code className={styles.inline}>contributors.json</code> (saved next to the script).
          </div>

          {/* Drop zone */}
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''} ${parsed ? styles.dropZoneSuccess : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className={styles.fileInput}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {parsed ? (
              <span className={styles.dropSuccess}>
                ✓ {parsed.identities.length} identities loaded
                <span className={styles.dropMeta}> · generated {parsed.generatedAt}</span>
              </span>
            ) : (
              <span className={styles.dropHint}>
                {dragging ? 'Drop file here' : 'Drop contributors.json here or click to browse'}
              </span>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* Preview */}
          {parsed && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>
                {parsed.identities.length} identities · updated {parsed.date}
              </div>
              <div className={styles.previewList}>
                {parsed.identities.map((id) => (
                  <div key={id.name} className={styles.previewRow}>
                    <span className={styles.previewCommits}>{id.commits}</span>
                    <span className={styles.previewInfo}>
                      <span className={styles.previewName}>{id.name}</span>
                      {id.email && <span className={styles.previewEmail}>{id.email}</span>}
                    </span>
                    {id.lastCommit && (
                      <span className={styles.previewDate}>{id.lastCommit}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!parsed || saving}
          >
            {saving ? 'saving…' : `import ${parsed?.identities.length ?? 0} identities`}
          </button>
        </div>
      </div>
    </div>
  );
}
