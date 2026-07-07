"use client";

export function Card({
  value,
  selected,
  disabled,
  onClick,
}: {
  value: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`h-20 w-14 shrink-0 rounded-xl text-xl font-black shadow-lg transition-all duration-150 sm:h-24 sm:w-16 sm:text-2xl ${
        selected
          ? "-translate-y-3 bg-gradient-to-br from-fuchsia-400 to-violet-500 text-white shadow-fuchsia-500/50 ring-2 ring-fuchsia-300"
          : "bg-white text-violet-900 ring-1 ring-violet-200 hover:-translate-y-1.5 hover:shadow-xl"
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
    >
      {value}
    </button>
  );
}
