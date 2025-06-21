import { useState, useEffect } from "react";
import { Moon, Sun, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
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
  const [showSettings, setShowSettings] = useState(false);

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

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  const getQualityColor = (quality: SleepRecommendation['quality']) => {
    switch (quality) {
      case 'EXCELLENT': return 'text-green-600 dark:text-green-400';
      case 'GOOD': return 'text-blue-600 dark:text-blue-400';
      case 'FAIR': return 'text-yellow-600 dark:text-yellow-400';
      case 'POOR': return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-16">
          <h1 className="text-3xl font-light tracking-wide">Sleep Calculator</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-8 mb-20">
          <button
            onClick={() => setCalculationMode('wakeUp')}
            className={`text-left p-8 rounded-none border-b-2 transition-all duration-200 ${
              calculationMode === 'wakeUp' 
                ? 'border-foreground text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="space-y-3">
              <Sun className="h-6 w-6" />
              <h2 className="text-xl font-light">I want to wake up at</h2>
              <p className="text-sm text-muted-foreground">Calculate ideal bedtime</p>
            </div>
          </button>
          <button
            onClick={() => setCalculationMode('bedTime')}
            className={`text-left p-8 rounded-none border-b-2 transition-all duration-200 ${
              calculationMode === 'bedTime' 
                ? 'border-foreground text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="space-y-3">
              <Moon className="h-6 w-6" />
              <h2 className="text-xl font-light">I want to go to bed now</h2>
              <p className="text-sm text-muted-foreground">Calculate wake up times</p>
            </div>
          </button>
        </div>

        {/* Time Picker */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-8">
            <select
              value={selectedTime.hour}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
              className="text-8xl font-thin bg-transparent border-none outline-none text-center w-32 cursor-pointer"
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-8xl font-thin text-muted-foreground">:</span>
            <select
              value={selectedTime.minute}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
              className="text-8xl font-thin bg-transparent border-none outline-none text-center w-32 cursor-pointer"
            >
              {minutes.map(minute => (
                <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <select
              value={selectedTime.period}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, period: e.target.value as 'AM' | 'PM' }))}
              className="text-4xl font-thin bg-transparent border-none outline-none text-center w-20 cursor-pointer ml-4"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <p className="text-muted-foreground font-light">
            {calculationMode === 'wakeUp' ? 'When do you want to wake up?' : 'What time is it now?'}
          </p>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="mb-20 p-8 border border-border">
            <h3 className="text-lg font-light mb-8">Personalization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-light">Fall asleep time</span>
                  <span className="text-muted-foreground">{settings.fallAsleepTime} min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={settings.fallAsleepTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, fallAsleepTime: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-muted appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>30 min</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-light">Cycle length</span>
                  <span className="text-muted-foreground">{settings.cycleLength} min</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="100"
                  value={settings.cycleLength}
                  onChange={(e) => setSettings(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-muted appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>80 min</span>
                  <span>100 min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {recommendations.length > 0 && (
          <div className="mb-20">
            {shouldShowSleepWarning(recommendations) && (
              <div className="mb-8 p-6 border-l-4 border-orange-400 bg-orange-50/50 dark:bg-orange-900/20">
                <p className="text-orange-700 dark:text-orange-300 font-light">
                  This schedule may result in insufficient sleep. Consider adjusting your timing.
                </p>
              </div>
            )}

            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-6 border-b border-border last:border-b-0"
                >
                  <div className="space-y-1">
                    <div className="text-4xl font-thin tracking-wide">{rec.time}</div>
                    <div className="text-sm text-muted-foreground font-light">
                      {rec.cycles} sleep cycles • {rec.totalSleep}
                    </div>
                  </div>
                  <div className={`text-xs uppercase tracking-widest font-medium ${getQualityColor(rec.quality)}`}>
                    {rec.quality}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep Science */}
        <div className="pt-8 border-t border-border">
          <p className="text-muted-foreground font-light leading-relaxed">
            Sleep occurs in approximately 90-minute cycles. Waking up at the end of a complete cycle 
            helps you feel more refreshed and alert, rather than groggy from being awakened during deep sleep.
          </p>
        </div>
      </div>
    </div>
  );
}