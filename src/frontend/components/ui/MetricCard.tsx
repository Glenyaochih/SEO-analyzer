interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'critical' | 'warning' | 'passed';
}

export function MetricCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: MetricCardProps) {
  const borderMap = {
    default: 'border-gray-200 dark:border-gray-700',
    critical: 'border-critical/30',
    warning: 'border-warning/30',
    passed: 'border-passed/30',
  };

  const bgMap = {
    default: 'bg-white dark:bg-gray-800',
    critical: 'bg-critical-bg dark:bg-gray-800',
    warning: 'bg-warning-bg dark:bg-gray-800',
    passed: 'bg-passed-bg dark:bg-gray-800',
  };

  const valueColorMap = {
    default: 'text-gray-900 dark:text-white',
    critical: 'text-critical',
    warning: 'text-warning',
    passed: 'text-passed',
  };

  return (
    <div
      className={`rounded-xl border p-5 ${bgMap[variant]} ${borderMap[variant]}`}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColorMap[variant]}`}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
