interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, unit, subtext, icon, color = "text-accent" }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            {unit && <span className="text-sm text-muted">{unit}</span>}
          </div>
          {subtext && <p className="text-xs text-muted mt-1">{subtext}</p>}
        </div>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
    </Card>
  );
}
