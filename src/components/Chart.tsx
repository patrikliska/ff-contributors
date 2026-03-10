import { useState } from "react";
import { useEditor } from "../context/EditorContext";
import { useContributorData } from "../hooks/useContributorData";
import { PersonRow } from "./PersonRow";
import { TeamRow } from "./TeamRow";
import { ShowMoreButton } from "./ShowMoreButton";
import { getAccentColor } from "../utils/colors";
import styles from "./Chart.module.css";

const INITIAL_SHOWN = 16;

interface Props {
  view: "people" | "teams";
}

export function Chart({ view }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { storedPeople, teams, gitIdentities } = useEditor();
  const { contributors, totalCommits, teamGroups } = useContributorData(storedPeople, teams, gitIdentities);

  const maxCommits = contributors[0]?.commits ?? 1;
  const shown = expanded ? contributors.length : INITIAL_SHOWN;

  return (
    <div className={styles.chart}>
      <div className={styles.prompt}>
        $ git shortlog -sne --all<span className={styles.cursor}>_</span>
      </div>

      <div className={styles.content}>
        {view === "people" ? (
          <>
            {contributors.slice(0, shown).map((c, i) => (
              <PersonRow
                key={c.displayName}
                contributor={c}
                rank={i + 1}
                maxCommits={maxCommits}
                totalCommits={totalCommits}
                accentColor={getAccentColor(i)}
                animationDelay={(expanded && i >= INITIAL_SHOWN ? i - INITIAL_SHOWN : i) * 40}
              />
            ))}
            <ShowMoreButton
              shown={INITIAL_SHOWN}
              total={contributors.length}
              expanded={expanded}
              onToggle={() => setExpanded((e) => !e)}
            />
          </>
        ) : (
          <>
            {teamGroups.map((group, i) => (
              <TeamRow
                key={group.team?.name ?? "unassigned"}
                group={group}
                maxCommits={teamGroups[0]?.totalCommits ?? 1}
                totalCommits={totalCommits}
                animationDelay={i * 60}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
