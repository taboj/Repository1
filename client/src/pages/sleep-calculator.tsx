import { useState, useEffect } from "react";
import { Moon, Sun, AlarmClock, Bell, RotateCcw, ChevronUp, ChevronDown, ArrowUp, Clock, Info, Star, CheckCircle, AlertCircle, XCircle, Target, Bed } from "lucide-react";
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
  
  // UX improvement states
  const [sleepArchitectureExpanded, setSleepArchitectureExpanded] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [showStickyEditButton, setShowStickyEditButton] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Scroll tracking for back-to-top button and sticky edit button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
      setShowStickyEditButton(window.scrollY > 800); // Show sticky edit button after scrolling past recommendations
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll functions
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTimeInput = () => {
    const timeInputSection = document.querySelector('[data-time-input]');
    if (timeInputSection) {
      timeInputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Tooltip component for scientific terms
  const ScienceTooltip = ({ term, definition, children }: { term: string; definition: string; children: React.ReactNode }) => (
    <span className="relative group inline-flex items-center gap-1">
      {children}
      <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-sm md:text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 w-72 text-center shadow-lg">
        <strong>{term}:</strong> {definition}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </span>
  );

  // Quality rating with icons for accessibility
  const QualityBadge = ({ quality }: { quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' }) => {
    const config = {
      EXCELLENT: { icon: Star, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', emoji: '⭐' },
      GOOD: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', emoji: '✅' },
      FAIR: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', emoji: '⚠️' },
      POOR: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', emoji: '❌' }
    };
    
    const { icon: Icon, color, emoji } = config[quality];
    
    return (
      <Badge className={`${color} border-0 text-sm md:text-xs`} aria-label={`Sleep quality rating: ${quality}`}>
        <Icon className="h-3 w-3 mr-1" aria-hidden="true" />
        <span className="mr-1" aria-hidden="true">{emoji}</span>
        {quality}
      </Badge>
    );
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
    setShowResults(true);
  };

  useEffect(() => {
    const timeString = `${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, '0')}`;
    const targetTime = parseTimeString(timeString, selectedTime.period);
    
    let newRecommendations: SleepRecommendation[];
    
    if (calculationMode === 'wakeUp') {
      newRecommendations = calculateOptimalBedtimes(targetTime, settings);
    } else {
      newRecommendations = calculateOptimalWakeTimes(targetTime, settings);
    }
    
    setRecommendations(newRecommendations);
    // Don't auto-show results on dependency changes, only on button click
  }, [calculationMode, selectedTime, settings]);

  // Compact time picker for step 2
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
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={`Increase ${type}`}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="text-2xl md:text-3xl font-bold my-2 min-w-[60px] text-center select-none">
          {type === 'hour' || type === 'minute' ? value.toString().padStart(2, '0') : value}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={decrement}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={`Decrease ${type}`}
        >
          <ChevronDown className="h-4 w-4" />
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
          <button
            onClick={() => setSleepArchitectureExpanded(!sleepArchitectureExpanded)}
            className="w-full flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
            aria-expanded={sleepArchitectureExpanded}
            aria-controls="sleep-architecture-content"
            aria-describedby="sleep-architecture-summary"
          >
            <h4 className="font-semibold text-left">Sleep Architecture: {ageData.name}</h4>
            {sleepArchitectureExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {/* Summary paragraph for Sleep Architecture */}
          <div id="sleep-architecture-summary" className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <strong>Quick Overview:</strong> {ageData.name} sleep cycles last {getCycleLength(settings.age)} minutes with {ageData.remSleepPercentage}% REM sleep. 
              {getAgeGroup(settings.age) === 'newborn' && ' Newborns uniquely start sleep in REM phase for neural development.'}
              {getAgeGroup(settings.age) === 'olderAdult' && ' Sleep becomes lighter with more frequent awakenings.'}
              {(getAgeGroup(settings.age) === 'schoolAge' || getAgeGroup(settings.age) === 'preschooler') && ' High deep sleep supports growth and learning.'}
              {getAgeGroup(settings.age) === 'adolescent' && ' Natural circadian delay shifts bedtime later.'}
              {(getAgeGroup(settings.age) === 'youngAdult' || getAgeGroup(settings.age) === 'adult') && ' Mature sleep architecture with consistent cycles.'}
            </p>
          </div>
          
          {sleepArchitectureExpanded && (
            <div id="sleep-architecture-content" className="mt-6">
          
          {/* Key Sleep Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Total Sleep Duration</div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">{ageData.sleepRange}</div>
            </div>
            <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Cycle Length Range</div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">
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
            <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Average Cycle Duration</div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">{cycleLength} mins</div>
            </div>
            <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">Fall Asleep Time</div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">~{settings.fallAsleepTime} mins</div>
            </div>
          </div>

          {/* Sleep Onset Time with tooltip accessibility */}
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <div className="text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">
              <span 
                tabIndex="0"
                role="tooltip"
                aria-describedby="sleep-onset-tooltip"
                className="border-b border-dotted border-slate-400 cursor-help"
              >
                Sleep Onset Time:
              </span>
              <div id="sleep-onset-tooltip" className="sr-only">The time it takes to transition from wake to the first sleep stage</div>
            </div>
            <div className="text-slate-800 dark:text-slate-100 font-semibold">
              {ageGroup === 'newborn' ? 'Often begins in Active Sleep' :
               ageGroup === 'earlyInfant' ? 'Transitions to NREM, though REM-onset still possible' :
               ageGroup === 'lateInfant' ? 'Technically begins in NREM stage N1, but this stage is very short. Most observable sleep begins in N2.' :
               ageGroup === 'toddler' ? 'Begins in NREM stage N1, quickly transitioning into N2. N1 remains brief but is now consistently present, marking a stable entry into sleep.' :
               ageGroup === 'preschooler' ? 'Begins in NREM stage N1, followed by a longer duration in N2 (light sleep). This is now the consistently most common starting pattern for initiating sleep.' :
               ageGroup === 'schoolAge' ? 'Typically begins in NREM stage N1, quickly followed by N2 (light sleep). This remains the standard and most efficient onset pattern for initiating sleep throughout most of childhood and adulthood.' :
               ageGroup === 'adolescent' ? 'Typically begins in NREM stage N1, quickly progressing to N2 (light sleep), similar to the established pattern observed in school-age children and adults.' :
               ageGroup === 'youngAdult' ? 'Typically begins in NREM stage N1, progressing to N2 within a few minutes. This is the well-established, efficient sleep onset pattern for healthy adults.' :
               ageGroup === 'adult' ? 'Typically begins in NREM stage N1, progressing quickly into N2. This remains the efficient and standard sleep onset pattern for healthy adults.' :
               'Still begins in NREM stage N1, but individuals in this age group may experience an increased sleep onset latency (taking longer to fall asleep).'}
            </div>
          </div>



          {/* Sleep Stage Composition Bar with improved contrast */}
          <div className="mb-6">
            <h5 className="font-medium text-sm mb-3 text-slate-800 dark:text-slate-100">
              <ScienceTooltip term="Sleep Cycle" definition="A complete sequence of sleep stages that repeats throughout the night, typically lasting 90-120 minutes">
                <span>Sleep Stage Composition:</span>
              </ScienceTooltip>
            </h5>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-8 overflow-hidden mb-4">
              <div className="flex h-full">
                {ageGroup === 'newborn' ? (
                  <>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '50%' }}
                      title="Active Sleep (AS): 50%"
                    >
                      <ScienceTooltip term="REM/Active Sleep" definition="Sleep phase that supports memory consolidation, creativity, and emotional processing">
                        <span>Active Sleep (AS)</span>
                      </ScienceTooltip>
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '50%' }}
                      title="Quiet Sleep (QS): 50%"
                    >
                      <span>Quiet Sleep (QS)</span>
                    </div>
                  </>
                ) : ageGroup === 'earlyInfant' ? (
                  <>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '60%' }}
                      title="NREM: 60%"
                    >
                      <span>NREM</span>
                    </div>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '40%' }}
                      title="REM: 40%"
                    >
                      <span>REM</span>
                    </div>
                  </>
                ) : ageGroup === 'lateInfant' ? (
                  <>
                    <div
                      className="bg-gray-400 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '5%' }}
                      title="N1: 5%"
                    >
                      <span className="sr-only">N1</span>
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '40%' }}
                      title="N2: 40%"
                    >
                      <span>N2</span>
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '25%' }}
                      title="N3: 25%"
                    >
                      <span>N3</span>
                    </div>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '30%' }}
                      title="REM: 30%"
                    >
                      <span>REM</span>
                    </div>
                  </>
                ) : ageGroup === 'toddler' || ageGroup === 'preschooler' ? (
                  <>
                    <div
                      className="bg-gray-400 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '5%' }}
                      title="N1: 5%"
                    >
                      <span className="sr-only">N1</span>
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '45%' }}
                      title="N2: 45%"
                    >
                      <span>N2</span>
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '25%' }}
                      title="N3: 25%"
                    >
                      <span>N3</span>
                    </div>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '25%' }}
                      title="REM: 25%"
                    >
                      <span>REM</span>
                    </div>
                  </>
                ) : ageGroup === 'schoolAge' || ageGroup === 'adolescent' ? (
                  <>
                    <div
                      className="bg-gray-400 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '5%' }}
                      title="N1: 5%"
                    >
                      <span className="sr-only">N1</span>
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '50%' }}
                      title="N2: 50%"
                    >
                      <span>N2</span>
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '20%' }}
                      title="N3: 20%"
                    >
                      <span>N3</span>
                    </div>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '25%' }}
                      title="REM: 25%"
                    >
                      <span>REM</span>
                    </div>
                  </>
                ) : ageGroup === 'youngAdult' || ageGroup === 'adult' ? (
                  <>
                    <div
                      className="bg-gray-400 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '5%' }}
                      title="N1: 5%"
                    >
                      <span className="sr-only">N1</span>
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '45%' }}
                      title="N2: 45%"
                    >
                      <span>N2</span>
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '25%' }}
                      title="N3: 25%"
                    >
                      <span>N3</span>
                    </div>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '25%' }}
                      title="REM: 25%"
                    >
                      <span>REM</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="bg-gray-400 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '5%' }}
                      title="N1: 5%"
                    >
                      <span className="sr-only">N1</span>
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '50%' }}
                      title="N2: 50%"
                    >
                      <span>N2</span>
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '15%' }}
                      title="N3: 15%"
                    >
                      <span>N3</span>
                    </div>
                    <div
                      className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: '20%' }}
                      title="REM: 20%"
                    >
                      <span>REM</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {ageGroup === 'newborn' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>Active Sleep (AS): 50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Quiet Sleep (QS): 50%</span>
                  </div>
                </>
              ) : ageGroup === 'earlyInfant' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>NREM: 60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: 40%</span>
                  </div>
                </>
              ) : ageGroup === 'lateInfant' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>N1: ≈5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>N2: ≈40%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600"></div>
                    <span>N3: ≈25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: ≈30%</span>
                  </div>
                </>
              ) : ageGroup === 'toddler' || ageGroup === 'preschooler' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>N1: 5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>N2: 45%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600"></div>
                    <span>N3: 25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: ~25%</span>
                  </div>
                </>
              ) : ageGroup === 'schoolAge' || ageGroup === 'adolescent' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>N1: Approx. 5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>N2: 50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600"></div>
                    <span>N3: 20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: ~25%</span>
                  </div>
                </>
              ) : ageGroup === 'youngAdult' || ageGroup === 'adult' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>N1: Approx. 5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>N2: 45%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600"></div>
                    <span>N3: 25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: ~25%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>N1: Approx. 5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>N2: 50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600"></div>
                    <span>N3: 15–20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: ~20%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Important Section */}
          {ageGroup === 'newborn' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                At this tender age, a newborn's brain is undergoing incredibly rapid development and hasn't yet developed the mature, clear-cut NREM stages (N1, N2, N3) seen in older individuals. Therefore, sleep scientists use the observable categories of "active" and "quiet" sleep as fundamental descriptors. Active Sleep (AS) is the direct precursor and analogous to adult REM sleep, serving similar critical brain development functions, while Quiet Sleep (QS) is analogous to a combined, less differentiated form of adult NREM sleep.
              </p>
            </div>
          )}
          {ageGroup === 'earlyInfant' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This age marks a significant developmental leap in sleep architecture. While N1 remains very short and transitional (often lasting only a few minutes), the functional focus shifts dramatically to the emergence and strengthening of N2 and N3. These stages are more stable and significant, laying the groundwork for the more complex and restorative sleep of later development.
              </p>
            </div>
          )}
          {ageGroup === 'lateInfant' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Sleep at this age becomes remarkably more organized and predictable. All major sleep stages—N1, N2, N3 (deep sleep), and REM—are now consistently present and begin to follow a more predictable, cyclical pattern. This structured sleep is essential for their rapid cognitive and physical development.
              </p>
            </div>
          )}
          {ageGroup === 'toddler' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                By this pivotal age, toddlers consistently cycle through all four major sleep stages (N1, N2, N3, REM) in a predictable and recognizable pattern. Nighttime sleep significantly consolidates, and while naps begin to decrease in frequency (often transitioning from two to one), they remain developmentally essential for managing daytime fatigue and supporting learning.
              </p>
            </div>
          )}
          {ageGroup === 'preschooler' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Sleep architecture is now remarkably well-established in preschoolers. Although the percentage of REM sleep may drop slightly compared to infancy, deep sleep (N3) remains notably high. This sustained presence of deep sleep is crucial for supporting their continued rapid physical growth, immune system development, and the intense cognitive maturation occurring as they learn, play, and explore.
              </p>
            </div>
          )}
          {ageGroup === 'schoolAge' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Sleep at this stage becomes highly stable and very adult-like in its overall architecture. Slow-wave sleep (N3), the deepest stage of NREM, is particularly strong and concentrated during the early part of the night. This robust deep sleep is fundamentally important, supporting the intense physical growth, cellular repair, and significant mental development that characterizes the school-age years.
              </p>
            </div>
          )}
          {ageGroup === 'adolescent' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Adolescents experience a unique and natural biological shift in their circadian rhythm, often referred to as a "sleep phase delay." This causes a tendency towards later sleep onset (feeling tired later) and later wake times. Compounding this, they have significantly increased sleep needs due to the profound and rapid brain development (brain 'rewiring') and intense physical changes occurring during puberty.
              </p>
            </div>
          )}
          {ageGroup === 'youngAdult' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                During this significant life stage, sleep architecture largely stabilizes, reaching its mature form. However, lifestyle choices wield immense influence over sleep quality and duration. Factors such as late nights (socializing, studying), high stress levels (academic, professional), and frequent use of stimulants like caffeine can heavily impact the ability to achieve restorative sleep and maintain optimal health.
              </p>
            </div>
          )}
          {ageGroup === 'adult' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                As adults progress through this broad age range, a key change in sleep architecture is the progressive decrease in deep sleep (N3), especially noticeable after age 40. This natural physiological shift can make sleep feel lighter and potentially more fragmented, with an increased likelihood of brief awakenings throughout the night. Understanding this decline helps manage expectations for sleep quality.
              </p>
            </div>
          )}
          {ageGroup === 'olderAdult' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 font-semibold text-sm mb-2">Important:</div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Older adults commonly experience a natural shift towards lighter, more fragmented sleep. This often involves more frequent awakenings during the night and a tendency for earlier wake times. While total sleep time may decrease slightly, this varies widely based on individual health, lifestyle, and the presence of any underlying sleep disorders or medical conditions.
              </p>
            </div>
          )}

          {/* Research-Based Notes */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-lg">
            <h5 className="font-medium text-sm mb-3">Research-Based Notes:</h5>
            <div className="space-y-3 text-xs">
              {ageGroup === 'newborn' && (
                <>
                  <div>
                    <p><strong>Unique Sleep Onset:</strong> Sleep onset directly into Active Sleep (the newborn equivalent of REM) is a fascinating characteristic unique to newborns. This pattern changes as the brain matures; all other age groups typically begin their sleep cycle with NREM sleep, signaling a shift in sleep architecture and brain organization.</p>
                  </div>
                  <div>
                    <p><strong>Proto-Cycles Defined:</strong> These "proto-cycles" are the fundamental building blocks of newborn sleep. They are short (around 40-60 minutes) and characterized by alternating between active (REM-like) and quiet (NREM-like) sleep patterns. Understanding these basic cycles is key to appreciating a newborn's unique sleep needs.</p>
                  </div>
                  <div>
                    <p><strong>Navigating the 45-Minute Intruder Phenomenon:</strong> High sleep variability is common in this age group, notably the "45-minute intruder" or "false start bedtime." This occurs when babies wake fully instead of smoothly transitioning to the next sleep cycle, often around the 30-45 minute mark. This can be due to factors like hunger (tiny stomachs need frequent refueling), overtiredness (leading to difficulty settling), an inconsistent nighttime schedule, not being tired enough, practicing new skills during sleep, or environmental disruptions.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> If your baby wakes at this mark, try observing them for a few minutes before intervening. Sometimes, they can resettle themselves. Gentle re-settling techniques, ensuring optimal sleep environment (dark, quiet, cool), and addressing hunger are crucial.</p>
                  </div>
                  <div>
                    <p><strong>Emergence of Circadian Rhythm:</strong> Newborns do not yet have a fully developed circadian rhythm—their internal 24-hour body clock. This is because their bodies, particularly their brains and hormone production (like melatonin), are still very immature. Instead of following a predictable day-night cycle, they primarily sleep in short bursts (around 20-50 minutes) and wake up frequently (every 2-3 hours) mainly due to the physiological need for constant feeding to support their incredible growth rates.</p>
                  </div>
                </>
              )}
              {ageGroup === 'earlyInfant' && (
                <>
                  <div>
                    <p><strong>Emergence of True Stages:</strong> This is the crucial period where true REM and NREM sleep stages begin to emerge and consolidate, gradually replacing the less differentiated newborn proto-cycles. This signifies a maturing brain capable of more organized sleep patterns.</p>
                  </div>
                  <div>
                    <p><strong>Strengthening Circadian Rhythms:</strong> Your baby's circadian rhythms are becoming significantly stronger during these months. This leads to longer, more consolidated stretches of nighttime sleep as their bodies begin to produce melatonin more consistently and respond to environmental light cues.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Help reinforce their developing circadian rhythm by exposing them to natural light in the mornings and keeping evenings dim and calm.</p>
                  </div>
                  <div>
                    <p><strong>Gradual Lengthening:</strong> Sleep cycles in this age group gradually lengthen from the newborn proto-cycles, moving closer towards the more mature, adult-like patterns that will be established by around 12 months. This lengthening contributes to longer sleep stretches.</p>
                  </div>
                </>
              )}
              {ageGroup === 'lateInfant' && (
                <>
                  <div>
                    <p><strong>Predictable Sleep Entry:</strong> Babies typically now fall asleep through NREM stage N2 (light sleep) and then progress into deeper N3 and subsequently into REM sleep, mirroring the adult sleep onset pattern.</p>
                  </div>
                  <div>
                    <p><strong>Lengthening Cycles & Consolidation:</strong> Sleep cycles reliably stretch to about 60 minutes during this period. This lengthening is a key factor contributing to more continuous nighttime sleep with fewer awakenings, benefiting both baby and parents.</p>
                  </div>
                  <div>
                    <p><strong>Circadian Rhythm Maturation:</strong> Babies at this age are increasingly syncing with external environmental cues like light and routine. Their maturing circadian rhythm helps regulate their sleep-wake patterns more effectively, making consistent bedtimes and wake times more impactful.</p>
                  </div>
                  <div>
                    <p><strong>Developmental Milestones & Sleep:</strong> Significant physical and cognitive milestones (like crawling, sitting up, babbling, early object permanence) can temporarily disrupt sleep. These are often signs of healthy development, not necessarily sleep problems.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Maintain consistency with sleep routines during these phases. Offer extra comfort and practice new skills during awake times to minimize nighttime interference.</p>
                  </div>
                </>
              )}
              {ageGroup === 'toddler' && (
                <>
                  <div>
                    <p><strong>Reliable Cycle Lengths:</strong> Sleep cycles are now reliably 60–75 minutes long, showing a clear progression towards the more structured and efficient sleep patterns that closely resemble adult sleep architecture.</p>
                  </div>
                  <div>
                    <p><strong>Prominent Deep Sleep (N3):</strong> Deep sleep (N3) remains notably prominent, especially in the early part of the night's sleep cycles. This is absolutely crucial for the rapid physical growth, cellular repair, and energy restoration toddlers undergo during this period.</p>
                  </div>
                  <div>
                    <p><strong>REM's Cognitive Role:</strong> As language and memory skills rapidly develop, REM sleep becomes increasingly important for emotional processing, cognitive development, and the integration of new information learned throughout their busy day.</p>
                  </div>
                  <div>
                    <p><strong>Developmental Milestones & Sleep:</strong> It's common for nap resistance or night awakenings to occur around this age, often relating to significant developmental milestones like walking, talking, or asserting independence. These are typically normal developmental phases, not necessarily signs of sleep disorders.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Maintaining a consistent bedtime routine and providing ample opportunities for skill practice during the day can help minimize nighttime disruptions. Stay calm and consistent during wakings.</p>
                  </div>
                </>
              )}
              {ageGroup === 'preschooler' && (
                <>
                  <div>
                    <p><strong>Lengthening Cycles:</strong> Sleep cycles are now reliably ~80 minutes long, indicating a more efficient and mature sleep system that supports longer, more consolidated sleep periods.</p>
                  </div>
                  <div>
                    <p><strong>Dominant Deep Sleep:</strong> Deep sleep (N3) continues to be dominant and highly concentrated in the first half of the night. This is essential for robust physical growth, cellular repair, and optimizing the immune system as preschoolers are exposed to new environments and challenges.</p>
                  </div>
                  <div>
                    <p><strong>REM for Emotional and Cognitive Growth:</strong> REM sleep plays a vital role in helping preschoolers process emotions, integrate new language skills, and solidify social learning. This stage supports their burgeoning imagination and complex thought.</p>
                  </div>
                  <div>
                    <p><strong>Common Sleep Challenges:</strong> Nightmares and bedtime resistance are common during this period due to preschoolers' blossoming imaginations, growing independence, and exposure to new social experiences. These are normal developmental occurrences.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> A consistent, calming bedtime routine is crucial. Address fears gently, ensure a secure sleep environment, and maintain clear boundaries around bedtime.</p>
                  </div>
                </>
              )}
              {ageGroup === 'schoolAge' && (
                <>
                  <div>
                    <p><strong>Deep Sleep Concentration:</strong> Slow-wave sleep (N3) is more concentrated and dominant within the first 2–3 sleep cycles of the night. This early surge of deep sleep maximizes its benefits for physical restoration and cognitive consolidation after a day of intense learning and activity.</p>
                  </div>
                  <div>
                    <p><strong>REM Density Increase:</strong> REM sleep density, the amount of REM activity, typically increases in later cycles, especially towards morning. This shift supports the processing of complex information and emotional regulation as the child prepares for the waking day.</p>
                  </div>
                  <div>
                    <p><strong>Critical Routines for Performance:</strong> Establishing consistent bedtimes and implementing screen-free wind-down routines are critically important for school-age children. These practices significantly contribute to optimal cognitive performance (academic success), improved mood regulation, and overall well-being.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Create a relaxing 30-60 minute pre-bed routine (reading, quiet play, bath) and ensure all screens are off at least an hour before bedtime.</p>
                  </div>
                </>
              )}
              {ageGroup === 'adolescent' && (
                <>
                  <div>
                    <p><strong>Lengthened Sleep Cycles:</strong> Sleep cycles in adolescence lengthen to approximately ~100 minutes, reflecting the ongoing maturation of the sleep system and preparing for adult sleep patterns.</p>
                  </div>
                  <div>
                    <p><strong>Gradual Decline of Deep Sleep:</strong> Deep sleep (N3) gradually begins to decrease in overall proportion compared to childhood, yet it remains critically important for physical recovery and brain development during this demanding growth phase.</p>
                  </div>
                  <div>
                    <p><strong>REM for Emotional Regulation:</strong> REM sleep plays an especially vital role in supporting emotional regulation during adolescence. This is a period of significant hormonal changes, heightened social pressures, and intense emotional processing. REM helps integrate these experiences.</p>
                  </div>
                  <div>
                    <p><strong>Significant Sleep Disruptors:</strong> Social activities, academic pressures (homework, early school starts), and prevalent screen use (phones, computers) are major factors that often disrupt both the quantity and quality of adolescent sleep.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Encourage a consistent sleep schedule even on weekends (avoiding major "sleep ins"), create a technology-free bedroom, and prioritize sleep as essential for academic success and mental well-being.</p>
                  </div>
                </>
              )}
              {ageGroup === 'youngAdult' && (
                <>
                  <div>
                    <p><strong>Mature Sleep Cycles:</strong> Sleep cycles in young adults average approximately ~105 minutes, indicating that sleep architecture has largely matured and is consistently aligning with mature adult patterns.</p>
                  </div>
                  <div>
                    <p><strong>Deep Sleep Trends:</strong> While still relatively high compared to later adulthood, deep sleep (N3) begins a subtle, gradual decline compared to adolescence. Maintaining sufficient N3 is still vital for physical recovery and cognitive function.</p>
                  </div>
                  <div>
                    <p><strong>Persistent High REM Demand:</strong> Young adults often experience a high demand for REM sleep. This is crucial for supporting the complex cognitive, emotional, and creative processes involved in higher education, career development, and navigating intricate social relationships. REM aids in consolidating complex information and emotional experiences.</p>
                  </div>
                  <div>
                    <p><strong>Lifestyle Impact:</strong> The demands of young adulthood (academics, career building, social life) often lead to irregular sleep schedules and sleep deprivation.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Prioritize sleep as much as diet and exercise. Establish a consistent sleep schedule, create a relaxing wind-down routine, and limit screen time before bed to optimize sleep quality and support overall well-being.</p>
                  </div>
                </>
              )}
              {ageGroup === 'adult' && (
                <>
                  <div>
                    <p><strong>Average Cycle Length:</strong> The average adult sleep cycle lasts approximately ~96 minutes. While traditional teaching often cites 90 minutes, large-scale studies analyzing thousands of sleep cycles reveal a median duration of 96 minutes across over 6,000 recorded cycles. Furthermore, recent advanced research indicates that sleep cycles typically range from 95-130 minutes, with a median of 110 minutes, highlighting the natural variability in individual sleep patterns.</p>
                  </div>
                  <div>
                    <p><strong>Decreased Sleep Efficiency:</strong> A common observation in this age group is a decrease in sleep efficiency. This means more time spent awake in bed and an increased number of nighttime awakenings, along with a higher proportion of lighter sleep stages compared to deeper sleep.</p>
                  </div>
                  <div>
                    <p><strong>Stable REM and N2:</strong> Despite changes in N3, the proportions of REM and N2 sleep generally remain stable across much of this age range. These stages continue to be vital for supporting mental clarity, effective problem-solving, and healthy emotion regulation—all crucial for managing daily responsibilities and stress.</p>
                  </div>
                  <div>
                    <p><strong>Impact of Lifestyle & Health:</strong> Chronic stress, demanding careers, family responsibilities, and the onset of various health conditions can significantly impact sleep quality in adults.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Prioritize sleep hygiene: maintain a consistent sleep schedule, create a dark/quiet/cool sleep environment, limit caffeine/alcohol before bed, and integrate stress-reducing practices like mindfulness.</p>
                  </div>
                </>
              )}
              {ageGroup === 'olderAdult' && (
                <>
                  <div>
                    <p><strong>Increased Sleep Fragmentation:</strong> Sleep becomes notably more fragmented with increasing age, characterized by shorter, less consolidated cycles and a significant reduction in slow-wave (deep) sleep (N3). This fragmentation can lead to less restorative sleep.</p>
                  </div>
                  <div>
                    <p><strong>Essential but Lighter REM:</strong> While the total amount of REM sleep may decrease and become lighter, it remains an essential stage. It continues to play a vital role in emotional processing, long-term memory consolidation, and overall neural maintenance and brain health, even in advanced age.</p>
                  </div>
                  <div>
                    <p><strong>Compensatory Napping:</strong> Daytime napping often becomes more common in older adults. This is frequently a compensatory mechanism to address the reduced deep sleep and increased fragmentation experienced during nighttime sleep, helping to manage daytime fatigue.</p>
                  </div>
                  <div>
                    <p><strong>Circadian Rhythm Shifts:</strong> Circadian rhythms may naturally shift (often termed "advanced sleep phase"), leading to earlier bedtimes and earlier wake times. However, external factors like social isolation, reduced light exposure, and medication can also influence these shifts.</p>
                  </div>
                  <div>
                    <p><strong>Actionable Tip:</strong> Maintain a consistent sleep schedule, ensure adequate light exposure during the day (especially morning light), and manage underlying health conditions that may impact sleep. Consult a doctor for persistent sleep issues.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recommended Wake Time */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">Recommended Wake Time:</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              {ageGroup === 'newborn' ? 'At the end of a full ~45-min proto-cycle, ideally during light Quiet Sleep. This is generally the easiest time to wake your baby, as they are transitioning out of a sleep state, making the wake-up smoother and less disruptive for both parent and child.' :
               ageGroup === 'earlyInfant' ? 'Align with the light sleep stage at the end of a full ~50-minute cycle. Waking during a light sleep stage helps to avoid waking them from deep sleep, which can lead to grogginess or fussiness.' :
               ageGroup === 'lateInfant' ? 'At the end of a full ~60-minute cycle, ideally during light N2. Waking during this lighter stage makes the transition smoother and helps avoid the grogginess and fussiness often associated with being roused from deep sleep.' :
               ageGroup === 'toddler' ? 'Aim to wake at the end of a full ~70-minute cycle, ideally during N2 (light sleep). This timing helps to avoid waking them from deep sleep or active REM, which can lead to notable grogginess, fussiness, or "sleep inertia" in toddlers.' :
               ageGroup === 'preschooler' ? 'Wake at the end of a full ~80-minute cycle, ideally during N2 (light sleep). This strategy is key to avoiding waking from deep sleep or active REM, which can lead to significant grogginess, disorientation, and prolonged crankiness in preschoolers.' :
               ageGroup === 'schoolAge' ? 'Wake at the end of a full ~90-minute cycle, ideally during N2 (light sleep). This precise timing is optimized to help prevent sleep inertia—that lingering grogginess and morning fatigue—ensuring they wake feeling refreshed and ready for school and daily activities.' :
               ageGroup === 'adolescent' ? 'Wake at the end of a full ~100-minute cycle, ideally during N2 (light sleep). This precise timing is crucial to minimize sleep inertia (that heavy, groggy feeling) and effectively support daytime alertness, concentration, and mood, which are essential for academic performance and social functioning.' :
               ageGroup === 'youngAdult' ? 'Best to wake at the end of a ~105-minute cycle, during N2 (light sleep). Waking during this lighter stage is proven to significantly reduce "sleep inertia" (that groggy, disoriented feeling upon waking) and improve clarity, alertness, and mood immediately upon rising.' :
               ageGroup === 'adult' ? 'Wake during light N2 at the end of a full ~96-minute cycle for optimal alertness and significantly reduced sleep inertia. This timing helps you feel most refreshed and ready to tackle the day\'s demands.' :
               'Aim to wake at the end of a full ~95-minute sleep cycle, ideally during light N2 sleep. This strategy provides the best chances of feeling refreshed and minimizes the impact of sleep inertia, supporting daily function and well-being.'}
            </p>
          </div>

          {/* Sleep Stage Functions (Research-Based) */}
          <div className="border-t border-border pt-4">
            <h5 className="font-medium text-sm mb-3">Sleep Stage Functions (Research-Based):</h5>
            <div className="space-y-4 text-sm">
              {ageGroup === 'newborn' && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">Active Sleep:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          This is the newborn equivalent of REM sleep, where the brain is highly active, resembling wakefulness. You might observe rapid eye movements, twitching, and vocalizations. This stage is supremely critical for rapid brain maturation, the formation of new neural connections (synapses), and the overall development of the nervous system. It's where the brain actively processes and consolidates new experiences, even those experienced in utero.
                        </p>
                      </div>
                      <div className="text-xs font-medium">50%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">Quiet Sleep:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Comparable to NREM sleep in adults, this phase sees the newborn become very still with deep, regular breathing. While lacking the defined NREM sub-stages of older individuals, Quiet Sleep provides essential basic restorative functions and vital physical rest, supporting the immense physical growth occurring in this period.
                        </p>
                      </div>
                      <div className="text-xs font-medium">50%</div>
                    </div>
                  </div>
                </>
              )}
              {ageGroup === 'earlyInfant' && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">REM:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Continues to be vital for active memory consolidation of the day's new experiences and supports the early brain development essential for cognitive leaps like recognizing faces and responding to sounds.
                        </p>
                      </div>
                      <div className="text-xs font-medium">40%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">Non-REM:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          With the emergence of N2 and N3, Non-REM sleep begins to provide more significant physical restoration and deeper rest. This is crucial as babies become more active and start developing motor skills.
                        </p>
                      </div>
                      <div className="text-xs font-medium">60%</div>
                    </div>
                  </div>
                </>
              )}
              {ageGroup === 'lateInfant' && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-gray-400 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N1 Sleep (≈5%):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          A very brief, light entry point into sleep—the transitional phase where the brain begins to slow down. It's easily disrupted, meaning even small sounds can cause a baby to stir.
                        </p>
                      </div>
                      <div className="text-xs font-medium">≈5%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N2 Sleep (≈40%):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          This is the most frequent and dominant stage of sleep at this age. It's crucial for supporting learning, memory consolidation (like remembering faces and routines), and the development of motor skills (such as rolling and crawling).
                        </p>
                      </div>
                      <div className="text-xs font-medium">≈40%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-indigo-600 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N3 Sleep (≈25%):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Also known as deep or slow-wave sleep, this stage is essential for physical growth (with growth hormone release), immune system support, and significant physical recovery from their active days.
                        </p>
                      </div>
                      <div className="text-xs font-medium">≈25%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">REM Sleep (≈30%):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          During REM sleep, the baby's brain is highly active. This stage plays a vital role in language development, emotional regulation (processing new stimuli), and integrating and processing daytime experiences, laying the groundwork for complex cognitive functions.
                        </p>
                      </div>
                      <div className="text-xs font-medium">≈30%</div>
                    </div>
                  </div>
                </>
              )}
              {(ageGroup === 'toddler' || ageGroup === 'preschooler') && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-gray-400 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N1 ({ageGroup === 'toddler' ? 'Light Transition' : 'Transition Sleep'}):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'toddler' ? 'A brief, essential gateway from wakefulness into sleep. While not deeply restorative, it\'s necessary for entry into the sleep cycle and is the stage from which toddlers are most easily aroused.' : 'A quick entry phase that gently prepares the brain and body for deeper rest. It\'s a very light stage from which a child can be easily awakened.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">5%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N2 ({ageGroup === 'toddler' ? 'Light Sleep' : 'Light Sleep'}):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'toddler' ? 'This prominent stage is critical for consolidating motor skill memory (like walking and climbing), aids in emotional regulation (processing big toddler feelings), and is the ideal stage for a smoother waking transition.' : 'This prominent stage is crucial for the development of motor skill memory, supports emotional regulation (helping them manage their increasingly complex feelings), and prepares the brain for new memory consolidation.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">45%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-indigo-600 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N3 ({ageGroup === 'toddler' ? 'Deep Sleep' : 'Deep Sleep'}):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'toddler' ? 'Often called slow-wave sleep, N3 is the powerhouse of physical restoration. It strongly promotes growth hormone release, supports the immune system, and facilitates crucial brain detoxification processes that clear metabolic waste.' : 'The primary driver of physical growth, immune system strength, and brain recovery from the day\'s energetic activities. This restorative stage is when the body undertakes significant repair and regeneration.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">25%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">REM:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'toddler' ? 'This active brain state significantly boosts language acquisition and vocabulary building, enhances emotional processing of their complex world, and aids in memory integration of all the new skills and concepts they\'re absorbing.' : 'Actively helps with emotional processing, fuels imagination and creative play, and hones early problem-solving abilities as the child processes and consolidates their learning.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">~25%</div>
                    </div>
                  </div>
                </>
              )}
              {(ageGroup === 'schoolAge' || ageGroup === 'adolescent') && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-gray-400 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N1 (Transition Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'schoolAge' ? 'A brief, delicate bridge from wakefulness into deeper sleep stages. It represents minimal physiological changes but is a necessary entry point into the sleep cycle.' : 'The initial, light stage that prepares the brain for the deeper sleep stages. It\'s brief and signals the onset of the sleep cycle.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">Approx. 5%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N2 (Light Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'schoolAge' ? 'This prominent and abundant stage is crucial for learning retention (solidifying new academic information), refining motor coordination, and integrating daily memories and skills.' : 'Important for memory processing, particularly for procedural memories (skills and habits), and learning consolidation of the day\'s academic material and social interactions.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">50%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-indigo-600 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N3 (Deep Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'schoolAge' ? 'The primary stage for promoting growth hormone release, bolstering immune function against illnesses, and facilitating long-term memory consolidation, especially for declarative memories (facts and events).' : 'Supports profound physical restoration and recovery from sports and growth spurts, enhances immune function, and contributes to crucial brain plasticity—the brain\'s ability to reorganize itself by forming new neural connections.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">20%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">REM:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'schoolAge' ? 'Highly active for the brain, REM sleep enhances creativity, sharpens emotional regulation skills (critical for social interactions), and supports problem-solving skills as children process complex social and academic challenges.' : 'Absolutely critical for emotional regulation during a turbulent phase of development, sharpens social cognition (understanding social cues), and fuels creative problem-solving as adolescents navigate complex personal and academic challenges.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">~25%</div>
                    </div>
                  </div>
                </>
              )}
              {(ageGroup === 'youngAdult' || ageGroup === 'adult') && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-gray-400 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N1 (Transition Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'youngAdult' ? 'A brief, initial stage that effectively initiates sleep. It\'s a very light phase, making it easy to wake from, but it\'s essential for entering the sleep cycle.' : 'The lightest stage of sleep, serving as a rapid bridge into deeper sleep. It\'s the most fragile stage and from which individuals are most prone to disruption and awakening.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">Approx. 5%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N2 (Light Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'youngAdult' ? 'This highly prevalent stage maintains daytime alertness, significantly aids in memory processing (especially for new facts and experiences), and supports motor learning (refining physical skills).' : 'This dominant stage supports procedural memory (how-to skills), consolidates motor skills, and processes sensory information from the day. It\'s crucial for maintaining general cognitive function and alertness.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">45%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-indigo-600 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N3 (Deep Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'youngAdult' ? 'Crucial for profound physical recovery from daily activities, robust immune function (helping the body fight off illness), and essential cell repair and regeneration throughout the body.' : 'Though it declines with age, N3 remains crucial for tissue growth and repair, robust immune support, and fundamental energy restoration at the cellular level.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">25%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">REM:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ageGroup === 'youngAdult' ? 'Actively enhances emotional intelligence, fuels creative thinking, and fosters mental flexibility needed to adapt to new situations and solve complex problems in academic and professional settings.' : 'Promotes emotional stability and resilience, facilitates learning new complex information, and supports the creative integration of new ideas and experiences, which is vital for adaptability and innovation.'}
                        </p>
                      </div>
                      <div className="text-xs font-medium">~25%</div>
                    </div>
                  </div>
                </>
              )}
              {ageGroup === 'olderAdult' && (
                <>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-gray-400 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N1 (Transition Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          This lightest stage is highly prone to disruption and frequent awakenings. It primarily serves as the entry point into the sleep architecture.
                        </p>
                      </div>
                      <div className="text-xs font-medium">Approx. 5%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N2 (Light Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Still the dominant sleep stage, N2 is crucial for maintaining cognitive function and alertness, supporting sensory memory, and facilitating basic day-to-day alertness.
                        </p>
                      </div>
                      <div className="text-xs font-medium">50%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-indigo-600 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">N3 (Deep Sleep):</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Although less prevalent than in younger adults, N3 continues to aid in immune repair, regulate glucose metabolism, and contribute to overall physical restoration and vitality.
                        </p>
                      </div>
                      <div className="text-xs font-medium">15–20%</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium">REM:</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Continues to be vital for emotional processing, particularly for navigating life changes and managing mood, for long-term memory consolidation, and for essential neural maintenance and brain plasticity, contributing to cognitive resilience.
                        </p>
                      </div>
                      <div className="text-xs font-medium">~20%</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
            </div>
          )}
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
        {/* Main Input Section - Redesigned 3-Step Flow */}
        <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Customize Your Sleep Goal</h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Choose when you want to sleep or wake up, then personalize your recommendations
              </p>
            </div>

            <div className="space-y-12">
              {/* Step 1: Select Goal */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">Step 1: Select Goal</h3>
                  <p className="text-base text-gray-600 dark:text-gray-300">What would you like to plan?</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {/* Wake Up Button Card */}
                  <Button
                    variant={calculationMode === 'wakeUp' ? 'default' : 'outline'}
                    onClick={() => setCalculationMode('wakeUp')}
                    className={`h-auto p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      calculationMode === 'wakeUp' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0' 
                        : 'bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-600'
                    }`}
                    aria-label="Plan when to wake up"
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Sun className="h-8 w-8" />
                      <div>
                        <div className="text-lg font-bold">I want to wake up at...</div>
                        <div className="text-sm opacity-90">Plan my bedtime</div>
                      </div>
                    </div>
                  </Button>

                  {/* Go to Bed Button Card */}
                  <Button
                    variant={calculationMode === 'bedTime' ? 'default' : 'outline'}
                    onClick={() => setCalculationMode('bedTime')}
                    className={`h-auto p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      calculationMode === 'bedTime' 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0' 
                        : 'bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-slate-600'
                    }`}
                    aria-label="Plan when to go to bed"
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Moon className="h-8 w-8" />
                      <div>
                        <div className="text-lg font-bold">I want to go to bed now...</div>
                        <div className="text-sm opacity-90">Plan my wake time</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Step 2: Choose Time */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">Step 2: Select Time</h3>
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    {calculationMode === 'wakeUp' ? 'When do you want to wake up?' : 'What time are you going to bed?'}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="w-full max-w-md bg-gray-50 dark:bg-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-center gap-4">
                      <TimeWheel
                        value={selectedTime.hour}
                        onChange={(hour) => setSelectedTime(prev => ({ ...prev, hour }))}
                        max={12}
                        type="hour"
                      />
                      <div className="text-2xl md:text-3xl font-bold text-muted-foreground">:</div>
                      <TimeWheel
                        value={selectedTime.minute}
                        onChange={(minute) => setSelectedTime(prev => ({ ...prev, minute }))}
                        max={45}
                        type="minute"
                      />
                      <PeriodWheel />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Personalization */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">Step 3: Personalization</h3>
                  <p className="text-base text-gray-600 dark:text-gray-300">Help us customize your sleep recommendations</p>
                </div>

                <div className="max-w-md mx-auto bg-gray-50 dark:bg-slate-700 rounded-2xl p-6">
                  <div className="space-y-4">
                    <label htmlFor="age-select" className="block text-lg font-semibold text-gray-800 dark:text-white">
                      Your Age
                    </label>
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
                      <SelectTrigger id="age-select" className="w-full h-12 text-base" aria-label="Select your age range">
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
              </div>

              {/* Calculate Button */}
              <div className="text-center pt-6">
                <Button 
                  onClick={updateRecommendations}
                  className="px-12 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <AlarmClock className="mr-3 h-6 w-6" />
                  Calculate Sleep Times
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        <div 
          id="resultsContainer" 
          className={`transition-all duration-500 ease-in-out ${
            showResults && recommendations.length > 0 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
        {recommendations.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/95 dark:bg-slate-800/95 rounded-2xl transition-all duration-300 hover:shadow-2xl">
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                    {calculationMode === 'wakeUp' ? 'Recommended Bedtimes' : 'Recommended Wake Times'}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalculationMode(calculationMode === 'wakeUp' ? 'bedTime' : 'wakeUp')}
                  className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md border-2"
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
                <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/30 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">Sleep Cycle Science</h4>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 text-base text-gray-700 dark:text-gray-200">
                    <div className="space-y-2">
                      <span className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Star className="h-4 w-4" /> EXCELLENT (5-6 cycles):
                      </span>
                      <p>Optimal sleep duration that aligns with natural circadian rhythms and allows complete recovery.</p>
                    </div>
                    <div className="space-y-2">
                      <span className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> FAIR (4 or 7+ cycles):
                      </span>
                      <p>Either insufficient sleep time or potential oversleeping that may disrupt natural wake cycles.</p>
                    </div>
                    <div className="space-y-2">
                      <span className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <XCircle className="h-4 w-4" /> POOR (≤3 cycles):
                      </span>
                      <p>Dangerously insufficient sleep that impairs cognitive function, immune system, and overall health.</p>
                    </div>
                  </div>
                </div>

                {/* Edit Wake-up Time Button */}
                <div className="flex justify-center mt-8">
                  <Button
                    variant="default"
                    onClick={scrollToTimeInput}
                    className="gap-3 text-lg px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    aria-label="Scroll to time input section to edit wake-up time"
                  >
                    <AlarmClock className="h-5 w-5" aria-hidden="true" />
                    Edit wake-up time
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Age-Specific Educational Section with Collapsible Analysis */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <Moon className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Sleep Science for {ageData.name}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnalysisExpanded(!analysisExpanded)}
                className="shrink-0 transition-all duration-300 hover:scale-110 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-xl p-3"
                aria-expanded={analysisExpanded}
                aria-controls="analysis-content"
                aria-label={`${analysisExpanded ? 'Collapse' : 'Expand'} detailed sleep analysis`}
              >
                {analysisExpanded ? (
                  <ChevronUp className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
            
            {/* Summary always visible */}
            <div className="mb-6 p-6 bg-white/70 dark:bg-slate-700/70 rounded-xl border border-white/50 dark:border-slate-600/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0 mt-1">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg text-slate-800 dark:text-slate-100 leading-relaxed">
                  <strong className="text-blue-700 dark:text-blue-300">Quick Facts:</strong> {ageData.name} need {ageData.sleepRange} of sleep with cycles lasting {getCycleLength(settings.age)} minutes.
                  {getAgeGroup(settings.age) === 'newborn' && ' Newborns have unique sleep patterns starting with REM.'}
                  {getAgeGroup(settings.age) === 'adolescent' && ' Natural circadian shift delays bedtime by 1-2 hours.'}
                  {(getAgeGroup(settings.age) === 'youngAdult' || getAgeGroup(settings.age) === 'adult') && ' Mature sleep architecture with consistent 90-110 minute cycles.'}
                  {getAgeGroup(settings.age) === 'olderAdult' && ' Sleep becomes lighter with more frequent night awakenings.'}
                </p>
              </div>
            </div>

            {analysisExpanded && (
              <div id="analysis-content" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Age-Specific Sleep Patterns</h3>
                    <div className="space-y-2">
                      <div className="text-base md:text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">Recommended sleep:</span> {ageData.sleepRange}
                      </div>
                      <div className="text-base md:text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">Cycle length:</span> {cycleLength} minutes (scientifically determined)
                      </div>
                      <div className="text-base md:text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">REM sleep:</span> {ageData.remSleepPercentage}% of total sleep
                      </div>
                      <div className="text-base md:text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">Deep sleep:</span> {ageData.deepSleepPercentage}% of total sleep
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">Key Characteristics</h4>
                    <ul className="text-base md:text-sm text-slate-700 dark:text-slate-200 space-y-1">
                      {ageData.characteristics.map((characteristic, index) => (
                        <li key={index}>• {characteristic}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Research insights with improved contrast for WCAG AA compliance */}
                <details className="mt-4">
                  <summary className="cursor-pointer p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-base md:text-sm">Research-Based Sleep Insights</span>
                  </summary>
                  <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                    <p className="text-base md:text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                      <strong>Scientific Overview:</strong> Sleep architecture evolves dramatically across the lifespan. {' '}
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
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleep Architecture Component is now embedded within the Sleep Cycle Visualization */}
        </div>

        {/* Floating Edit Wake-up Time Button */}
        <Button
          onClick={scrollToTimeInput}
          className={`fixed top-6 right-6 z-40 shadow-xl transition-all duration-500 text-base px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-110 hover:shadow-2xl ${
            showStickyEditButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
          }`}
          size="sm"
          aria-label="Edit wake-up time (floating button)"
          tabIndex={showStickyEditButton ? 0 : -1}
        >
          <AlarmClock className="h-5 w-5 mr-2" aria-hidden="true" />
          Edit Time
        </Button>

        {/* Back to Top Button with enhanced styling */}
        <Button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 md:w-16 md:h-16 shadow-xl transition-all duration-500 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-110 hover:shadow-2xl ${
            showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          size="icon"
          title="Back to top"
          aria-label="Scroll to top of page"
          tabIndex={showBackToTop ? 0 : -1}
        >
          <ArrowUp className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}