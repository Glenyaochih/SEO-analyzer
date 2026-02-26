function getCategory(score: number): 'CRITICAL' | 'WARNING' | 'PASSED' {
  if (score < 50) return 'CRITICAL';
  if (score < 80) return 'WARNING';
  return 'PASSED';
}

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const category = getCategory(score);

  const colorMap = {
    CRITICAL: 'bg-critical-bg text-critical border border-critical/30',
    WARNING: 'bg-warning-bg text-warning border border-warning/30',
    PASSED: 'bg-passed-bg text-passed border border-passed/30',
  };

  const sizeMap = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${colorMap[category]} ${sizeMap[size]}`}
    >
      {score}
    </span>
  );
}
