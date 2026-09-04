const KEY = "five-loves-progress-v1";

export type Saved = {
  picks: string[];
  index: number;
};

export function loadProgress(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Saved;
    if (!Array.isArray(data.picks) || typeof data.index !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export function saveProgress(picks: string[], index: number) {
  localStorage.setItem(KEY, JSON.stringify({ picks, index } satisfies Saved));
}

export function clearProgress() {
  localStorage.removeItem(KEY);
}
