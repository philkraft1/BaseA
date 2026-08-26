export function DueLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-cyan-700 dark:fill-cyan-500" />
      <rect
        x="8"
        y="9"
        width="16"
        height="15"
        rx="2.5"
        className="fill-white dark:fill-cyan-50"
      />
      <path
        d="M11 9V7.5M21 9V7.5"
        className="stroke-cyan-800 dark:stroke-cyan-700"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="11" y="13" width="4" height="3" rx="0.6" className="fill-cyan-500" />
      <rect x="17" y="13" width="4" height="3" rx="0.6" className="fill-cyan-200" />
      <rect x="11" y="18" width="10" height="2.2" rx="0.6" className="fill-cyan-700" />
    </svg>
  )
}
