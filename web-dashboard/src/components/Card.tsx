import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'red' | 'yellow' | 'none';
}

export default function Card({ children, className, glowColor = 'none' }: CardProps) {
  const glowVariants = {
    blue: 'shadow-[0_0_15px_rgba(59,130,246,0.15)] border-blue-500/20',
    red: 'shadow-[0_0_15px_rgba(239,68,68,0.15)] border-red-500/20',
    yellow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)] border-yellow-500/20',
    none: 'border-slate-700/50',
  };

  return (
    <div className={twMerge(
      clsx(
        "bg-slate-800/40 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300",
        glowVariants[glowColor],
        className
      )
    )}>
      {children}
    </div>
  );
}
