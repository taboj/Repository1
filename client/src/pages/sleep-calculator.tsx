import { useState, useEffect } from "react";
import { Moon, Sun, AlarmClock, Bell, RotateCcw, ChevronUp, ChevronDown, Brain, Heart, Lightbulb } from "lucide-react";
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
  getFallAsleepTime,
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
    age: 21.5
  });

  // Update fall asleep time automatically when age changes
  useEffect(() => {
    const calculatedFallAsleepTime = getFallAsleepTime(settings.age);
    setSettings(prev => ({ 
      ...prev, 
      fallAsleepTime: calculatedFallAsleepTime 
    }));
  }, [settings.age]);
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'GOOD': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'POOR': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
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

  // Sleep Architecture Component with user-friendly, age-adaptive explanations
  const SleepCycleVisualization = () => {
    const ageData = getAgeGroupRecommendations(settings.age);
    const ageGroup = getAgeGroup(settings.age);
    const cycleLength = getCycleLength(settings.age);
    const fallAsleepTime = getFallAsleepTime(settings.age);
    
    // Age-specific introductory text
    const getIntroText = () => {
      switch (ageGroup) {
        case 'newborn':
          return "Newborn sleep is uniquely different—they sleep in short, frequent cycles and enter sleep through active (REM) phases rather than quiet sleep. This irregular pattern is perfectly normal and supports rapid brain development.";
        case 'earlyInfant':
        case 'lateInfant':
          return "Infant sleep is transitioning toward adult patterns. True sleep stages are emerging, and circadian rhythms are strengthening, leading to longer nighttime sleep periods and more predictable naps.";
        case 'toddler':
        case 'preschooler':
          return "Toddler and preschooler sleep becomes increasingly mature with stable 90-minute cycles. High amounts of deep sleep support rapid physical growth and learning development during this active period.";
        case 'schoolAge':
          return "School-age children have peak sleep efficiency with fully mature architecture. Consistent sleep patterns are crucial for academic performance, physical growth, and emotional regulation.";
        case 'adolescent':
          return "Teenage sleep naturally shifts later due to biological changes—this isn't laziness but a real circadian delay. Teens become more sensitive to blue light and need consistent sleep despite busy schedules.";
        case 'youngAdult':
        case 'adult':
          return "Adult sleep features optimal efficiency with distinct cycles throughout the night. The first cycle is shorter and rich in deep sleep, while REM periods lengthen toward morning for memory consolidation.";
        case 'olderAdult':
          return "Older adult sleep becomes naturally lighter and more fragmented. Deep sleep declines with age, bedtimes shift earlier, and brief awakenings become more common—this is a normal part of aging.";
        default:
          return "";
      }
    };

    // Age-specific sleep stage data based on research
    const stageData = (() => {
      switch (ageGroup) {
        case 'newborn':
          return [
            { name: 'Active Sleep (REM)', percentage: 50, color: '#8b5cf6', description: 'Active brain development phase' },
            { name: 'Quiet Sleep (NREM)', percentage: 50, color: '#06b6d4', description: 'Restful growth phase' }
          ];
        case 'earlyInfant':
        case 'lateInfant':
          return [
            { name: 'REM Sleep', percentage: 40, color: '#8b5cf6', description: 'Brain development' },
            { name: 'Light Sleep (N1/N2)', percentage: 45, color: '#06b6d4', description: 'Transitional sleep' },
            { name: 'Deep Sleep (N3)', percentage: 15, color: '#6366f1', description: 'Growth and recovery' }
          ];
        case 'toddler':
        case 'preschooler':
        case 'schoolAge':
          return [
            { name: 'REM Sleep', percentage: 25, color: '#8b5cf6', description: 'Learning consolidation' },
            { name: 'Light Sleep (N1/N2)', percentage: 50, color: '#06b6d4', description: 'Sleep maintenance' },
            { name: 'Deep Sleep (N3)', percentage: 25, color: '#6366f1', description: 'Growth and restoration' }
          ];
        case 'adolescent':
          return [
            { name: 'REM Sleep', percentage: 22, color: '#8b5cf6', description: 'Memory and emotions' },
            { name: 'Light Sleep (N1/N2)', percentage: 56, color: '#06b6d4', description: 'Sleep transitions' },
            { name: 'Deep Sleep (N3)', percentage: 22, color: '#6366f1', description: 'Brain development' }
          ];
        case 'youngAdult':
        case 'adult':
          return [
            { name: 'REM Sleep', percentage: 20, color: '#8b5cf6', description: 'Memory consolidation' },
            { name: 'Light Sleep (N1/N2)', percentage: 55, color: '#06b6d4', description: 'Sleep maintenance' },
            { name: 'Deep Sleep (N3)', percentage: 25, color: '#6366f1', description: 'Physical restoration' }
          ];
        case 'olderAdult':
          return [
            { name: 'REM Sleep', percentage: 18, color: '#8b5cf6', description: 'Cognitive function' },
            { name: 'Light Sleep (N1/N2)', percentage: 67, color: '#06b6d4', description: 'More fragmented sleep' },
            { name: 'Deep Sleep (N3)', percentage: 15, color: '#6366f1', description: 'Reduced but important' }
          ];
        default:
          return [];
      }
    })();

    // Calculate cycles per 24 hours
    const averageSleepHours = (ageData.recommendedHours.min + ageData.recommendedHours.max) / 2;
    const cyclesPerNight = Math.round((averageSleepHours * 60) / cycleLength);

    // Get cycle length range
    const getCycleRange = () => {
      switch (ageGroup) {
        case 'newborn': return '40-50 min';
        case 'earlyInfant':
        case 'lateInfant': return '50-60 min';
        case 'toddler':
        case 'preschooler': return '60-90 min';
        default: return '90-120 min';
      }
    };

    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-6">Sleep Architecture: {ageData.name}</h4>
          
          {/* Age-specific introduction */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border mb-6">
            <p className="text-sm leading-relaxed">{getIntroText()}</p>
          </div>

          {/* Key Sleep Metrics */}
          <div>
            <h5 className="font-medium text-sm mb-3">Key Sleep Metrics:</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-6">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Total Sleep Duration</div>
                <div className="font-semibold text-primary dark:text-mint-400">{ageData.sleepRange}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Cycle Length Range</div>
                <div className="font-semibold text-primary dark:text-mint-400">{getCycleRange()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Average Cycle</div>
                <div className="font-semibold text-primary dark:text-mint-400">{cycleLength} min</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Sleep Onset Type</div>
                <div className="font-semibold text-primary dark:text-mint-400">
                  {ageGroup === 'newborn' ? 'REM First' : 'NREM First'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Stage Composition</div>
                <div className="font-semibold text-primary dark:text-mint-400">
                  {ageData.remSleepPercentage}% REM / {100 - ageData.remSleepPercentage}% NREM
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Fall Asleep Time</div>
                <div className="font-semibold text-primary dark:text-mint-400">{fallAsleepTime} min</div>
              </div>
            </div>
          </div>

          {/* Visual Sleep Cycle Summary */}
          <div>
            <h5 className="font-medium text-sm mb-3">Single Sleep Cycle Breakdown:</h5>
            <div className="relative h-16 bg-muted rounded-lg overflow-hidden border mb-4">
              <div className="absolute inset-0 flex">
                {stageData.map((stage, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-center text-xs font-medium text-white transition-all hover:brightness-110"
                    style={{ 
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color
                    }}
                    title={`${stage.name}: ${stage.percentage}% - ${stage.description}`}
                  >
                    <span className="font-semibold">{stage.percentage}%</span>
                  </div>
                ))}
              </div>
              
              {/* Wake window indicator */}
              <div className="absolute top-0 right-2 w-1 h-full bg-green-500"></div>
              <div className="absolute -top-6 right-2">
                <Sun className="h-4 w-4 text-green-500" />
              </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-4">
              {stageData.map((stage, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: stage.color }}></div>
                  <span><strong>{stage.name}:</strong> {stage.description}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Sleep begins here</span>
              <span className="text-green-600 dark:text-green-400 font-medium">Best wake time</span>
            </div>
          </div>

          {/* Why It Matters - Age-Adaptive */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-6">
            <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span>💡</span>
              Why This Matters:
            </h5>
            <div className="space-y-2 text-sm">
              {ageGroup === 'newborn' && (
                <>
                  <p><strong>Neural Development:</strong> Active sleep promotes rapid brain growth and helps organize new sensory experiences from the day.</p>
                  <p><strong>Growth Support:</strong> Frequent sleep cycles ensure continuous hormone release needed for physical development.</p>
                </>
              )}
              {(ageGroup === 'earlyInfant' || ageGroup === 'lateInfant') && (
                <>
                  <p><strong>Brain Maturation:</strong> Developing sleep stages support cognitive milestones like recognizing faces and responding to names.</p>
                  <p><strong>Immune Building:</strong> Longer sleep periods strengthen the developing immune system against common illnesses.</p>
                </>
              )}
              {(ageGroup === 'toddler' || ageGroup === 'preschooler') && (
                <>
                  <p><strong>Learning & Growth:</strong> High deep sleep supports explosive language development and rapid physical growth spurts.</p>
                  <p><strong>Behavior Regulation:</strong> Quality sleep is crucial for managing big emotions and maintaining attention during activities.</p>
                </>
              )}
              {ageGroup === 'schoolAge' && (
                <>
                  <p><strong>Academic Success:</strong> Peak sleep architecture optimizes memory formation for reading, math, and social skills.</p>
                  <p><strong>Emotional Balance:</strong> Consistent sleep supports the ability to handle school stress and peer relationships.</p>
                </>
              )}
              {ageGroup === 'adolescent' && (
                <>
                  <p><strong>Emotional Regulation:</strong> REM sleep helps process complex teenage emotions and social situations.</p>
                  <p><strong>Academic Performance:</strong> Memory consolidation is critical for handling increasingly complex coursework.</p>
                </>
              )}
              {(ageGroup === 'youngAdult' || ageGroup === 'adult') && (
                <>
                  <p><strong>Peak Performance:</strong> Optimal sleep architecture supports career demands, decision-making, and stress management.</p>
                  <p><strong>Long-term Health:</strong> Quality sleep now protects against future chronic diseases and cognitive decline.</p>
                </>
              )}
              {ageGroup === 'olderAdult' && (
                <>
                  <p><strong>Cognitive Preservation:</strong> Remaining deep sleep helps maintain memory and thinking abilities as you age.</p>
                  <p><strong>Health Resilience:</strong> Quality rest supports immune function and recovery from daily activities.</p>
                </>
              )}
            </div>
          </div>

          {/* Research-Informed Tips */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span>💡</span>
              What This Means for You:
            </h5>
            <div className="space-y-2 text-sm">
              {ageGroup === 'newborn' && (
                <>
                  <p>• Brief awakenings between cycles are completely normal—your baby is just transitioning, not necessarily hungry</p>
                  <p>• The "45-minute nap" phenomenon is common and usually resolves as sleep cycles mature</p>
                  <p>• Active sleep may look restless but is essential for brain development—avoid unnecessary intervention</p>
                </>
              )}
              {(ageGroup === 'earlyInfant' || ageGroup === 'lateInfant') && (
                <>
                  <p>• Some sleep irregularity is expected as circadian rhythms are still developing</p>
                  <p>• Night wakings often naturally decrease around 3-6 months as sleep consolidates</p>
                  <p>• Consistent routines help support the emerging sleep patterns</p>
                </>
              )}
              {(ageGroup === 'toddler' || ageGroup === 'preschooler') && (
                <>
                  <p>• This age benefits greatly from consistent bedtime routines due to high deep sleep needs</p>
                  <p>• Bedtime resistance may increase as independence develops—stay patient and consistent</p>
                  <p>• Brief awakenings between cycles are normal but shouldn't require parental intervention</p>
                </>
              )}
              {ageGroup === 'schoolAge' && (
                <>
                  <p>• This is an ideal time to establish healthy sleep habits that will last into adulthood</p>
                  <p>• Weekend bedtimes shouldn't vary more than 1 hour from school nights</p>
                  <p>• Academic and social demands make consistent sleep schedules especially important</p>
                </>
              )}
              {ageGroup === 'adolescent' && (
                <>
                  <p>• The natural "night owl" tendency is biological—work with it rather than fighting it</p>
                  <p>• Limit screen time 1-2 hours before desired bedtime due to increased blue light sensitivity</p>
                  <p>• Sleep debt accumulates quickly and significantly impacts mood and academic performance</p>
                </>
              )}
              {(ageGroup === 'youngAdult' || ageGroup === 'adult') && (
                <>
                  <p>• Protect your first sleep cycle—it's shorter but richest in restorative deep sleep</p>
                  <p>• Caffeine can affect sleep quality even 6+ hours after consumption</p>
                  <p>• Aim for 4-6 complete cycles per night for optimal cognitive performance</p>
                </>
              )}
              {ageGroup === 'olderAdult' && (
                <>
                  <p>• Brief nighttime awakenings are normal aging changes—don't worry about them</p>
                  <p>• Earlier bedtimes are natural due to shifting circadian rhythms</p>
                  <p>• Focus on sleep quality rather than trying to achieve younger adult sleep patterns</p>
                </>
              )}
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

  const getTimeUntilBedtime = () => {
    const now = new Date();
    const hours = selectedTime.period === 'PM' && selectedTime.hour !== 12 ? selectedTime.hour + 12 : 
                  selectedTime.period === 'AM' && selectedTime.hour === 12 ? 0 : selectedTime.hour;
    
    const target = new Date();
    target.setHours(hours, selectedTime.minute, 0, 0);
    
    if (target < now) target.setDate(target.getDate() + 1);
    
    const diff = target.getTime() - now.getTime();
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `in ${hoursUntil}h ${minutesUntil}m`;
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
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Mode Toggle */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                variant={calculationMode === 'wakeUp' ? 'default' : 'outline'}
                onClick={() => setCalculationMode('wakeUp')}
                className="w-full sm:w-auto"
              >
                I want to wake up at...
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCalculationMode(calculationMode === 'wakeUp' ? 'bedTime' : 'wakeUp');
                  updateRecommendations();
                }}
                className="p-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant={calculationMode === 'bedTime' ? 'default' : 'outline'}
                onClick={() => setCalculationMode('bedTime')}
                className="w-full sm:w-auto"
              >
                I want to go to bed now...
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Time Input and Age Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Time Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {calculationMode === 'wakeUp' ? 'What time do you want to wake up?' : 'What time are you going to bed?'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newHour = selectedTime.hour === 1 ? 12 : selectedTime.hour - 1;
                        setSelectedTime(prev => ({ ...prev, hour: newHour }));
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="text-3xl font-bold w-16 text-center">
                      {selectedTime.hour.toString().padStart(2, '0')}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newHour = selectedTime.hour === 12 ? 1 : selectedTime.hour + 1;
                        setSelectedTime(prev => ({ ...prev, hour: newHour }));
                      }}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <span className="text-2xl">:</span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMinute = selectedTime.minute === 0 ? 45 : selectedTime.minute - 15;
                        setSelectedTime(prev => ({ ...prev, minute: newMinute }));
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="text-3xl font-bold w-16 text-center">
                      {selectedTime.minute.toString().padStart(2, '0')}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMinute = selectedTime.minute === 45 ? 0 : selectedTime.minute + 15;
                        setSelectedTime(prev => ({ ...prev, minute: newMinute }));
                      }}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={selectedTime.period === 'AM' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(prev => ({ ...prev, period: 'AM' }))}
                      className="w-16"
                    >
                      AM
                    </Button>
                    <Button
                      variant={selectedTime.period === 'PM' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(prev => ({ ...prev, period: 'PM' }))}
                      className="w-16"
                    >
                      PM
                    </Button>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  {calculationMode === 'wakeUp' ? 'Wake up' : 'Bedtime'}: {selectedTime.hour}:{selectedTime.minute.toString().padStart(2, '0')} {selectedTime.period}
                  {calculationMode === 'bedTime' && (
                    <span className="block mt-1">
                      That's {getTimeUntilBedtime()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Age Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Age</h3>
              <div className="space-y-4">
                <Select 
                  value={settings.age.toString()} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, age: parseFloat(value) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0-2 months (Newborn)</SelectItem>
                    <SelectItem value="3.5">3-5 months (Early Infant)</SelectItem>
                    <SelectItem value="8.5">6-11 months (Late Infant)</SelectItem>
                    <SelectItem value="1.5">1-2 years (Toddler)</SelectItem>
                    <SelectItem value="4">3-5 years (Preschooler)</SelectItem>
                    <SelectItem value="8">6-13 years (School Age)</SelectItem>
                    <SelectItem value="16">14-17 years (Adolescent)</SelectItem>
                    <SelectItem value="21.5">18-25 years (Young Adult)</SelectItem>
                    <SelectItem value="40">26-64 years (Adult)</SelectItem>
                    <SelectItem value="70">65+ years (Older Adult)</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Sleep Need:</span>
                      <span className="font-medium">{ageData.sleepRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cycle Length:</span>
                      <span className="font-medium">{cycleLength} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fall Asleep:</span>
                      <span className="font-medium">~{settings.fallAsleepTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sleep Warning */}
        {shouldShowSleepWarning(recommendations, settings.age) && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Sleep Duration Notice</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Some recommendations may not provide adequate sleep for your age group. Consider adjusting your {calculationMode === 'wakeUp' ? 'bedtime' : 'wake time'} to ensure you get {ageData.sleepRange} of sleep.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-6">
            {/* Sleep Cycle Visualization */}
            <SleepCycleVisualization />

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
                      {rec.cycles} complete sleep cycles • {rec.totalSleep}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetAlarm(rec.time)}
                    >
                      <AlarmClock className="h-4 w-4 mr-1" />
                      Set Alarm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSetReminder}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Remind Me
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
