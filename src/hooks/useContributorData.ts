import { useMemo } from 'react';
import { type GitIdentity, type TeamDefinition } from '../data/contributors';
import { type StoredPerson } from '../context/EditorContext';

export interface ResolvedContributor {
  displayName: string;
  commits: number;
  team?: string;
  identities: GitIdentity[];
  lastCommit?: string; // most recent YYYY-MM-DD across all identities
}

export interface TeamGroup {
  team: TeamDefinition | null;
  contributors: ResolvedContributor[];
  totalCommits: number;
}

export function useContributorData(storedPeople: StoredPerson[], teams: TeamDefinition[], gitIdentities: GitIdentity[]) {
  return useMemo(() => {
    const identityMap = new Map<string, GitIdentity>();
    for (const id of gitIdentities) identityMap.set(id.name, id);

    const claimed = new Set<string>();
    const resolved: ResolvedContributor[] = [];

    for (const person of storedPeople) {
      const identities: GitIdentity[] = [];
      let commits = 0;
      for (const gitName of person.gitNames) {
        const id = identityMap.get(gitName);
        if (id) { identities.push(id); commits += id.commits; claimed.add(gitName); }
      }
      if (identities.length > 0) {
        const lastCommit = identities.map((i) => i.lastCommit).filter(Boolean).sort().at(-1);
        resolved.push({ displayName: person.displayName, commits, team: person.team, identities, lastCommit });
      }
    }

    for (const id of gitIdentities) {
      if (!claimed.has(id.name)) {
        resolved.push({ displayName: id.name, commits: id.commits, team: undefined, identities: [id], lastCommit: id.lastCommit });
      }
    }

    const contributors = resolved.sort((a, b) => b.commits - a.commits);
    const totalCommits = contributors.reduce((s, c) => s + c.commits, 0);
    const topCommits = contributors[0]?.commits ?? 0;

    const teamGroups: TeamGroup[] = [];
    for (const teamDef of teams) {
      const members = contributors.filter((c) => c.team === teamDef.name);
      if (members.length === 0) continue;
      teamGroups.push({ team: teamDef, contributors: members, totalCommits: members.reduce((s, c) => s + c.commits, 0) });
    }
    const unassigned = contributors.filter((c) => !c.team);
    if (unassigned.length > 0) {
      teamGroups.push({ team: null, contributors: unassigned, totalCommits: unassigned.reduce((s, c) => s + c.commits, 0) });
    }
    teamGroups.sort((a, b) => b.totalCommits - a.totalCommits);

    return { contributors, totalCommits, topCommits, totalContributors: contributors.length, teamGroups };
  }, [storedPeople, teams, gitIdentities]);
}
