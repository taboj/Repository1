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
      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="h-6 w-6 text-primary dark:text-mint-400" />
            <h1 className="text-2xl font-semibold">Sleep Calculator</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={calculationMode === 'wakeUp' ? 'default' : 'outline'}
            className="h-20 flex flex-col gap-2"
            onClick={() => setCalculationMode('wakeUp')}
          >
            <Sun className="h-5 w-5" />
            <span className="text-sm">Wake up at</span>
          </Button>
          <Button
            variant={calculationMode === 'bedTime' ? 'default' : 'outline'}
            className="h-20 flex flex-col gap-2"
            onClick={() => setCalculationMode('bedTime')}
          >
            <Moon className="h-5 w-5" />
            <span className="text-sm">Sleep now</span>
          </Button>
        </div>

        {/* Time Picker */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium">
            {calculationMode === 'wakeUp' ? 'When do you want to wake up?' : 'What time is it now?'}
          </h2>
          <div className="flex items-center justify-center gap-4 bg-muted rounded-lg p-6">
            <select
              value={selectedTime.hour}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
              className="text-3xl font-mono bg-transparent border-none outline-none text-center w-16"
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-3xl font-mono">:</span>
            <select
              value={selectedTime.minute}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
              className="text-3xl font-mono bg-transparent border-none outline-none text-center w-16"
            >
              {minutes.map(minute => (
                <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <select
              value={selectedTime.period}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, period: e.target.value as 'AM' | 'PM' }))}
              className="text-3xl font-mono bg-transparent border-none outline-none text-center w-16"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-medium">Settings</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Fall asleep time</span>
                <span className="text-sm">{settings.fallAsleepTime} min</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={settings.fallAsleepTime}
                onChange={(e) => setSettings(prev => ({ ...prev, fallAsleepTime: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Cycle length</span>
                <span className="text-sm">{settings.cycleLength} min</span>
              </div>
              <input
                type="range"
                min="80"
                max="100"
                value={settings.cycleLength}
                onChange={(e) => setSettings(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">
              {calculationMode === 'wakeUp' ? 'Go to bed at:' : 'Wake up at:'}
            </h2>
            
            {shouldShowSleepWarning(recommendations) && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                ⚠️ This may result in insufficient sleep
              </div>
            )}

            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="text-2xl font-mono font-bold">{rec.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {rec.cycles} cycles • {rec.totalSleep}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${getQualityColor(rec.quality)}`}>
                    {rec.quality}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep Tips */}
        <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
          <h3 className="font-medium">Sleep Tips</h3>
          <p className="text-muted-foreground">
            Sleep cycles last ~90 minutes. Waking up at the end of a cycle helps you feel more refreshed.
          </p>
        </div>
      </div>
    </div>
  );
}
