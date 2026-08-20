export function LearningProgress({ current, total, phase }: { current: number; total: number; phase?: string }) {
  const progress = Math.round(current / Math.max(1, total) * 100);
  return <div className="learn-progress" aria-live="polite"><span>{phase ?? `問題 ${current} / ${total}`}</span><div className="progress-track" aria-label={`学習進捗 ${progress}%`}><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>;
}
