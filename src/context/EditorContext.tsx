import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { GIT_IDENTITIES, LAST_UPDATED, type GitIdentity, type TeamDefinition } from '../data/contributors';

export interface StoredPerson {
  displayName: string;
  gitNames: string[];
  team?: string;
}

interface EditorCtx {
  isLoading: boolean;
  editMode: boolean;
  toggleEditMode: () => void;
  // Git identities
  gitIdentities: GitIdentity[];
  lastUpdated: string;
  importGitIdentities: (identities: GitIdentity[], date: string) => Promise<string | null>; // returns error message or null
  // People
  storedPeople: StoredPerson[];
  setTeam: (displayName: string, team: string | undefined) => void;
  rename: (oldDisplayName: string, newDisplayName: string) => void;
  mergeInto: (targetDisplayName: string, absorbGitName: string) => void;
  removeAlias: (displayName: string, gitName: string) => void;
  splitPerson: (displayName: string) => void;
  reset: () => void;
  // Teams
  teams: TeamDefinition[];
  addTeam: (name: string, color: string) => Promise<void>;
  removeTeam: (name: string) => void;
  updateTeam: (oldName: string, newName: string, newColor: string) => void;
}

const Ctx = createContext<EditorCtx | null>(null);

// ── Supabase helpers ──────────────────────────────────────────

function toStoredPerson(row: { display_name: string; git_names: string[]; team: string | null }): StoredPerson {
  return { displayName: row.display_name, gitNames: row.git_names, team: row.team ?? undefined };
}

async function upsertPerson(p: StoredPerson) {
  await supabase.from('people').upsert(
    { display_name: p.displayName, git_names: p.gitNames, team: p.team ?? null },
    { onConflict: 'display_name' }
  );
}

async function deletePerson(displayName: string) {
  await supabase.from('people').delete().eq('display_name', displayName);
}

// ─────────────────────────────────────────────────────────────

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [storedPeople, setStoredPeople] = useState<StoredPerson[]>([]);
  const [teams, setTeams] = useState<TeamDefinition[]>([]);
  const [gitIdentities, setGitIdentities] = useState<GitIdentity[]>(GIT_IDENTITIES);
  const [lastUpdated, setLastUpdated] = useState(LAST_UPDATED);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      const [{ data: teamsData }, { data: peopleData }, { data: identitiesData }, { data: metaData }] =
        await Promise.all([
          supabase.from('teams').select('name, color').order('name'),
          supabase.from('people').select('display_name, git_names, team'),
          supabase.from('git_identities').select('name, commits, email, last_commit').order('commits', { ascending: false }),
          supabase.from('metadata').select('key, value'),
        ]);
      if (teamsData) setTeams(teamsData as TeamDefinition[]);
      if (peopleData) setStoredPeople(peopleData.map(toStoredPerson));
      if (identitiesData && identitiesData.length > 0) {
        setGitIdentities(identitiesData.map((r) => ({
          name: r.name,
          commits: r.commits,
          email: r.email ?? undefined,
          lastCommit: r.last_commit ?? undefined,
        })));
      }
      const lastUpdatedMeta = (metaData ?? []).find((m) => m.key === 'last_updated');
      if (lastUpdatedMeta) setLastUpdated(lastUpdatedMeta.value);
      setIsLoading(false);
    }
    load();
  }, []);

  const toggleEditMode = useCallback(() => setEditMode((m) => !m), []);

  const importGitIdentities = useCallback(async (identities: GitIdentity[], date: string): Promise<string | null> => {
    // Deduplicate by name (same name, different email) — sum commits, keep most recent lastCommit
    const merged = new Map<string, GitIdentity>();
    for (const id of identities) {
      const existing = merged.get(id.name);
      if (existing) {
        merged.set(id.name, {
          ...existing,
          commits: existing.commits + id.commits,
          lastCommit: [existing.lastCommit, id.lastCommit].filter(Boolean).sort().at(-1),
        });
      } else {
        merged.set(id.name, { ...id });
      }
    }
    const deduped = Array.from(merged.values());

    // Insert/upsert first — verify it works before touching existing data
    const rows = deduped.map((id) => ({
      name: id.name,
      commits: id.commits,
      email: id.email ?? null,
      last_commit: id.lastCommit ?? null,
    }));
    const { error: upsertErr } = await supabase
      .from('git_identities')
      .upsert(rows, { onConflict: 'name' });
    if (upsertErr) return upsertErr.message;

    // Remove any rows no longer in the new dataset
    const newNames = identities.map((id) => id.name);
    const { error: deleteErr } = await supabase
      .from('git_identities')
      .delete()
      .not('name', 'in', `(${newNames.map((n) => `"${n}"`).join(',')})`);
    if (deleteErr) return deleteErr.message;

    const { error: metaErr } = await supabase
      .from('metadata')
      .upsert({ key: 'last_updated', value: date }, { onConflict: 'key' });
    if (metaErr) return metaErr.message;

    setGitIdentities(deduped);
    setLastUpdated(date);
    return null;
  }, []);

  // ── People actions ────────────────────────────────────────

  const setTeam = useCallback((displayName: string, team: string | undefined) => {
    const existing = storedPeople.find((p) => p.displayName === displayName);
    if (!existing && !team) return;
    if (!existing) {
      const newPerson: StoredPerson = { displayName, gitNames: [displayName], team };
      setStoredPeople((prev) => [...prev, newPerson]);
      upsertPerson(newPerson);
    } else {
      const updated = { ...existing, team };
      if (!team && updated.gitNames.length <= 1 && updated.gitNames[0] === displayName) {
        setStoredPeople((prev) => prev.filter((p) => p.displayName !== displayName));
        deletePerson(displayName);
      } else {
        setStoredPeople((prev) => prev.map((p) => p.displayName === displayName ? updated : p));
        upsertPerson(updated);
      }
    }
  }, [storedPeople]);

  const rename = useCallback((oldDisplayName: string, newDisplayName: string) => {
    const trimmed = newDisplayName.trim();
    if (!trimmed || trimmed === oldDisplayName) return;
    const existing = storedPeople.find((p) => p.displayName === oldDisplayName);
    const updated: StoredPerson = existing
      ? { ...existing, displayName: trimmed }
      : { displayName: trimmed, gitNames: [oldDisplayName], team: undefined };
    setStoredPeople((prev) => prev.filter((p) => p.displayName !== oldDisplayName).concat(updated));
    upsertPerson(updated).then(() => deletePerson(oldDisplayName));
  }, [storedPeople]);

  const mergeInto = useCallback((targetDisplayName: string, absorbGitName: string) => {
    const cleaned = storedPeople
      .map((p) => ({ ...p, gitNames: p.gitNames.filter((n) => n !== absorbGitName) }))
      .filter((p) => p.gitNames.length > 0 || p.team);
    const existing = cleaned.find((p) => p.displayName === targetDisplayName);
    const updated: StoredPerson = existing
      ? { ...existing, gitNames: [...existing.gitNames, absorbGitName] }
      : { displayName: targetDisplayName, gitNames: [targetDisplayName, absorbGitName], team: undefined };
    const orphaned = storedPeople.find(
      (p) => p.gitNames.includes(absorbGitName) && p.displayName !== targetDisplayName
    );
    setStoredPeople(cleaned.filter((p) => p.displayName !== targetDisplayName).concat(updated));
    if (orphaned) {
      const orphanUpdated = cleaned.find((p) => p.displayName === orphaned.displayName);
      if (orphanUpdated) upsertPerson(orphanUpdated); else deletePerson(orphaned.displayName);
    }
    upsertPerson(updated);
  }, [storedPeople]);

  const removeAlias = useCallback((displayName: string, gitName: string) => {
    const updated = storedPeople.map((p) =>
      p.displayName === displayName ? { ...p, gitNames: p.gitNames.filter((n) => n !== gitName) } : p
    );
    const person = updated.find((p) => p.displayName === displayName);
    if (!person) return;
    if (person.gitNames.length <= 1 && !person.team) {
      setStoredPeople(updated.filter((p) => p.displayName !== displayName));
      deletePerson(displayName);
    } else {
      setStoredPeople(updated);
      upsertPerson(person);
    }
  }, [storedPeople]);

  const splitPerson = useCallback((displayName: string) => {
    deletePerson(displayName);
    setStoredPeople((prev) => prev.filter((p) => p.displayName !== displayName));
  }, []);

  const reset = useCallback(async () => {
    await Promise.all([
      supabase.from('people').delete().neq('display_name', ''),
      supabase.from('teams').delete().neq('name', ''),
    ]);
    setStoredPeople([]);
    setTeams([]);
  }, []);

  // ── Team actions ──────────────────────────────────────────

  const addTeam = useCallback(async (name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed || teams.some((t) => t.name === trimmed)) return;
    const { error } = await supabase.from('teams').insert({ name: trimmed, color });
    if (error) { console.error('[addTeam] Supabase error:', error); return; }
    setTeams((prev) => [...prev, { name: trimmed, color }]);
  }, [teams]);

  const removeTeam = useCallback((name: string) => {
    const updatedPeople = storedPeople.map((p) => (p.team === name ? { ...p, team: undefined } : p));
    const toUpsert = updatedPeople.filter((p) => {
      const was = storedPeople.find((x) => x.displayName === p.displayName);
      return was?.team === name;
    });
    setTeams((prev) => prev.filter((t) => t.name !== name));
    setStoredPeople(updatedPeople.filter((p) => !(p.gitNames.length <= 1 && !p.team && p.gitNames[0] === p.displayName)));
    toUpsert.forEach(upsertPerson);
    supabase.from('teams').delete().eq('name', name);
  }, [storedPeople]);

  const updateTeam = useCallback(async (oldName: string, newName: string, newColor: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setTeams((prev) => prev.map((t) => (t.name === oldName ? { name: trimmed, color: newColor } : t)));
    if (trimmed !== oldName) {
      setStoredPeople((prev) => prev.map((p) => (p.team === oldName ? { ...p, team: trimmed } : p)));
      // Rename in DB: insert new, re-assign people, delete old
      await supabase.from('teams').insert({ name: trimmed, color: newColor });
      await supabase.from('people').update({ team: trimmed }).eq('team', oldName);
      await supabase.from('teams').delete().eq('name', oldName);
    } else {
      await supabase.from('teams').update({ color: newColor }).eq('name', oldName);
    }
  }, []);

  return (
    <Ctx.Provider value={{
      isLoading, editMode, toggleEditMode,
      gitIdentities, lastUpdated, importGitIdentities,
      storedPeople, setTeam, rename, mergeInto, removeAlias, splitPerson, reset,
      teams, addTeam, removeTeam, updateTeam,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEditor(): EditorCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEditor must be inside EditorProvider');
  return ctx;
}
