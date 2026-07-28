interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`bg-zinc-800/50 rounded-xl animate-pulse ${className}`} />
  );
}
