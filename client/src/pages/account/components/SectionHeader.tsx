interface Props {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-chalk">{title}</h1>
      {subtitle && <p className="text-sm text-chalk-dim mt-1">{subtitle}</p>}
    </div>
  );
}
