"use client";

export function DetailRow({
  icon,
  label,
  value,
  accent,
  success,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  success?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span
        style={{
          color: "var(--gray-400)",
          marginTop: 1,
          width: 18,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          width: 56,
          color: "var(--gray-500)",
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: accent
            ? "var(--brand-600)"
            : success
              ? "var(--success)"
              : "var(--gray-800)",
          fontWeight: accent || success ? 600 : 400,
          flex: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
