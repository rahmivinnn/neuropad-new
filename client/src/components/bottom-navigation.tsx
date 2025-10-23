import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, Calendar, Clipboard, Settings, Bluetooth } from "lucide-react";

interface BottomNavigationProps {
  currentPage: string;
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const isActive = (path: string) => currentPage === path;

  const sideNavItems = [
    { path: "/", icon: Home, testId: "nav-home", side: "left" as const },
    { path: "/prevention-tips", icon: Calendar, testId: "nav-calendar", side: "left" as const },
    { path: "/caregiver-network", icon: Clipboard, testId: "nav-clipboard", side: "right" as const },
    { path: "/health-tracker", icon: Settings, testId: "nav-settings", side: "right" as const },
  ];

  const centerButton = { path: "/bluetooth-device", icon: Bluetooth, testId: "nav-bluetooth" };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        {/* Custom curved background with notch for center button */}
        <div className="relative h-20">
          {/* Simple curved background using CSS */}
          <div className="absolute bottom-0 w-full h-16 bg-white dark:bg-gray-900 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            {/* Center notch curve */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-24 h-16 bg-transparent">
              <svg className="w-full h-full" viewBox="0 0 100 70" preserveAspectRatio="none">
                <path
                  d="M 0,70 Q 0,20 30,10 Q 50,0 70,10 Q 100,20 100,70 Z"
                  className="fill-white dark:fill-gray-900"
                />
              </svg>
            </div>
          </div>

          {/* Navigation items container */}
          <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center">
            <div className="w-full flex justify-around items-center px-4">
              {/* Left side buttons */}
              <div className="flex-1 flex justify-around">
                {sideNavItems
                  .filter(item => item.side === "left")
                  .map(({ path, icon: Icon, testId }) => {
                    const active = isActive(path);
                    return (
                      <Link key={path} to={path}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex flex-col items-center gap-1 p-2"
                          data-testid={testId}
                          aria-current={active ? "page" : undefined}
                        >
                          <motion.div
                            animate={{
                              y: active ? -3 : 0,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            <Icon 
                              className={`w-6 h-6 transition-colors ${active ? "text-primary" : "text-gray-400"}`}
                              strokeWidth={active ? 2.5 : 2}
                            />
                          </motion.div>
                          {active && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="w-1 h-1 rounded-full bg-primary"
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}
                        </motion.button>
                      </Link>
                    );
                  })}
              </div>

              {/* Center floating button with 3D effect */}
              <div className="mx-4">
                <Link to={centerButton.path}>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                    data-testid={centerButton.testId}
                    aria-current={isActive(centerButton.path) ? "page" : undefined}
                  >
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-110" />
                    
                    {/* 3D shadow layers */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-primary/40 to-transparent translate-y-1" />
                    
                    {/* Main button with gradient and 3D effect */}
                    <motion.div
                      className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FDD835] via-[#FDD835] to-[#F9A825] shadow-2xl flex items-center justify-center"
                      animate={{
                        boxShadow: isActive(centerButton.path)
                          ? "0 10px 35px rgba(253, 216, 53, 0.6), 0 5px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)"
                          : "0 6px 25px rgba(253, 216, 53, 0.5), 0 3px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}
                    >
                      {/* Inner highlight for 3D effect */}
                      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                      
                      {/* Bottom shadow for depth */}
                      <div className="absolute inset-1 rounded-full bg-gradient-to-b from-transparent via-transparent to-black/10" />
                      
                      <centerButton.icon 
                        className={`w-7 h-7 relative z-10 ${
                          isActive(centerButton.path) ? "text-gray-900" : "text-gray-800"
                        }`}
                        strokeWidth={2.5}
                      />
                    </motion.div>

                    {/* Active indicator pulse */}
                    {isActive(centerButton.path) && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </motion.button>
                </Link>
              </div>

              {/* Right side buttons */}
              <div className="flex-1 flex justify-around">
                {sideNavItems
                  .filter(item => item.side === "right")
                  .map(({ path, icon: Icon, testId }) => {
                    const active = isActive(path);
                    return (
                      <Link key={path} to={path}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex flex-col items-center gap-1 p-2"
                          data-testid={testId}
                          aria-current={active ? "page" : undefined}
                        >
                          <motion.div
                            animate={{
                              y: active ? -3 : 0,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            <Icon 
                              className={`w-6 h-6 transition-colors ${active ? "text-primary" : "text-gray-400"}`}
                              strokeWidth={active ? 2.5 : 2}
                            />
                          </motion.div>
                          {active && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="w-1 h-1 rounded-full bg-primary"
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}
                        </motion.button>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
