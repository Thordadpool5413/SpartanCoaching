type ContinuityListener = () => void;

const listeners = new Set<ContinuityListener>();

export function onContinuityChanged(listener: ContinuityListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markContinuityChanged(): void {
  for (const listener of listeners) listener();
}