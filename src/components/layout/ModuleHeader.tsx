interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ModuleHeader({ title, subtitle, action }: ModuleHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
