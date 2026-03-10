// ─────────────────────────────────────────────────────────────
// Paste the output of:
//   git shortlog -sne --all --no-merges
// One entry per raw git identity, exactly as it appears.
// ─────────────────────────────────────────────────────────────
export interface GitIdentity {
  name: string;
  commits: number;
  email?: string;
  lastCommit?: string; // YYYY-MM-DD
}

export const GIT_IDENTITIES: GitIdentity[] = [
  { name: "David Krpec",        commits: 215 },
  { name: "David",              commits: 157 },
  { name: "Skarabela",          commits: 107 },
  { name: "Tadeas Jindra",      commits: 107 },
  { name: "Michael Polivka",    commits: 101 },
  { name: "Roman Polak",        commits: 90  },
  { name: "Martin",             commits: 84  },
  { name: "Patrik Liška",       commits: 84  },
  { name: "david.slaby",        commits: 68  },
  { name: "Michal Kopcil",      commits: 61  },
  { name: "Honza Kovář",        commits: 59  },
  { name: "MartinSkarabela",    commits: 57  },
  { name: "honzaKovar",         commits: 47  },
  { name: "Vojtech Fadrny",     commits: 46  },
  { name: "Michael",            commits: 44  },
  { name: "lukas.philipp",      commits: 40  },
  { name: "Jiri Zalud",         commits: 29  },
  { name: "Victoria Rodriguez", commits: 13  },
  { name: "AlfonsZelicko",      commits: 10  },
  { name: "Jiri Zelenka",       commits: 10  },
  { name: "Ondrej Vagner",      commits: 10  },
  { name: "Silvia Sojčáková",   commits: 10  },
  { name: "Alfons Zelicko",     commits: 9   },
  { name: "Patrik Křemeček",    commits: 9   },
  { name: "Jan Kovac",          commits: 7   },
  { name: "Lukáš Philipp",      commits: 7   },
  { name: "MichalKopcil",       commits: 7   },
  { name: "Vojtěch Šanda",      commits: 7   },
  { name: "Honza Kovar",        commits: 6   },
  { name: "Ján Kováč",          commits: 6   },
  { name: "Silvia Sojcakova",   commits: 6   },
  { name: "Dmytro Kranin",      commits: 4   },
  { name: "Krzysztof Majda",    commits: 3   },
  { name: "Martin Vana",        commits: 3   },
  { name: "mskara",             commits: 3   },
  { name: "Michael Polívka",    commits: 2   },
  { name: "Patrik",             commits: 2   },
  { name: "Tomas Turan",        commits: 2   },
  { name: "David Slabý",        commits: 1   },
  { name: "Jana Ziková",        commits: 1   },
  { name: "Martin Skarabela",   commits: 1   },
  { name: "Michal Kopčil",      commits: 1   },
  { name: "Ondrej Mikula",      commits: 1   },
  { name: "Ondrej Molnar",      commits: 1   },
  { name: "alfons zelicko",     commits: 1   },
];

// Teams are now managed in the app UI and stored in localStorage.
// This interface is kept for type sharing.
export interface TeamDefinition {
  name: string;
  color: string;
}

export const LAST_UPDATED = "2026-03-10";
