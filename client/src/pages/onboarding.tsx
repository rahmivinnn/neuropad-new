import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageTransition from "@/components/page-transition";
import { Activity, Shield, Users, Heart, Zap } from "lucide-react";
import welcomeImg from "@assets/Image.png";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalSteps = 5;

  useEffect(() => {
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    // Prevent flickering
    document.body.style.transform = 'translate3d(0, 0, 0)';
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.style.transform = '';
    };
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem("neuro_onboarding_completed", "true");
    } catch (e) {
      // ignore storage errors
    }
    // Redirect ke Login (Landing) sesuai router untuk unauthenticated user
    // Gunakan full reload agar Router mengevaluasi localStorage terbaru
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        completeOnboarding();
      }
      setIsTransitioning(false);
    }, 150);
  };

  const handleBack = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
      setIsTransitioning(false);
    }, 150);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Welcome to NeuroPad",
          description: "Your personal health monitoring companion for diabetic foot care",
          icon: <Heart className="h-12 w-12 text-primary mx-auto mb-4" />,
          content: "NeuroPad helps you monitor and manage your foot health with advanced sensors and AI-powered insights."
        };
      case 2:
        return {
          title: "Real-time Monitoring",
          description: "Continuous health tracking",
          icon: <Activity className="h-12 w-12 text-primary mx-auto mb-4" />,
          content: "Our smart sensors continuously monitor your foot health, providing real-time insights and alerts to help you stay proactive about your wellbeing."
        };
      case 3:
        return {
          title: "Prevention First",
          description: "Personalized health tips",
          icon: <Shield className="h-12 w-12 text-primary mx-auto mb-4" />,
          content: "Receive customized prevention tips and early warning alerts based on your health data to maintain optimal foot health and prevent complications."
        };
      case 4:
        return {
          title: "Caregiver Network",
          description: "Support when you need it",
          icon: <Users className="h-12 w-12 text-primary mx-auto mb-4" />,
          content: "Share your health updates with caregivers and receive timely support. Stay connected with your healthcare team and loved ones."
        };
      case 5:
        return {
          title: "Get Started",
          description: "Ready to begin your journey",
          icon: <Zap className="h-12 w-12 text-primary mx-auto mb-4" />,
          content: "You're all set to start using NeuroPad. Begin monitoring your foot health and take control of your wellbeing today."
        };
      default:
        return {
          title: "Welcome to NeuroPad",
          description: "Your personal health monitoring companion",
          icon: <Heart className="h-12 w-12 text-primary mx-auto mb-4" />,
          content: "NeuroPad helps you monitor and manage your foot health."
        };
    }
  };

  const stepContent = getStepContent();

  return (
    <PageTransition>
      <div className="min-h-screen relative flex flex-col items-center justify-center px-6 neuropad-bg">
        <Card className="w-full max-w-md bg-transparent shadow-none border-none">
          <CardHeader className="text-center">
            <div className="w-40 h-40 sm:w-64 sm:h-64 mx-auto flex items-center justify-center mb-4 sm:mb-6">
              <img
                src={welcomeImg}
                alt="Welcome"
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              {stepContent.title}
            </CardTitle>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {stepContent.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="text-center"
              >
                {stepContent.icon}
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {stepContent.content}
                </p>
                
                {/* Progress indicators */}
                <div className="flex justify-center space-x-2 mt-6">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index + 1 === currentStep ? "bg-primary" : "bg-gray-300"
                      }`}
                      initial={false}
                      animate={{
                        scale: index + 1 === currentStep ? 1.2 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between space-x-3 sm:space-x-4 mt-2 sm:mt-4">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="flex-1 py-2 sm:py-3"
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isTransitioning}
                  className="flex-1 py-2 sm:py-3"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isTransitioning}
                className="flex-1 py-2 sm:py-3"
              >
                {isTransitioning ? "..." : currentStep === totalSteps ? "Get Started" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}