import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import TimePicker from "@/components/sleep/time-picker";
import PersonalizationControls from "@/components/sleep/personalization-controls";
import RecommendationCard from "@/components/sleep/recommendation-card";
import SleepCycleVisualization from "@/components/sleep/sleep-cycle-visualization";
import QuickActions from "@/components/sleep/quick-actions";
import EducationalSection from "@/components/sleep/educational-section";
import {
  calculateOptimalBedtimes,
  calculateOptimalWakeTimes,
  shouldShowSleepWarning,
  parseTimeString,
  type SleepRecommendation,
  type SleepSettings
} from "@/lib/sleep-calculations";

type CalculationMode = 'wakeUp' | 'bedTime';

export default function SleepCalculator() {
  const { theme, setTheme } = useTheme();
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('wakeUp');
  const [selectedTime, setSelectedTime] = useState({ hour: 7, minute: 0, period: 'AM' as 'AM' | 'PM' });
  const [settings, setSettings] = useState<SleepSettings>({
    fallAsleepTime: 15,
    cycleLength: 90,
    selectedCycles: 5
  });
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const updateRecommendations = () => {
    const timeString = `${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, '0')}`;
    const targetTime = parseTimeString(timeString, selectedTime.period);
    
    let newRecommendations: SleepRecommendation[];
    
    if (calculationMode === 'wakeUp') {
      newRecommendations = calculateOptimalBedtimes(targetTime, settings);
    } else {
      newRecommendations = calculateOptimalWakeTimes(targetTime, settings);
    }
    
    setRecommendations(newRecommendations);
  };

  useEffect(() => {
    updateRecommendations();
  }, [calculationMode, selectedTime, settings]);

  const handleModeChange = (mode: CalculationMode) => {
    setCalculationMode(mode);
  };

  const handleTimeChange = (time: typeof selectedTime) => {
    setSelectedTime(time);
  };

  const handleSettingsChange = (newSettings: Partial<SleepSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const showWarning = shouldShowSleepWarning(recommendations);

  return (
    <div className="min-h-screen px-4 py-8 bg-background text-foreground transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-mint-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.header 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <Moon className="text-4xl text-primary dark:text-mint-400 mr-3 h-10 w-10" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-mint-400 dark:to-mint-500 bg-clip-text text-transparent">
              Sleep Calculator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Optimize your sleep cycles for better rest and wake up refreshed
          </p>
        </motion.header>

        {/* Main Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-8 shadow-xl">
            <CardContent className="p-6">
              {/* Calculation Mode Toggle */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Button
                  variant={calculationMode === 'wakeUp' ? 'default' : 'outline'}
                  className={`flex-1 p-6 h-auto flex flex-col items-center space-y-2 transition-all duration-300 ${
                    calculationMode === 'wakeUp' 
                      ? 'bg-primary hover:bg-primary/90 dark:bg-mint-500 dark:hover:bg-mint-600' 
                      : 'hover:border-primary dark:hover:border-mint-400'
                  }`}
                  onClick={() => handleModeChange('wakeUp')}
                >
                  <Sun className="h-6 w-6" />
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">I want to wake up at...</h3>
                    <p className="text-sm opacity-70">Calculate ideal bedtime</p>
                  </div>
                </Button>
                
                <Button
                  variant={calculationMode === 'bedTime' ? 'default' : 'outline'}
                  className={`flex-1 p-6 h-auto flex flex-col items-center space-y-2 transition-all duration-300 ${
                    calculationMode === 'bedTime' 
                      ? 'bg-primary hover:bg-primary/90 dark:bg-mint-500 dark:hover:bg-mint-600' 
                      : 'hover:border-primary dark:hover:border-mint-400'
                  }`}
                  onClick={() => handleModeChange('bedTime')}
                >
                  <Moon className="h-6 w-6" />
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">I want to go to bed now...</h3>
                    <p className="text-sm opacity-70">Calculate wake up times</p>
                  </div>
                </Button>
              </div>

              {/* Time Picker */}
              <TimePicker
                selectedTime={selectedTime}
                onTimeChange={handleTimeChange}
                label={calculationMode === 'wakeUp' ? 'Select your desired wake up time:' : 'Current time (going to bed now):'}
              />

              {/* Personalization Controls */}
              <PersonalizationControls
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="mb-8 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {calculationMode === 'wakeUp' ? 'Recommended Bedtimes' : 'Recommended Wake Times'}
                  </h3>
                  
                  {/* Sleep Warning */}
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6"
                    >
                      <div className="flex items-center">
                        <div className="text-orange-500 mr-3">⚠️</div>
                        <p className="text-orange-700 dark:text-orange-300">
                          <strong>Warning:</strong> This schedule may result in insufficient sleep. Consider adjusting your schedule for better rest.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Recommendations */}
                  <div className="grid gap-4 mb-6">
                    {recommendations.map((recommendation, index) => (
                      <motion.div
                        key={`${recommendation.time}-${recommendation.cycles}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <RecommendationCard recommendation={recommendation} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Sleep Cycle Visualization */}
                  <SleepCycleVisualization 
                    selectedTime={selectedTime}
                    calculationMode={calculationMode}
                    bestRecommendation={recommendations[0]}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <QuickActions
            recommendations={recommendations}
            calculationMode={calculationMode}
            onReverseCalculate={() => handleModeChange(calculationMode === 'wakeUp' ? 'bedTime' : 'wakeUp')}
          />
        </motion.div>

        {/* Educational Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <EducationalSection />
        </motion.div>
      </div>
    </div>
  );
}
