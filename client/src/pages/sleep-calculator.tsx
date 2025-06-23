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
    const ageGroup = getAgeGroup(settings.age);
    
    // Research-based sleep stage data according to the article
    const getStageData = () => {
      if (ageGroup === 'newborn') {
        return [
          { name: 'REM (Active Sleep)', percentage: 50, color: 'bg-purple-300 dark:bg-purple-600', description: 'Critical for neural maturation and brain development' },
          { name: 'NREM (Quiet Sleep)', percentage: 50, color: 'bg-blue-300 dark:bg-blue-600', description: 'Basic restorative functions' }
        ];
      } else {
        // For all other age groups, use NREM breakdown from research
        const n1Percentage = ageGroup === 'olderAdult' ? 8 : 4; // Older adults have more N1
        const n2Percentage = ageGroup === 'olderAdult' ? 50 : 50; // N2 accounts for 45-55% in adults
        const n3Percentage = ageGroup === 'olderAdult' ? 12 : (ageGroup === 'adolescent' ? 18 : 20); // N3 decreases with age
        const remPercentage = ageData.remSleepPercentage;
        
        return [
          { name: 'N1 (Light Sleep)', percentage: n1Percentage, color: 'bg-cyan-200 dark:bg-cyan-700', description: 'Transition from wake to sleep, 1-7 minutes' },
          { name: 'N2 (Light Sleep)', percentage: n2Percentage, color: 'bg-blue-300 dark:bg-blue-600', description: 'Sleep spindles and K-complexes, memory consolidation' },
          { name: 'N3 (Deep Sleep)', percentage: n3Percentage, color: 'bg-indigo-400 dark:bg-indigo-500', description: 'Slow-wave sleep, physical repair, immune function' },
          { name: 'REM Sleep', percentage: remPercentage, color: 'bg-purple-400 dark:bg-purple-500', description: 'Rapid eye movement, vivid dreams, memory processing' }
        ];
      }
    };

    const stageData = getStageData();

    // Calculate cycle progression based on research
    const getCycleProgression = () => {
      if (ageGroup === 'newborn') {
        // Newborns start with REM sleep (unique pattern)
        return [
          { stage: 'REM (Active Sleep)', duration: 50, order: 1 },
          { stage: 'NREM (Quiet Sleep)', duration: 50, order: 2 }
        ];
      } else {
        // All other ages start with NREM and progress through stages
        return [
          { stage: 'N1', duration: 5, order: 1 },
          { stage: 'N2', duration: 25, order: 2 },
          { stage: 'N3', duration: 40, order: 3 },
          { stage: 'N2', duration: 15, order: 4 },
          { stage: 'REM', duration: 15, order: 5 }
        ];
      }
    };

    const cycleProgression = getCycleProgression();

    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-6">Sleep Architecture: {ageData.name}</h4>
          
          {/* Key Sleep Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Total Sleep Duration</div>
              <div className="font-semibold text-primary">{ageData.sleepRange}</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Cycle Length Range</div>
              <div className="font-semibold text-primary">
                {ageGroup === 'newborn' ? '40–50 mins' : 
                 ageGroup === 'earlyInfant' ? '45–55 mins' :
                 ageGroup === 'lateInfant' ? '50–65 mins' :
                 ageGroup === 'toddler' ? '60–75 mins' :
                 ageGroup === 'preschooler' ? '70–85 mins' :
                 ageGroup === 'schoolAge' ? '85–95 mins' :
                 ageGroup === 'adolescent' ? '90–110 mins' :
                 ageGroup === 'youngAdult' ? '90–120 mins' :
                 ageGroup === 'adult' ? '90–120 mins' : '90–110 mins'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Average Cycle Duration</div>
              <div className="font-semibold text-primary">{cycleLength} mins</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Fall Asleep Time</div>
              <div className="font-semibold text-primary">~{settings.fallAsleepTime} mins</div>
            </div>
          </div>

          {/* Sleep Onset Type */}
          <div className="mb-6 p-4 bg-muted/20 rounded-lg">
            <div className="text-sm font-medium mb-2">Sleep Onset Type:</div>
            <div className="text-primary font-semibold">
              {ageGroup === 'newborn' ? 'Begins in REM (Active Sleep)' : 'Begins in NREM (Light Sleep)'}
            </div>
          </div>

          {/* Sleep Stage Composition Bar */}
          <div className="mb-6">
            <h5 className="font-medium text-sm mb-3">Sleep Stage Composition:</h5>
            <div className="w-full bg-muted rounded-full h-8 overflow-hidden mb-4">
              <div className="flex h-full">
                {stageData.map((stage, index) => (
                  <div
                    key={index}
                    className={`${stage.color} flex items-center justify-center text-xs font-medium text-white`}
                    style={{ width: `${stage.percentage}%` }}
                    title={`${stage.name}: ${stage.percentage}%`}
                  >
                    {stage.percentage >= 8 && <span>{stage.name.replace(/\s*\([^)]*\)/g, '')}</span>}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {stageData.map((stage, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${stage.color}`}></div>
                  <span>{stage.name}: {stage.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research-Based Notes */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-lg">
            <h5 className="font-medium text-sm mb-3">Research-Based Notes:</h5>
            <div className="space-y-2 text-xs">
              {ageGroup === 'newborn' && (
                <>
                  <p>• Sleep onset through REM is unique to newborns - all other ages begin with NREM sleep.</p>
                  <p>• Proto-cycles alternate between active (REM) and quiet (NREM) sleep patterns.</p>
                  <p>• High sleep variability with 45-minute intruder phenomenon common in this age group.</p>
                </>
              )}
              {(ageGroup === 'earlyInfant' || ageGroup === 'lateInfant') && (
                <>
                  <p>• True REM/NREM stages emerge, replacing newborn proto-cycles.</p>
                  <p>• Circadian rhythms strengthen, leading to consolidated nighttime sleep.</p>
                  <p>• Sleep cycles gradually lengthen toward adult patterns by 12 months.</p>
                </>
              )}
              {(ageGroup === 'toddler' || ageGroup === 'preschooler') && (
                <>
                  <p>• Sleep architecture becomes increasingly adult-like with stable 90-minute cycles.</p>
                  <p>• High proportion of deep sleep (N3) supports rapid physical growth.</p>
                  <p>• NREM sleep reaches 75-80%, providing foundation for immune development.</p>
                </>
              )}
              {ageGroup === 'schoolAge' && (
                <>
                  <p>• Peak slow-wave sleep period with mature sleep architecture established.</p>
                  <p>• Optimal sleep efficiency with consistent 90-minute cycle lengths.</p>
                  <p>• Deep sleep remains high to support continued growth and learning consolidation.</p>
                </>
              )}
              {ageGroup === 'adolescent' && (
                <>
                  <p>• Circadian phase delay causes natural 2-hour shift toward later sleep timing.</p>
                  <p>• Deep sleep (N3) begins declining while brain sensitivity to blue light increases.</p>
                  <p>• Biological "night owl" preference conflicts with early school schedules.</p>
                </>
              )}
              {(ageGroup === 'youngAdult' || ageGroup === 'adult') && (
                <>
                  <p>• Peak sleep efficiency with optimal architecture for cognitive performance.</p>
                  <p>• First cycle is shorter (70-90 mins) and rich in deep sleep for restoration.</p>
                  <p>• REM sleep increases progressively through the night for memory consolidation.</p>
                </>
              )}
              {ageGroup === 'olderAdult' && (
                <>
                  <p>• Deep sleep declines 2% per decade after age 20, leading to lighter sleep.</p>
                  <p>• Increased sleep fragmentation with 3-4 awakenings per night becoming normal.</p>
                  <p>• Advanced circadian phase results in earlier bedtimes and wake times.</p>
                </>
              )}
            </div>
          </div>

          {/* Optimal Wake Window */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">Recommended Wake Time</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              Wake up at the end of a complete sleep cycle when you're in light sleep. This timing helps you feel refreshed and alert rather than groggy from deep sleep interruption.
            </p>
          </div>

          {/* Detailed stage explanations based on research */}
          <div className="border-t border-border pt-4">
            <h5 className="font-medium text-sm mb-3">Sleep Stage Functions (Research-Based):</h5>
            <div className="space-y-4 text-sm">
              {stageData.map((stage, index) => (
                <div key={index} className="border border-border rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-4 h-4 rounded ${stage.color} mt-0.5 flex-shrink-0`}></div>
                    <div className="flex-1">
                      <span className="font-medium">{stage.name}</span>
                      <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                    </div>
                    <div className="text-xs font-medium">{stage.percentage}%</div>
                  </div>
                  
                  {/* Detailed explanations based on research */}
                  <div className="text-xs text-muted-foreground space-y-1 ml-7">
                    {stage.name.includes('N1') && (
                      <>
                        <p><strong>Duration:</strong> 1-7 minutes per cycle (2-5% of total sleep)</p>
                        <p><strong>Brain Activity:</strong> Shifts from alpha waves to low-voltage, mixed-frequency waves</p>
                        <p><strong>Physical State:</strong> Muscle relaxation begins, easy to wake up</p>
                        <p><strong>Experience:</strong> May experience hypnic jerks (muscle twitches), drowsy but aware</p>
                      </>
                    )}
                    {stage.name.includes('N2') && (
                      <>
                        <p><strong>Duration:</strong> 10-25 minutes initially, longer in later cycles (45-55% of total sleep)</p>
                        <p><strong>Brain Activity:</strong> Sleep spindles (12-14 Hz bursts) and K-complexes appear on EEG</p>
                        <p><strong>Physical State:</strong> Heart rate and breathing slow, body temperature drops</p>
                        <p><strong>Functions:</strong> Memory consolidation, particularly procedural memories</p>
                        <p><strong>Research:</strong> Sleep spindles may protect sleep from external disturbances</p>
                      </>
                    )}
                    {stage.name.includes('N3') && (
                      <>
                        <p><strong>Duration:</strong> 20-40 minutes in first cycle, decreases in later cycles (10-25% total)</p>
                        <p><strong>Brain Activity:</strong> High-amplitude, low-frequency delta waves (0.5-2 Hz)</p>
                        <p><strong>Physical State:</strong> Very difficult to wake, if awakened feel disoriented</p>
                        <p><strong>Functions:</strong> Physical repair, growth hormone release, immune system strengthening</p>
                        <p><strong>Age Changes:</strong> Declines 2% per decade after age 20, concentrated in first third of night</p>
                      </>
                    )}
                    {stage.name.includes('REM') && ageGroup !== 'newborn' && (
                      <>
                        <p><strong>Duration:</strong> 10-60 minutes, lengthens throughout night (20-25% total sleep)</p>
                        <p><strong>Brain Activity:</strong> Similar to waking state, theta waves, sawtooth patterns</p>
                        <p><strong>Physical State:</strong> Muscle atonia (paralysis), rapid eye movements, vivid dreams</p>
                        <p><strong>Functions:</strong> Memory consolidation, emotional processing, creativity, learning</p>
                        <p><strong>Timing:</strong> Minimal in early sleep, increases dramatically in morning hours</p>
                      </>
                    )}
                    {stage.name.includes('REM') && ageGroup === 'newborn' && (
                      <>
                        <p><strong>Duration:</strong> 25-30 minutes per cycle (50% of total sleep time)</p>
                        <p><strong>Unique Pattern:</strong> Sleep onset occurs through REM rather than NREM</p>
                        <p><strong>Brain Activity:</strong> Intense neural activity supporting rapid brain development</p>
                        <p><strong>Functions:</strong> Critical for neural maturation, synapse formation, brain plasticity</p>
                        <p><strong>Development:</strong> REM percentage decreases as nervous system matures</p>
                      </>
                    )}
                    {stage.name.includes('NREM') && ageGroup === 'newborn' && (
                      <>
                        <p><strong>Duration:</strong> 25-30 minutes per cycle (50% of total sleep time)</p>
                        <p><strong>Function:</strong> Basic restorative processes and growth</p>
                        <p><strong>Development:</strong> Less differentiated than older children - no clear N1, N2, N3 stages yet</p>
                        <p><strong>Characteristics:</strong> Quieter sleep with less movement compared to active REM sleep</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Age-specific research insights */}
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <h6 className="font-medium text-xs mb-2">Research Insights for {ageData.name}:</h6>
              <ul className="text-xs text-muted-foreground space-y-1">
                {ageGroup === 'newborn' && (
                  <>
                    <li>• Unique sleep onset through REM (active sleep) rather than NREM</li>
                    <li>• 50% active sleep critical for neural maturation and brain development</li>
                    <li>• Cycles are 30-60 minutes, much shorter than adult patterns</li>
                  </>
                )}
                {(ageGroup === 'earlyInfant' || ageGroup === 'lateInfant') && (
                  <>
                    <li>• Sleep onset shifts to NREM by 3 months as circadian rhythms develop</li>
                    <li>• Cycles gradually lengthen from 60-90 minutes approaching adult patterns</li>
                    <li>• NREM proportion increases to 70-80% supporting consolidated sleep</li>
                  </>
                )}
                {(ageGroup === 'toddler' || ageGroup === 'preschooler' || ageGroup === 'schoolAge') && (
                  <>
                    <li>• High proportion of N3 deep sleep supports rapid physical growth</li>
                    <li>• Sleep cycles solidify to adult-like 90-110 minute patterns</li>
                    <li>• NREM sleep reaches 75-80% supporting immune development</li>
                  </>
                )}
                {ageGroup === 'adolescent' && (
                  <>
                    <li>• Natural circadian delay causes 1-2 hour shift in sleep timing</li>
                    <li>• Increased sensitivity to blue light disrupts melatonin production</li>
                    <li>• Often experience chronic sleep debt despite needing 8-10 hours</li>
                  </>
                )}
                {ageGroup === 'adult' && (
                  <>
                    <li>• N3 deep sleep concentrated in first third of night</li>
                    <li>• REM periods lengthen progressively through the night</li>
                    <li>• Complete 4-6 cycles during typical 7-9 hour sleep period</li>
                  </>
                )}
                {ageGroup === 'olderAdult' && (
                  <>
                    <li>• N3 deep sleep declines 2% per decade after age 20</li>
                    <li>• More fragmented sleep with 3-4 awakenings per night</li>
                    <li>• Advanced circadian phase leads to earlier sleep timing</li>
                  </>
                )}
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
                <label className="font-medium">Your Age</label>
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
                    <SelectItem value="0.08">0–2 months (Newborn)</SelectItem>
                    <SelectItem value="0.33">3–5 months (Early Infant)</SelectItem>
                    <SelectItem value="0.71">6–11 months (Late Infant)</SelectItem>
                    <SelectItem value="1.5">12–23 months (Toddler)</SelectItem>
                    <SelectItem value="3">2–4 years (Preschooler)</SelectItem>
                    <SelectItem value="8.5">5–12 years (School Age)</SelectItem>
                    <SelectItem value="15">13–17 years (Adolescent)</SelectItem>
                    <SelectItem value="21.5">18–25 years (Young Adult)</SelectItem>
                    <SelectItem value="45">26–64 years (Adult)</SelectItem>
                    <SelectItem value="70">65+ years (Older Adult)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  Age Group: {ageData.name} | Sleep Cycle: {cycleLength} minutes | Fall asleep time: ~{settings.fallAsleepTime} minutes
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
                        {rec.cycles} complete sleep cycles • {rec.totalSleep}
                      </div>
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
                          } else if (ageGroup === 'earlyInfant' || ageGroup === 'lateInfant') {
                            return `Perfect for infants! ${cycles} cycles aligns with developing circadian rhythms and consolidating sleep patterns.`;
                          } else if (ageGroup === 'adolescent') {
                            return `Ideal for teens! ${cycles} cycles provides sufficient sleep despite natural circadian delay. Research shows teens need 8-10 hours but often get only 6.5-7.5 hours.`;
                          } else if (ageGroup === 'olderAdult') {
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
                {(getAgeGroup(settings.age) === 'earlyInfant' || getAgeGroup(settings.age) === 'lateInfant') && 'By 3 months, circadian rhythms establish and sleep onset shifts to NREM. Cycles lengthen from 60-90 minutes as brain matures.'}
                {getAgeGroup(settings.age) === 'toddler' && 'Sleep cycles solidify to adult-like 90 minutes with NREM reaching 75-80%. Sleep becomes more consolidated at night.'}
                {getAgeGroup(settings.age) === 'preschooler' && 'Sleep architecture becomes increasingly adult-like while maintaining high N3 deep sleep essential for rapid growth and immune development.'}
                {getAgeGroup(settings.age) === 'schoolAge' && 'Cycles extend to 90-110 minutes with continued prioritization of deep sleep for physical development and learning consolidation.'}
                {getAgeGroup(settings.age) === 'adolescent' && 'Biological circadian shift causes natural 1-2 hour delay in sleepiness. Brain becomes more sensitive to blue light disruption.'}
                {(getAgeGroup(settings.age) === 'youngAdult' || getAgeGroup(settings.age) === 'adult') && 'Complete 90-110 minute cycles with 75-80% NREM sleep. Deep sleep concentrates in first third, REM increases later in night.'}
                {getAgeGroup(settings.age) === 'olderAdult' && 'Deep sleep declines 2% per decade after age 20. Sleep becomes fragmented with 3-4 awakenings per night and advanced circadian phase.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}