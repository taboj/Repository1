import { useState, useEffect } from "react";
import { Moon, Sun, AlarmClock, Bell, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import {
  calculateOptimalBedtimes,
  calculateOptimalWakeTimes,
  shouldShowSleepWarning,
  parseTimeString,
  getAgeGroupRecommendations,
  calculateOptimalCyclesForAge,
  getCycleLength,
  getAgeGroup,
  formatSleepDuration,
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
    selectedCycles: 5,
    age: 25
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

  // Sleep Cycle Visualization Component
  const SleepCycleVisualization = () => {
    const ageData = getAgeGroupRecommendations(settings.age);
    const cycleLength = getCycleLength(settings.age);
    const phases = ['Light Sleep', 'Deep Sleep', 'REM Sleep', 'Light Sleep', 'Deep Sleep'];
    
    // Phase colors and timing
    const phaseData = [
      { name: 'Light Sleep', duration: 15, color: 'bg-blue-200 dark:bg-blue-700', gradient: 'from-blue-400 to-blue-500' },
      { name: 'Deep Sleep', duration: 25, color: 'bg-indigo-300 dark:bg-indigo-600', gradient: 'from-indigo-500 to-indigo-600' },
      { name: 'REM Sleep', duration: 20, color: 'bg-purple-300 dark:bg-purple-600', gradient: 'from-purple-500 to-purple-600' },
      { name: 'Light Sleep', duration: 20, color: 'bg-blue-200 dark:bg-blue-700', gradient: 'from-blue-400 to-blue-500' },
      { name: 'Deep Sleep', duration: 10, color: 'bg-indigo-300 dark:bg-indigo-600', gradient: 'from-indigo-500 to-indigo-600' }
    ];

    // Adjust phase heights based on age group percentages
    const getPhaseHeight = (phaseName: string) => {
      switch (phaseName) {
        case 'Deep Sleep':
          return `${Math.min(100, ageData.deepSleepPercentage * 3)}%`;
        case 'REM Sleep':
          return `${Math.min(100, ageData.remSleepPercentage * 4)}%`;
        default:
          return '60%';
      }
    };

    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4">Sleep Cycle Phases for {ageData.name}</h4>
          
          {/* Visual sleep cycle representation */}
          <div className="relative h-24 bg-muted rounded-lg overflow-hidden mb-4 border">
            <div className="absolute inset-0 flex items-end">
              {phaseData.map((phase, index) => (
                <div key={index} className="flex-1 flex flex-col justify-end h-full relative">
                  <div
                    className={`${phase.color} flex items-center justify-center text-xs font-medium border-r border-background last:border-r-0 transition-all duration-500 relative overflow-hidden`}
                    style={{ height: getPhaseHeight(phase.name) }}
                  >
                    <span className="relative z-10">{phase.name}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Optimal wake window indicator */}
            <div className="absolute top-0 right-8 w-1 h-full bg-gradient-to-b from-green-400 to-green-600"></div>
            <div className="absolute -top-6 right-8 transform -translate-x-1/2">
              <Sun className="h-4 w-4 text-green-500" />
            </div>
          </div>

          {/* Labels and information */}
          <div className="flex justify-between text-xs text-muted-foreground mb-4">
            <span>Sleep Start</span>
            <span className="text-green-600 dark:text-green-400">Optimal Wake Window</span>
            <span>Cycle End</span>
          </div>

          {/* Sleep statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Cycle Length:</span>
              <div className="text-primary dark:text-mint-400 font-semibold">{cycleLength} minutes</div>
            </div>
            <div>
              <span className="font-medium">REM Sleep:</span>
              <div className="text-purple-600 dark:text-purple-400 font-semibold">{ageData.remSleepPercentage}%</div>
            </div>
            <div>
              <span className="font-medium">Deep Sleep:</span>
              <div className="text-indigo-600 dark:text-indigo-400 font-semibold">{ageData.deepSleepPercentage}%</div>
            </div>
            <div>
              <span className="font-medium">Total Cycles:</span>
              <div className="text-primary dark:text-mint-400 font-semibold">{recommendations[0]?.cycles || settings.selectedCycles}</div>
            </div>
          </div>

          {/* Phase breakdown with detailed explanations */}
          <div className="mt-4 border-t border-border pt-4">
            <h5 className="font-medium text-sm mb-3">Understanding Your Sleep Cycle ({cycleLength} minutes):</h5>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-700 mt-0.5 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Light Sleep (Stage 1 & 2)</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    The transition from awake to sleep. Your muscles relax, heart rate slows, and you can be easily awakened. 
                    This is when you might experience hypnic jerks (sudden muscle twitches).
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded bg-indigo-300 dark:bg-indigo-600 mt-0.5 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-indigo-700 dark:text-indigo-300">Deep Sleep (Stage 3)</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    The most restorative phase. Your body repairs tissues, strengthens immune system, and consolidates memories. 
                    Very difficult to wake up during this phase - you'll feel groggy if awakened.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded bg-purple-300 dark:bg-purple-600 mt-0.5 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-purple-700 dark:text-purple-300">REM Sleep</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rapid Eye Movement sleep - when most vivid dreams occur. Critical for emotional processing, 
                    creativity, and memory consolidation. Brain activity similar to being awake.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <h6 className="font-medium text-xs mb-2">How to Read the Chart:</h6>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Height</strong> = How much time you spend in each phase</li>
                <li>• <strong>Width</strong> = Duration of each phase within one cycle</li>
                <li>• <strong>Green line</strong> = Optimal wake-up window (end of light sleep)</li>
                <li>• You cycle through these phases 4-6 times per night</li>
              </ul>
            </div>
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

  const ageData = getAgeGroupRecommendations(settings.age);
  const cycleLength = getCycleLength(settings.age);

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

            {/* Input Controls */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Personalization</h3>
              
              {/* Age Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-medium">Your Age</label>
                  <span className="text-sm text-primary dark:text-mint-400 font-semibold">
                    {settings.age} years old
                  </span>
                </div>
                <Select 
                  value={settings.age.toString()} 
                  onValueChange={(value) => {
                    const ageValue = parseFloat(value);
                    setSettings(prev => ({ 
                      ...prev, 
                      age: ageValue,
                      selectedCycles: calculateOptimalCyclesForAge(ageValue)[0]
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your age" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {/* Newborns and Infants */}
                    <SelectItem value="0.08">1 month</SelectItem>
                    <SelectItem value="0.17">2 months</SelectItem>
                    <SelectItem value="0.25">3 months</SelectItem>
                    <SelectItem value="0.5">6 months</SelectItem>
                    <SelectItem value="0.75">9 months</SelectItem>
                    <SelectItem value="1">1 year</SelectItem>
                    
                    {/* Toddlers and Preschoolers */}
                    <SelectItem value="1.5">1.5 years</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="4">4 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    
                    {/* School Age */}
                    {Array.from({ length: 7 }, (_, i) => (
                      <SelectItem key={i + 6} value={(i + 6).toString()}>
                        {i + 6} years
                      </SelectItem>
                    ))}
                    
                    {/* Teens */}
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 13} value={(i + 13).toString()}>
                        {i + 13} years
                      </SelectItem>
                    ))}
                    
                    {/* Adults */}
                    {Array.from({ length: 41 }, (_, i) => (
                      <SelectItem key={i + 21} value={(i + 21).toString()}>
                        {i + 21} years
                      </SelectItem>
                    ))}
                    
                    {/* Seniors */}
                    {Array.from({ length: 30 }, (_, i) => (
                      <SelectItem key={i + 62} value={(i + 62).toString()}>
                        {i + 62} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  Age Group: {ageData.name} | Sleep Cycle: {cycleLength} minutes
                </div>
              </div>
              
              {/* Fall Asleep Time Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-medium">Fall asleep time</label>
                  <span className="text-sm text-primary dark:text-mint-400 font-semibold">
                    {settings.fallAsleepTime} min
                  </span>
                </div>
                <Select 
                  value={settings.fallAsleepTime.toString()} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, fallAsleepTime: parseInt(value) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select fall asleep time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="25">25 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="35">35 minutes</SelectItem>
                    <SelectItem value="40">40 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="50">50 minutes</SelectItem>
                    <SelectItem value="55">55 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
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
              {shouldShowSleepWarning(recommendations, settings.age) && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-orange-500 text-xl">⚠️</div>
                    <div>
                      <p className="font-semibold text-orange-700 dark:text-orange-300">
                        Insufficient Sleep Warning
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        This schedule may result in less than the recommended {ageData.recommendedHours.min} hours of sleep for your age group. Consider adjusting your timing.
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

              {/* Sleep Cycle Analysis Progress Bars */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold mb-4">Sleep Cycle Analysis</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Understanding why each bedtime gets its rating based on sleep cycle completion:
                </p>
                
                <div className="space-y-4">
                  {recommendations.map((rec, index) => {
                    const getRatingColor = (quality: string) => {
                      switch (quality) {
                        case 'EXCELLENT': return { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-800 dark:text-green-200' };
                        case 'FAIR': return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-200' };
                        case 'POOR': return { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300 dark:border-red-700', text: 'text-red-800 dark:text-red-200' };
                        default: return { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-200' };
                      }
                    };

                    const getExplanation = (quality: string, cycles: number) => {
                      const sleepHours = (cycles * cycleLength) / 60;
                      const ageGroup = getAgeGroup(settings.age);
                      
                      switch (quality) {
                        case 'EXCELLENT':
                          if (ageGroup === 'newborn') {
                            return `Optimal for newborns! ${cycles} cycles (${formatSleepDuration(cycles * cycleLength)}) supports critical neural maturation with 50% REM sleep for brain development.`;
                          } else if (ageGroup === 'infant') {
                            return `Perfect for infants! ${cycles} cycles aligns with developing circadian rhythms and consolidating sleep patterns.`;
                          } else if (ageGroup === 'teen') {
                            return `Ideal for teens! ${cycles} cycles provides sufficient sleep despite natural circadian delay. Research shows teens need 8-10 hours but often get only 6.5-7.5 hours.`;
                          } else if (ageGroup === 'senior') {
                            return `Excellent for older adults! ${cycles} cycles accounts for age-related changes including reduced deep sleep and more fragmented sleep patterns.`;
                          } else {
                            return `Perfect! ${cycles} cycles (${formatSleepDuration(cycles * cycleLength)}) provides complete sleep architecture with optimal N3 deep sleep early and REM sleep later in cycles.`;
                          }
                        case 'FAIR':
                          if (sleepHours < ageData.recommendedHours.min) {
                            return `Below optimal range. ${formatSleepDuration(cycles * cycleLength)} may not provide sufficient N3 deep sleep for physical repair and memory consolidation. Research shows sleep debt accumulates with chronic insufficient sleep.`;
                          } else {
                            return `Above optimal range. ${formatSleepDuration(cycles * cycleLength)} may cause sleep inertia and grogginess due to waking during deep sleep phases rather than light sleep.`;
                          }
                        case 'POOR':
                          return `Severely insufficient! ${formatSleepDuration(cycles * cycleLength)} provides inadequate time for essential sleep stages. Research links chronic sleep deprivation to impaired cognitive function, weakened immune system, and increased health risks.`;
                        default:
                          return `${cycles} cycles providing ${formatSleepDuration(cycles * cycleLength)} of sleep for your age group.`;
                      }
                    };

                    const colors = getRatingColor(rec.quality);
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                        {/* Header with bedtime and rating */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">{rec.time}</span>
                            <Badge className={getQualityColor(rec.quality)}>
                              {rec.quality}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Wake at: {calculationMode === 'wakeUp' ? `${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, '0')} ${selectedTime.period}` : 'Calculated'}
                          </span>
                        </div>

                        {/* Visual cycle blocks */}
                        <div className="mb-3">
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">Sleep Cycles:</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Sun className="h-3 w-3 text-green-500" />
                                <span>Wake Window</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-full">
                              {Array.from({ length: Math.min(rec.cycles, 12) }, (_, i) => (
                                <div
                                  key={i}
                                  className={`px-2 py-1 rounded text-xs font-medium border ${colors.border} ${colors.bg} ${colors.text} flex-shrink-0`}
                                >
                                  Cycle {i + 1}
                                </div>
                              ))}
                              {rec.cycles > 12 && (
                                <div className={`px-2 py-1 rounded text-xs font-medium border ${colors.border} ${colors.bg} ${colors.text} flex-shrink-0`}>
                                  +{rec.cycles - 12} more
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress bar visualization */}
                          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${rec.quality === 'EXCELLENT' ? 'bg-green-500' : rec.quality === 'FAIR' ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, (rec.cycles / 7) * 100)}%` }}
                            ></div>
                            <div className="absolute right-2 top-0 w-1 h-full bg-green-600"></div>
                          </div>
                        </div>

                        {/* Detailed stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                          <div>
                            <span className="text-muted-foreground">Total Sleep:</span>
                            <div className="font-semibold">{rec.totalSleep}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cycles:</span>
                            <div className="font-semibold">{rec.cycles}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cycle Length:</span>
                            <div className="font-semibold">{cycleLength}min</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time Until:</span>
                            <div className="font-semibold">{getTimeUntil(rec.time)}</div>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className={`text-sm p-3 rounded ${colors.bg} border-l-4 ${colors.border}`}>
                          <span className="font-medium">Why this rating: </span>
                          {getExplanation(rec.quality, rec.cycles)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Educational footer */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Sleep Cycle Science</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">EXCELLENT (5-6 cycles):</span>
                      <p>Optimal sleep duration that aligns with natural circadian rhythms and allows complete recovery.</p>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">FAIR (4 or 7+ cycles):</span>
                      <p>Either insufficient sleep time or potential oversleeping that may disrupt natural wake cycles.</p>
                    </div>
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">POOR (≤3 cycles):</span>
                      <p>Dangerously insufficient sleep that impairs cognitive function, immune system, and overall health.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Age-Specific Educational Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sleep Science for {ageData.name}</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Age-Specific Sleep Patterns</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Recommended sleep:</span> {ageData.sleepRange}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Cycle length:</span> {cycleLength} minutes (scientifically determined)
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">REM sleep:</span> {ageData.remSleepPercentage}% of total sleep
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Deep sleep:</span> {ageData.deepSleepPercentage}% of total sleep
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Key Characteristics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {ageData.characteristics.map((characteristic, index) => (
                    <li key={index}>• {characteristic}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Research-based insights:</strong> Sleep architecture evolves dramatically across the lifespan. {' '}
                {getAgeGroup(settings.age) === 'newborn' && 'Newborns enter sleep through REM (unique pattern) with 50% active sleep and 30-60 minute cycles for critical neural development.'}
                {getAgeGroup(settings.age) === 'infant' && 'By 3 months, circadian rhythms establish and sleep onset shifts to NREM. Cycles lengthen from 60-90 minutes as brain matures.'}
                {getAgeGroup(settings.age) === 'toddler' && 'Sleep cycles solidify to adult-like 90 minutes with NREM reaching 75-80%. Sleep becomes more consolidated at night.'}
                {getAgeGroup(settings.age) === 'preschool' && 'Sleep architecture becomes increasingly adult-like while maintaining high N3 deep sleep essential for rapid growth and immune development.'}
                {getAgeGroup(settings.age) === 'schoolAge' && 'Cycles extend to 90-110 minutes with continued prioritization of deep sleep for physical development and learning consolidation.'}
                {getAgeGroup(settings.age) === 'teen' && 'Biological circadian shift causes natural 1-2 hour delay in sleepiness. Brain becomes more sensitive to blue light disruption.'}
                {getAgeGroup(settings.age) === 'adult' && 'Complete 90-110 minute cycles with 75-80% NREM sleep. Deep sleep concentrates in first third, REM increases later in night.'}
                {getAgeGroup(settings.age) === 'senior' && 'Deep sleep declines 2% per decade after age 20. Sleep becomes fragmented with 3-4 awakenings per night and advanced circadian phase.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}