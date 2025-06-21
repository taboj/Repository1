import { useState, useEffect } from "react";
import { Moon, Sun, Settings, AlarmClock, Bell, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('wakeUp');
  const [selectedTime, setSelectedTime] = useState({ hour: 7, minute: 0, period: 'AM' as 'AM' | 'PM' });
  const [settings, setSettings] = useState<SleepSettings>({
    fallAsleepTime: 15,
    cycleLength: 90,
    selectedCycles: 5
  });
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);

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

  // Touch-friendly time picker with swipe gestures
  const TimeWheel = ({ value, onChange, max, type }: { 
    value: number; 
    onChange: (val: number) => void; 
    max: number; 
    type: 'hour' | 'minute' | 'period';
  }) => {
    const increment = () => {
      if (type === 'hour') {
        onChange(value === 12 ? 1 : value + 1);
      } else if (type === 'minute') {
        onChange(value === 45 ? 0 : value + 15);
      }
    };

    const decrement = () => {
      if (type === 'hour') {
        onChange(value === 1 ? 12 : value - 1);
      } else if (type === 'minute') {
        onChange(value === 0 ? 45 : value - 15);
      }
    };

    return (
      <div className="flex flex-col items-center touch-manipulation">
        <Button
          variant="ghost"
          size="icon"
          onClick={increment}
          className="h-12 w-12 text-muted-foreground hover:text-foreground"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <div className="text-6xl md:text-8xl font-bold my-4 min-w-[120px] text-center select-none">
          {type === 'hour' || type === 'minute' ? value.toString().padStart(2, '0') : value}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={decrement}
          className="h-12 w-12 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>
    );
  };

  const PeriodWheel = () => {
    const togglePeriod = () => {
      setSelectedTime(prev => ({ ...prev, period: prev.period === 'AM' ? 'PM' : 'AM' }));
    };

    return (
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePeriod}
          className="h-12 w-12 text-muted-foreground hover:text-foreground"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <div className="text-4xl md:text-6xl font-bold my-4 min-w-[80px] text-center select-none">
          {selectedTime.period}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePeriod}
          className="h-12 w-12 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>
    );
  };

  const getQualityColor = (quality: SleepRecommendation['quality']) => {
    switch (quality) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'GOOD': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'POOR': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    }
  };

  const getTimeUntil = (targetTime: string): string => {
    const now = new Date();
    const [time, period] = targetTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    const target = new Date();
    target.setHours(hour24, minutes, 0, 0);
    
    if (target < now) target.setDate(target.getDate() + 1);
    
    const diff = target.getTime() - now.getTime();
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `in ${hoursUntil}h ${minutesUntil}m`;
  };

  const SleepCycleVisualization = () => {
    const phases = ['Light', 'Deep', 'REM', 'Light', 'Deep'];
    const colors = [
      'bg-blue-200 dark:bg-blue-700',
      'bg-indigo-300 dark:bg-indigo-600',
      'bg-purple-300 dark:bg-purple-600',
      'bg-blue-200 dark:bg-blue-700',
      'bg-indigo-300 dark:bg-indigo-600'
    ];

    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4">Sleep Cycle Timeline</h4>
          <div className="relative h-16 bg-muted rounded-lg overflow-hidden mb-4">
            <div className="absolute inset-0 flex">
              {phases.map((phase, index) => (
                <div
                  key={index}
                  className={`${colors[index]} h-full flex-1 flex items-center justify-center text-xs font-medium border-r border-background last:border-r-0`}
                >
                  {phase}
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-8 w-1 h-full bg-green-500"></div>
            <div className="absolute -top-6 right-8 transform -translate-x-1/2">
              <Sun className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sleep Start</span>
            <span className="text-green-600 dark:text-green-400">Optimal Wake Window</span>
            <span>Target Time</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleSetAlarm = (time: string) => {
    toast({
      title: "Alarm Set",
      description: `Alarm set for ${time}`,
    });
  };

  const handleSetReminder = () => {
    const reminderTime = calculationMode === 'wakeUp' ? 'bedtime' : '30 minutes before sleep';
    toast({
      title: "Reminder Set",
      description: `Reminder set for ${reminderTime}`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="h-6 w-6 text-primary dark:text-mint-400" />
            <h1 className="text-xl md:text-2xl font-bold">Sleep Calculator</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Dual Calculation Modes */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Button
                variant={calculationMode === 'wakeUp' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2 text-left justify-center"
                onClick={() => setCalculationMode('wakeUp')}
              >
                <Sun className="h-6 w-6 mx-auto" />
                <div className="text-center">
                  <div className="font-semibold">I want to wake up at...</div>
                  <div className="text-sm opacity-70">Calculate ideal bedtime</div>
                </div>
              </Button>
              
              <Button
                variant={calculationMode === 'bedTime' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2 text-left justify-center"
                onClick={() => setCalculationMode('bedTime')}
              >
                <Moon className="h-6 w-6 mx-auto" />
                <div className="text-center">
                  <div className="font-semibold">I want to go to bed now...</div>
                  <div className="text-sm opacity-70">Calculate wake up times</div>
                </div>
              </Button>
            </div>

            {/* Large Time Picker */}
            <div className="text-center mb-8">
              <h2 className="text-lg font-semibold mb-6">
                {calculationMode === 'wakeUp' ? 'Select your wake up time:' : 'Current time:'}
              </h2>
              <div className="flex items-center justify-center gap-4 bg-muted/30 rounded-2xl p-8">
                <TimeWheel
                  value={selectedTime.hour}
                  onChange={(hour) => setSelectedTime(prev => ({ ...prev, hour }))}
                  max={12}
                  type="hour"
                />
                <div className="text-6xl md:text-8xl font-bold text-muted-foreground mx-2">:</div>
                <TimeWheel
                  value={selectedTime.minute}
                  onChange={(minute) => setSelectedTime(prev => ({ ...prev, minute }))}
                  max={45}
                  type="minute"
                />
                <PeriodWheel />
              </div>
            </div>

            {/* Personalization Controls - Always Visible */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Personalization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Fall asleep time</label>
                    <span className="text-sm text-primary dark:text-mint-400 font-semibold">
                      {settings.fallAsleepTime} min
                    </span>
                  </div>
                  <Slider
                    value={[settings.fallAsleepTime]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, fallAsleepTime: value }))}
                    min={5}
                    max={30}
                    step={1}
                    className="touch-manipulation"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 min</span>
                    <span>30 min</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Sleep cycle length</label>
                    <span className="text-sm text-primary dark:text-mint-400 font-semibold">
                      {settings.cycleLength} min
                    </span>
                  </div>
                  <Slider
                    value={[settings.cycleLength]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, cycleLength: value }))}
                    min={80}
                    max={100}
                    step={1}
                    className="touch-manipulation"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>80 min</span>
                    <span>100 min</span>
                  </div>
                </div>
              </div>

              {/* Cycle Preference Buttons */}
              <div className="space-y-3">
                <label className="font-medium">Preferred sleep cycles</label>
                <div className="flex flex-wrap gap-2">
                  {[4, 5, 6].map(cycles => (
                    <Button
                      key={cycles}
                      variant={settings.selectedCycles === cycles ? 'default' : 'outline'}
                      onClick={() => setSettings(prev => ({ ...prev, selectedCycles: cycles }))}
                      className="touch-manipulation"
                    >
                      {cycles} cycles ({(cycles * 1.5).toFixed(1)}h)
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {recommendations.length > 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {calculationMode === 'wakeUp' ? 'Recommended Bedtimes' : 'Recommended Wake Times'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalculationMode(calculationMode === 'wakeUp' ? 'bedTime' : 'wakeUp')}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reverse
                </Button>
              </div>

              {/* Sleep Warning */}
              {shouldShowSleepWarning(recommendations) && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-orange-500 text-xl">⚠️</div>
                    <div>
                      <p className="font-semibold text-orange-700 dark:text-orange-300">
                        Insufficient Sleep Warning
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        This schedule may result in less than 6 hours of sleep. Consider adjusting your timing for better rest.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple Time Recommendations */}
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">{rec.time}</div>
                        <Badge className={getQualityColor(rec.quality)}>
                          {rec.quality}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rec.cycles} complete sleep cycles • {rec.totalSleep} • {getTimeUntil(rec.time)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetAlarm(rec.time)}
                        className="touch-manipulation"
                      >
                        <AlarmClock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSetReminder}
                        className="touch-manipulation"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sleep Cycle Visualization */}
              <SleepCycleVisualization />
            </CardContent>
          </Card>
        )}

        {/* Educational Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sleep Science & Tips</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Why Sleep Cycles Matter</h4>
                <p className="text-sm text-muted-foreground">
                  Sleep occurs in 90-minute cycles consisting of light sleep, deep sleep, and REM sleep. 
                  Waking up at the end of a cycle helps you feel more refreshed and alert.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Better Sleep Hygiene</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Keep a consistent sleep schedule</li>
                  <li>• Avoid screens 1 hour before bed</li>
                  <li>• Keep your bedroom cool (60-67°F)</li>
                  <li>• Create a dark sleeping environment</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Scientific backing:</strong> Research shows that timing your sleep around natural 90-minute cycles 
                can significantly improve sleep quality and daytime alertness. Most adults need 7-9 hours of sleep per night.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}