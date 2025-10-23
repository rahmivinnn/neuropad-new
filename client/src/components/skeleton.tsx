import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      animate={{
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <motion.div 
      className="neuropad-card p-5 shadow-sm rounded-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="w-24 h-2 rounded-full" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
    </motion.div>
  );
}

export function ArticleSkeleton() {
  return (
    <motion.div 
      className="neuropad-card p-5 shadow-sm rounded-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-4">
        <Skeleton className="w-24 h-24 rounded-2xl flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-5 w-4/5 mb-2 rounded" />
          <Skeleton className="h-4 w-full mb-1 rounded" />
          <Skeleton className="h-4 w-3/4 mb-3 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}