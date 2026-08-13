export function FloatLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-cyan-700 dark:fill-cyan-500" />
      <ellipse
        cx="16"
        cy="22.5"
        rx="9"
        ry="2.6"
        className="fill-cyan-200/70 dark:fill-cyan-950/50"
      />
      <circle cx="16" cy="13" r="6.2" className="fill-white dark:fill-cyan-50" />
      <circle cx="16" cy="13" r="3.4" className="fill-cyan-400" />
      <path
        d="M13.2 13.1h5.6M16 10.4v5.4"
        className="stroke-white"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}
