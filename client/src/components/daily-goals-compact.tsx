import { motion } from "framer-motion";
import { Droplets, Footprints, Utensils, RotateCcw } from "lucide-react";

interface DailyGoalsCompactProps {
  hydrationProgress?: number;
  walkingProgress?: number;
  saltProgress?: number;
  onRefresh?: () => void;
}

export default function DailyGoalsCompact({
  hydrationProgress = 0,
  walkingProgress = 0,
  saltProgress = 0,
  onRefresh,
}: DailyGoalsCompactProps) {
  
  const goals = [
    {
      label: "Hydration",
      progress: hydrationProgress,
      color: "bg-blue-500",
      bgColor: "bg-blue-100",
      icon: Droplets,
      iconColor: "text-blue-600",
    },
    {
      label: "Walking",
      progress: walkingProgress,
      color: "bg-[#FDD835]",
      bgColor: "bg-yellow-100",
      icon: Footprints,
      iconColor: "text-yellow-600",
    },
    {
      label: "Salt",
      progress: saltProgress,
      color: "bg-gray-400",
      bgColor: "bg-gray-100",
      icon: Utensils,
      iconColor: "text-gray-600",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-[hsl(45,15%,15%)]">Today's Progress</span>
        {onRefresh && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRefresh}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Refresh goals"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
          </motion.button>
        )}
      </div>
      
      <div className="space-y-3">
        {goals.map((goal, index) => {
          const Icon = goal.icon;
          return (
            <motion.div
              key={goal.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full ${goal.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${goal.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[hsl(45,15%,15%)]">{goal.label}</span>
                  <span className="text-sm font-bold text-[hsl(45,15%,15%)] tabular-nums">{goal.progress}%</span>
                </div>
                <div className={`h-2 ${goal.bgColor} rounded-full overflow-hidden`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ 
                      duration: 1, 
                      delay: index * 0.1 + 0.2, 
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 100
                    }}
                    className={`h-full ${goal.color} rounded-full relative`}
                  >
                    {/* Animated pulse effect at the end of progress bar */}
                    <motion.div
                      className="absolute right-0 top-0 w-2 h-2 rounded-full bg-white shadow-sm"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 0.3, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}