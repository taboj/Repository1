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

  // Update fall asleep time automatically when age changes and hide results
  useEffect(() => {
    const calculatedFallAsleepTime = getFallAsleepTime(settings.age);
    setSettings(prev => ({ 
      ...prev, 
      fallAsleepTime: calculatedFallAsleepTime 
    }));
    // Hide results when age changes
    setShowResults(false);
  }, [settings.age]);
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);
  
  // UX improvement states
  const [sleepArchitectureExpanded, setSleepArchitectureExpanded] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [researchNotesExpanded, setResearchNotesExpanded] = useState(false);
  const [showStickyEditButton, setShowStickyEditButton] = useState(false);
  const [scientificInsightsExpanded, setScientificInsightsExpanded] = useState(false);
  const [stageFunctionsExpanded, setStageFunctionsExpanded] = useState(false);

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
    const mainInputSection = document.querySelector('[data-main-input]');
    if (mainInputSection) {
      mainInputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Scroll to results after a brief delay to allow DOM to update with header offset
    setTimeout(() => {
      const resultsContainer = document.querySelector('#resultsContainer');
      if (resultsContainer) {
        const yOffset = -80; // Header height offset
        const y = resultsContainer.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
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
        <div className="text-[30px] font-bold my-2 min-w-[60px] text-center select-none">
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
        <div className="text-[30px] font-bold my-4 min-w-[80px] text-center select-none">
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
            <div id="sleep-architecture-content" className="mt-6 space-y-6">
          
          {/* Key Sleep Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="text-xs text-blue-600 dark:text-blue-300 mb-1 font-medium">💤 Recommended Sleep per 24h</div>
              <div className="font-bold text-blue-800 dark:text-blue-100 text-lg">{ageData.sleepRange}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="text-xs text-purple-600 dark:text-purple-300 mb-1 font-medium">⏱️ Cycle Length Range</div>
              <div className="font-bold text-purple-800 dark:text-purple-100 text-lg">
                {ageGroup === 'newborn' ? '40-50 mins' : 
                 ageGroup === 'earlyInfant' ? '45-55 mins' :
                 ageGroup === 'lateInfant' ? '50-65 mins' :
                 ageGroup === 'toddler' ? '60-75 mins' :
                 ageGroup === 'preschooler' ? '70-85 mins' :
                 ageGroup === 'schoolAge' ? '85-95 mins' :
                 ageGroup === 'adolescent' ? '90-110 mins' :
                 ageGroup === 'youngAdult' ? '90-120 mins' :
                 ageGroup === 'adult' ? '90-120 mins' : '90-110 mins'}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="text-xs text-green-600 dark:text-green-300 mb-1 font-medium">🔄 Average Cycle Duration</div>
              <div className="font-bold text-green-800 dark:text-green-100 text-lg">{cycleLength} mins</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <div className="text-xs text-orange-600 dark:text-orange-300 mb-1 font-medium">⌛ Fall Asleep Time</div>
              <div className="font-bold text-orange-800 dark:text-orange-100 text-lg">~{settings.fallAsleepTime} mins</div>
            </div>
          </div>

          {/* Sleep Onset Flow Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🛏️</span>
              <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">Sleep Onset Flow</h3>
            </div>
            <div className="text-indigo-700 dark:text-indigo-300 font-medium mb-2">
              How Sleep Begins:
            </div>
            <div className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
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



          {/* Sleep Stage Composition with Donut Chart */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <button
              onClick={() => setSleepArchitectureExpanded(!sleepArchitectureExpanded)}
              className="w-full flex items-center justify-between mb-4"
              aria-expanded={sleepArchitectureExpanded}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h3 className="font-bold text-xl text-purple-800 dark:text-purple-200">
                  <ScienceTooltip term="Sleep Cycle" definition="A complete sequence of sleep stages that repeats throughout the night, typically lasting 90-120 minutes">
                    <span>Sleep Stage Composition</span>
                  </ScienceTooltip>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-purple-600 dark:text-purple-400">
                  {sleepArchitectureExpanded ? 'Hide' : 'Show more'}
                </span>
                {sleepArchitectureExpanded ? (
                  <ChevronUp className="h-5 w-5 text-purple-600 dark:text-purple-400 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-600 dark:text-purple-400 transition-transform duration-200" />
                )}
              </div>
            </button>
            
            {sleepArchitectureExpanded && (
            <div className="space-y-6">
            {/* Donut Chart Container */}
            <div className="flex flex-col lg:flex-row items-center gap-6 mb-6">
              {/* Simple Donut Chart using CSS */}
              <div className="relative w-48 h-48 mx-auto lg:mx-0">
                <div className="absolute inset-0 rounded-full" style={{
                  background: ageGroup === 'newborn' ? 
                    `conic-gradient(#a855f7 0% 50%, #3b82f6 50% 100%)` :
                    ageGroup === 'earlyInfant' ?
                    `conic-gradient(#3b82f6 0% 60%, #a855f7 60% 100%)` :
                    ageGroup === 'lateInfant' ?
                    `conic-gradient(#9ca3af 0% 5%, #3b82f6 5% 45%, #4f46e5 45% 70%, #a855f7 70% 100%)` :
                    (ageGroup === 'toddler' || ageGroup === 'preschooler') ?
                    `conic-gradient(#9ca3af 0% 5%, #3b82f6 5% 50%, #4f46e5 50% 75%, #a855f7 75% 100%)` :
                    (ageGroup === 'schoolAge' || ageGroup === 'adolescent') ?
                    `conic-gradient(#9ca3af 0% 5%, #3b82f6 5% 55%, #4f46e5 55% 75%, #a855f7 75% 100%)` :
                    (ageGroup === 'youngAdult' || ageGroup === 'adult') ?
                    `conic-gradient(#9ca3af 0% 5%, #3b82f6 5% 50%, #4f46e5 50% 75%, #a855f7 75% 100%)` :
                    `conic-gradient(#9ca3af 0% 5%, #3b82f6 5% 55%, #4f46e5 55% 70%, #a855f7 70% 90%)`
                }}>
                </div>
                {/* Center hole for donut effect */}
                <div className="absolute inset-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">One Cycle</div>
                    <div className="font-bold text-sm">{cycleLength} mins</div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-3">
                {ageGroup === 'newborn' ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-purple-800 dark:text-purple-200">🧠 Active Sleep (AS)</div>
                        <div className="text-sm text-purple-600 dark:text-purple-300">50% - Critical for neural maturation</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-800 dark:text-blue-200">💤 Quiet Sleep (QS)</div>
                        <div className="text-sm text-blue-600 dark:text-blue-300">50% - Basic restorative functions</div>
                      </div>
                    </div>
                  </>
                ) : ageGroup === 'earlyInfant' ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-800 dark:text-blue-200">💤 NREM Sleep</div>
                        <div className="text-sm text-blue-600 dark:text-blue-300">60% - Physical restoration</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-purple-800 dark:text-purple-200">🧠 REM Sleep</div>
                        <div className="text-sm text-purple-600 dark:text-purple-300">40% - Brain development</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 dark:text-gray-300">🛏️ N1 (Light Sleep)</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">~5% - Sleep transition</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-800 dark:text-blue-200">💤 N2 (Light Sleep)</div>
                        <div className="text-sm text-blue-600 dark:text-blue-300">
                          {(ageGroup === 'schoolAge' || ageGroup === 'adolescent') ? '50%' : 
                           (ageGroup === 'olderAdult') ? '50%' : '45%'} - Memory consolidation
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-indigo-800 dark:text-indigo-200">🌙 N3 (Deep Sleep)</div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-300">
                          {(ageGroup === 'olderAdult') ? '15%' : 
                           (ageGroup === 'adolescent') ? '20%' : 
                           (ageGroup === 'schoolAge') ? '20%' : '25%'} - Physical restoration
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-purple-800 dark:text-purple-200">🧠 REM Sleep</div>
                        <div className="text-sm text-purple-600 dark:text-purple-300">
                          {ageData.remSleepPercentage}% - Dreams & memory processing
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
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
                    <span>N3: 15-20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>REM: ~20%</span>
                  </div>
                </>
              )}
            </div>
            )}
          </div>
        )}
        </div>

          {/* How Sleep Works at This Age Section - Enhanced Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/30 rounded-xl p-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-600">
                <span className="text-2xl">🧬</span>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">How Sleep Works at This Age</h3>
              </div>
              <div className="text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
              {ageGroup === 'newborn' && (
                <div className="space-y-4">
                  <p className="font-normal">Newborns don't sleep in structured stages like older children and adults. Instead, they move between two simple kinds of sleep:</p>
                  <div className="bg-white dark:bg-slate-700 border-l-4 border-amber-400 dark:border-amber-500 rounded-lg p-4 shadow-sm space-y-3">
                    <div className="font-normal">
                      <strong>Active sleep (AS):</strong> their eyes move, bodies twitch, and brains are very active — similar to REM in adults.
                    </div>
                    <div className="font-normal">
                      <strong>Quiet sleep (QS):</strong> stiller and more peaceful — similar to NREM in adults.
                    </div>
                  </div>
                  <p className="font-normal">Each sleep cycle is short — about 40–50 minutes — and babies wake up often. This is normal and helps protect them while their brains and bodies grow rapidly.</p>
                </div>
              )}
              {ageGroup === 'earlyInfant' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    At this stage, your baby's sleep is **becoming more organized and mature**.
                  </p>
                  <p className="font-normal">
                    They now **start each cycle in light, calm sleep**, move into **deeper, body-repairing sleep**, and finish in **dream sleep**, where the brain is very active.
                  </p>
                  <div className="bg-white dark:bg-slate-700 border-l-4 border-amber-400 dark:border-amber-500 rounded-lg p-4 shadow-sm">
                    <p className="font-medium mb-3">The brain is learning to separate sleep into clear stages:</p>
                    <div className="space-y-2 pl-4">
                      <div className="font-normal">• **Light and deep sleep (N1, N2, N3)** help with physical healing and early memory development</div>
                      <div className="font-normal">• **Dream sleep (REM)** continues to play a big role in brain growth and emotional processing</div>
                    </div>
                  </div>
                  <p className="font-normal">
                    While N1 (the lightest stage) exists, it's **short and fleeting**. Most of your baby's sleep now happens in **N2, N3, and REM** — a major step forward from the newborn pattern of "active" and "quiet" sleep.
                  </p>
                  <p className="font-normal">
                    Each cycle lasts **about 50 minutes**, and your baby may start **connecting two or more cycles** — especially during nighttime sleep. Their **body clock is also beginning to form**, so sleep may start to feel more predictable across day and night.
                  </p>
                </div>
              )}
              {ageGroup === 'lateInfant' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Sleep cycles at this age last **around 60 minutes**. Babies fall into **light sleep first (N1+N2)**, then drift into **deep, quiet rest (N3)**, and finally **dream sleep (REM)**.
                  </p>
                  <p className="font-normal">
                    They usually **sleep longer at night** and have **more consistent naps**. Dream sleep is getting longer in the early morning, and their brain is becoming better at **knowing when to feel sleepy or awake** based on light and routine.
                  </p>
                  <p className="font-normal">
                    This age also marks a **noticeable maturation of circadian rhythm**, helping babies respond more consistently to light, routines, and time cues. As a result, **nighttime sleep consolidates**, with fewer interruptions.
                  </p>
                </div>
              )}
              {ageGroup === 'toddler' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    By this age, toddlers move through **all four stages of sleep** in a steady, predictable pattern. Each cycle includes **light sleep (N1 and N2), deep sleep (N3), and dream sleep (REM)**, and lasts about **60 to 75 minutes**.
                  </p>
                  <p className="font-normal">
                    **Deep sleep happens mostly in the first few hours** of the night, helping the body rest and grow. As the night continues, **dream sleep becomes more active**, especially toward morning — this stage supports emotional growth and learning.
                  </p>
                  <p className="font-normal">
                    **Nighttime sleep is now more consistent**, but naps are still important. Many toddlers go from **two naps to one** around this age, but dropping naps too soon can lead to crankiness, trouble falling asleep at night, and slower learning.
                  </p>
                  <p className="font-normal">
                    A **calm, regular bedtime routine** helps their brain and body get the sleep they need — and makes bedtime smoother for you too.
                  </p>
                </div>
              )}
              {ageGroup === 'preschooler' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Preschoolers sleep in cycles that last **around 80 minutes**.
                  </p>
                  <p className="font-normal">
                    Each cycle **begins in light sleep (N1 and N2)**, moves into **deep, restoring sleep (N3)**, and **ends in dream sleep (REM)**. This full pattern repeats several times throughout the night.
                  </p>
                  <p className="font-normal">
                    **Deep sleep is most concentrated in the early part of the night**, when the body does most of its growth and repair.
                  </p>
                  <p className="font-normal">
                    **Dream sleep becomes longer in the early morning**, supporting memory, learning, and emotional development.
                  </p>
                  <p className="font-normal">
                    By this age, their **body clock is well developed** — so having regular bedtimes and wake times helps keep sleep quality steady and strong.
                  </p>
                </div>
              )}
              {ageGroup === 'schoolAge' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Children now sleep in **full 90-minute cycles**, just like adults.
                  </p>
                  <p className="font-normal">
                    They **start each cycle in light sleep (N1 and N2)**, move into **deep, body-restoring sleep (N3)**, and **finish with dream sleep (REM)**.
                  </p>
                  <p className="font-normal">
                    **Deep sleep is strongest during the first 2–3 cycles** of the night, which is when the body grows and repairs.
                  </p>
                  <p className="font-normal">
                    **REM sleep becomes more active in the later cycles**, especially toward morning, helping with emotional balance and memory.
                  </p>
                  <p className="font-normal">
                    **Good, uninterrupted sleep during this stage is essential** for learning, focus, energy, and physical growth — especially in the school years.
                  </p>
                </div>
              )}
              {ageGroup === 'adolescent' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Teenagers sleep in cycles that last **about 100 minutes**, just like adults. Each cycle follows a regular pattern: **starting with light sleep (N1+N2), then deep sleep (N3), and ending in dream sleep (REM)**. This full sequence repeats several times throughout the night.
                  </p>
                  <p className="font-normal">
                    **Deep sleep (N3) is most concentrated during the first 2 to 3 cycles**, helping with physical recovery and growth.
                  </p>
                  <p className="font-normal">
                    As the night goes on, **REM (dream) sleep increases in the later cycles**, supporting emotional regulation, memory, and stress processing — all especially important during adolescence.
                  </p>
                  <div className="bg-white dark:bg-slate-700 border-l-4 border-amber-400 dark:border-amber-500 rounded-lg p-4 shadow-sm">
                    <p className="font-medium mb-3">Natural Sleep Phase Delay:</p>
                    <p className="font-normal">
                      Teens also go through a natural biological shift called a **"sleep phase delay."** This means they start **feeling sleepy later at night** and **prefer waking later in the morning**. On top of that, their **need for sleep increases** because of intense brain changes and physical development during puberty.
                    </p>
                  </div>
                </div>
              )}
              {ageGroup === 'youngAdult' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Young adults sleep in cycles that **average about 105 minutes** — the most mature and stable sleep pattern across the lifespan.
                  </p>
                  <p className="font-normal">
                    Each cycle includes **light sleep, deep sleep, and dream sleep (REM)**, with a well-balanced mix that supports both physical and mental health.
                  </p>
                  <p className="font-normal">
                    **Deep sleep (N3) is still present** but begins its gradual decline compared to the teenage years.
                  </p>
                  <p className="font-normal">
                    Meanwhile, **REM sleep increases in the later cycles** of the night, helping with complex thinking, emotional balance, and creativity — all essential for handling academic demands, career growth, and growing independence.
                  </p>
                  <p className="font-normal">
                    Even though sleep structure is strong, it's still **sensitive to irregular schedules and stress** — so staying consistent with sleep routines is important for overall well-being.
                  </p>
                </div>
              )}
              {ageGroup === 'adult' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Adults still cycle through the same sleep stages, with **each cycle lasting about 90 to 95 minutes**.
                  </p>
                  <p className="font-normal">
                    But with age, **changes in the brain make sleep lighter** and more easily disrupted.
                  </p>
                  <p className="font-normal">
                    **Deep sleep (N3)** — the stage that helps you feel fully rested — **becomes shorter in each cycle**, and it's normal to wake up more often during the night.
                  </p>
                  <div className="bg-white dark:bg-slate-700 border-l-4 border-amber-400 dark:border-amber-500 rounded-lg p-4 shadow-sm">
                    <p className="font-medium mb-3">Even though the structure of sleep cycles stays intact, many adults:</p>
                    <div className="space-y-2 pl-4">
                      <div className="font-normal">• **Take longer to fall asleep**</div>
                      <div className="font-normal">• **Wake up earlier in the morning** due to a natural shift in their internal clock</div>
                      <div className="font-normal">• **Feel sleepy during the day** because nighttime sleep isn't as solid</div>
                    </div>
                  </div>
                  <p className="font-normal">
                    **Short daytime naps can help fill the gap** — just keep them early and brief so they don't interfere with your next sleep cycle.
                  </p>
                </div>
              )}
              {ageGroup === 'olderAdult' && (
                <div className="space-y-4">
                  <p className="font-normal">
                    Older adults still cycle through the same sleep stages, with **each cycle lasting about 90 to 95 minutes**.
                  </p>
                  <p className="font-normal">
                    But with age, **changes in the brain make sleep lighter** and more easily disrupted.
                  </p>
                  <p className="font-normal">
                    **Deep sleep (N3)** — the stage that helps you feel fully rested — **becomes shorter in each cycle**, and it's normal to wake up more often during the night.
                  </p>
                  <div className="bg-white dark:bg-slate-700 border-l-4 border-amber-400 dark:border-amber-500 rounded-lg p-4 shadow-sm">
                    <p className="font-medium mb-3">Even though the structure of sleep cycles stays intact, many older adults:</p>
                    <div className="space-y-2 pl-4">
                      <div className="font-normal">• **Take longer to fall asleep**</div>
                      <div className="font-normal">• **Wake up earlier in the morning** due to a natural shift in their internal clock</div>
                      <div className="font-normal">• **Feel sleepy during the day** because nighttime sleep isn't as solid</div>
                    </div>
                  </div>
                  <p className="font-normal">
                    **Short daytime naps can help fill the gap** — just keep them early and brief so they don't interfere with your next sleep cycle.
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>



          {/* Recommended Wake Time */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">Recommended Wake Time:</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              {ageGroup === 'newborn' ? 'At the end of a full ~45 min proto-cycle, ideally during light Quiet Sleep. This is generally the easiest time to wake your baby, as they are transitioning out of a sleep state, making the wake-up smoother and less disruptive for both parent and child.' :
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


            
            {/* Research-Based Notes Section - Enhanced Card */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
              <button
                onClick={() => setResearchNotesExpanded(!researchNotesExpanded)}
                className="w-full flex items-center justify-between"
                aria-expanded={researchNotesExpanded}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">Research-Based Notes</h3>
                </div>
                {researchNotesExpanded ? (
                  <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
              
              {researchNotesExpanded && (
                <div className="mt-4 text-blue-800 dark:text-blue-200 space-y-4 text-sm">
                  {ageGroup === 'newborn' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🌙</span> Unique Sleep Start
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Newborns are the only age group that start sleep in Active Sleep (their version of REM)</li>
                          <li>• As they grow, they'll shift to starting in quiet sleep like older kids and adults</li>
                          <li>• This unique pattern supports critical brain development during this crucial period</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🔁</span> What Are "Proto-Cycles"?
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Your baby sleeps in short cycles (~40–60 minutes) that alternate between:</li>
                          <li className="pl-4">- Active Sleep (AS): lots of movement, brain activity</li>
                          <li className="pl-4">- Quiet Sleep (QS): still and restful</li>
                          <li>• These early cycles are the building blocks of healthy sleep</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏱️</span> The 45-Minute Wake-Up (aka "The Intruder")
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Common for newborns to wake fully after just one cycle — especially around 30–45 minutes</li>
                          <li>• This can happen if:</li>
                          <li className="pl-4">- They're hungry</li>
                          <li className="pl-4">- They're overtired or overstimulated</li>
                          <li className="pl-4">- They're practicing new milestones like rolling</li>
                          <li className="pl-4">- Their bedtime routine is inconsistent</li>
                          <li>• What to do: Before jumping in, pause. Your baby might settle back on their own. Try gentle soothing, check if they're hungry, and make sure the room is cool, dark, and quiet.</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🌞</span> Day vs. Night: Not Yet!
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Newborns don't have a circadian rhythm yet — their internal clock hasn't kicked in</li>
                          <li>• They sleep in short bursts and wake every 2–3 hours to feed</li>
                          <li>• By 2–3 months, you may start noticing longer nighttime stretches as their rhythm matures</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'earlyInfant' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧩</span> Real Sleep Stages Are Taking Shape
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Your baby's sleep is **maturing**! Around this age, they start cycling through **real sleep stages** like REM, light sleep (N2), and deep sleep (N3)</li>
                          <li>• This **replaces the less organized sleep patterns** from the newborn stage</li>
                          <li>• Helps them **rest better and grow stronger**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🌞</span> Day-Night Rhythm Starts Clicking
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Their **circadian rhythm (body clock)** is finally waking up. You'll start to notice:</li>
                          <li className="pl-4">- **Longer stretches of nighttime sleep**</li>
                          <li className="pl-4">- **More alertness during the day**</li>
                          <li className="pl-4">- **Less random waking**</li>
                          <li>• **Tip**: Open the curtains in the morning and dim the lights at night — **natural light helps their rhythm settle** into a day-night pattern</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏳</span> Sleep Cycles Are Getting Longer
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Instead of short newborn-style cycles, your baby's sleep is now **stretching toward more mature patterns** — about **50 minutes per cycle**</li>
                          <li>• This means **more time in each stage**, and potentially **longer stretches of continuous sleep** at night</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'lateInfant' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>😴</span> A More Grown-Up Sleep Pattern
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Your baby now usually **falls asleep through light sleep (N2)**, then moves into **deep sleep (N3) and REM**, just like adults</li>
                          <li>• Their sleep is becoming **more predictable and structured**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏱️</span> Longer Sleep Cycles = Better Nights
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Sleep cycles are now **about 60 minutes long**</li>
                          <li>• This gives your baby **more time in each stage** and helps them **sleep for longer stretches** at night — a win for everyone</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🌙</span> Body Clock Kicking In
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Their **circadian rhythm is maturing**, meaning their body is starting to **sync with light, dark, and routine**</li>
                          <li>• **Consistent bedtimes and wake times** now make a real difference</li>
                          <li>• **Tip**: Keep mornings bright and evenings calm and dim — it helps reinforce the day-night pattern</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🚼</span> Big Milestones Can Stir Things Up
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• New skills like **crawling, babbling, or sitting up** can cause temporary sleep hiccups. That's normal — **their brain is busy growing**</li>
                          <li>• **Tip**: Stick to your sleep routines and help your baby **practice new skills during the day**. A little extra comfort at night can go a long way</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'toddler' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏳</span> Sleep Cycles Are Settling In
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Your toddler now has **consistent 60–75 minute sleep cycles**, showing steady progress toward adult-like sleep structure</li>
                          <li>• This means **more predictable naps and nighttime rhythms**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🛠️</span> Deep Sleep Powers Growth
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Deep sleep (N3) is still strong** — especially in the early part of the night. This stage is key for:</li>
                          <li className="pl-4">- **Physical growth**</li>
                          <li className="pl-4">- **Cell repair**</li>
                          <li className="pl-4">- **Energy restoration**</li>
                          <li>• It's when a lot of that **growing magic happens**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> REM Sleep = Brain in Action
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• As your toddler's brain learns new words, skills, and emotions, **REM sleep helps them**:</li>
                          <li className="pl-4">- **Process memories**</li>
                          <li className="pl-4">- **Make sense of new experiences**</li>
                          <li className="pl-4">- **Regulate emotions**</li>
                          <li>• Think of it as **overnight mental organization**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🚶‍♂️</span> Milestones Can Stir Things Up
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• New skills like **walking, talking, or even asserting independence** can cause sleep disruptions</li>
                          <li>• **Nap refusal or sudden wake-ups** are usually normal and temporary</li>
                          <li>• **Tip**: Keep your bedtime routine predictable, and let your toddler **practice new skills during the day**. If they wake up at night, **stay calm and consistent** — they'll settle with your reassurance</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'preschooler' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏱️</span> Longer Sleep Cycles = Better Rest
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Your child's **sleep cycles now last around 80 minutes**, supporting deeper, more continuous sleep</li>
                          <li>• Their **sleep system is working more efficiently**, helping them stay asleep longer</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>💤</span> Deep Sleep Does the Heavy Lifting
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Deep sleep (N3) is still dominant**, especially early in the night. It's essential for:</li>
                          <li className="pl-4">- **Physical growth**</li>
                          <li className="pl-4">- **Cell repair and healing**</li>
                          <li className="pl-4">- **Building a strong immune system**</li>
                          <li>• This helps them **recover and stay healthy** as they explore the world</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> REM Fuels the Mind
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **REM sleep supports**:</li>
                          <li className="pl-4">- **Emotional processing**</li>
                          <li className="pl-4">- **Social understanding and imagination**</li>
                          <li>• It's **especially important now** as your child starts forming relationships and expressing themselves more</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>😵‍💫</span> Imagination = Sleep Challenges
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Nightmares, bedtime resistance, or fears** of the dark are common — your preschooler's imagination is growing fast</li>
                          <li>• These are **normal and usually not signs** of a sleep disorder</li>
                          <li>• **Tip**: Keep bedtime calm and predictable. **Reassure your child** if they're scared, but **stay firm with boundaries**. A cozy, secure sleep environment makes a big difference</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'schoolAge' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏰</span> Sleep Cycles Have Matured
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• By this age, kids have **90-minute sleep cycles**, just like adults</li>
                          <li>• These **stable rhythms** help support their growing need for **focused learning, physical energy, and emotional balance**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🛠️</span> Deep Sleep Happens Early
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• The **first few cycles of the night are packed with deep sleep (N3)** — this is when the body:</li>
                          <li className="pl-4">- **Heals and grows**</li>
                          <li className="pl-4">- **Stores energy**</li>
                          <li className="pl-4">- **Processes the day's learning**</li>
                          <li>• That's why **an early bedtime is so valuable**!</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> Brain Power Builds in the Morning
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• As the night progresses, **REM sleep becomes more active**. This stage is essential for:</li>
                          <li className="pl-4">- **Emotional regulation**</li>
                          <li className="pl-4">- **Problem-solving**</li>
                          <li className="pl-4">- **Creativity and memory**</li>
                          <li>• The **last few hours of sleep** are when much of that **"mental organizing" happens**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧘‍♂️</span> Consistent Routines = Smarter Days
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Kids need structure. A **screen-free wind-down and set bedtime** help:</li>
                          <li className="pl-4">- **Boost academic performance**</li>
                          <li className="pl-4">- **Improve mood**</li>
                          <li className="pl-4">- **Support overall health**</li>
                          <li>• **Tip**: Create a calm pre-bed routine that lasts **30–60 minutes**. This could include a warm bath, reading together, or quiet time — just make sure **screens are off at least an hour before bed**</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'adolescent' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏱️</span> Longer Sleep Cycles, Growing Brain
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Teens now **cycle through sleep in ~100-minute intervals**, moving closer to full adult sleep architecture</li>
                          <li>• This **extended cycle supports brain development, memory, and hormonal balance** during a time of major growth</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>💤</span> Deep Sleep Starts to Dip
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Deep sleep (N3) starts to decline** in overall percentage compared to childhood — but it's still essential. It helps with:</li>
                          <li className="pl-4">- **Physical recovery**</li>
                          <li className="pl-4">- **Cell repair**</li>
                          <li className="pl-4">- **Mental focus for the next day**</li>
                          <li>• **Encouraging early, consistent bedtimes** can help preserve more of it</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> REM: The Emotional Equalizer
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **REM sleep takes center stage** in adolescence. It plays a major role in:</li>
                          <li className="pl-4">- **Managing mood swings**</li>
                          <li className="pl-4">- **Processing social and academic stress**</li>
                          <li className="pl-4">- **Supporting emotional regulation** in a time of intense self-discovery</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>📵</span> Modern Life Gets in the Way
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Late-night screens, socializing, and heavy school loads** can seriously mess with sleep quality and timing</li>
                          <li>• Many teens **don't get the rest they need** — and it shows in their mood, focus, and health</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'youngAdult' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏳</span> Adult Sleep Cycles Are Fully In Place
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Young adults now experience **~105-minute sleep cycles** — a sign that their **sleep architecture is fully matured**</li>
                          <li>• This rhythm helps support **everything from focus to physical recovery**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🔧</span> Deep Sleep Slowly Starts to Fade
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Deep sleep (N3) is still strong**, but it's beginning a **slow, natural decline** compared to teenage years. It remains crucial for:</li>
                          <li className="pl-4">- **Muscle repair**</li>
                          <li className="pl-4">- **Energy restoration**</li>
                          <li className="pl-4">- **Cognitive function and memory**</li>
                          <li>• **Getting enough of it requires regular sleep hours** and healthy routines</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> REM Sleep: Your Brain's MVP
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **REM demand is still high** — and for good reason. This stage supports:</li>
                          <li className="pl-4">- **Creative thinking**</li>
                          <li className="pl-4">- **Emotional resilience**</li>
                          <li className="pl-4">- **Problem-solving**</li>
                          <li>• It's **especially valuable during this phase** of academic growth, work pressure, and complex relationships</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⚠️</span> Sleep vs. Lifestyle
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Between **late nights, busy schedules, and screen use**, many young adults don't get the rest they need. This leads to:</li>
                          <li className="pl-4">- **Brain fog**</li>
                          <li className="pl-4">- **Low energy**</li>
                          <li className="pl-4">- **Mood swings and decreased productivity**</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'adult' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⏱️</span> Average Sleep Cycles = ~96 Minutes
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Most adults experience **sleep cycles that average around 96 minutes**, though recent research shows they can **range from 95 to 130 minutes** depending on the person</li>
                          <li>• This **variation is completely normal** and reflects individual sleep needs</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>📉</span> Sleep Efficiency Slows Down
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• With age, many adults notice:</li>
                          <li className="pl-4">- **More time lying awake in bed**</li>
                          <li className="pl-4">- **More frequent nighttime awakenings**</li>
                          <li className="pl-4">- **Less time in deep, restorative sleep**</li>
                          <li>• These are **common changes and not always signs** of a sleep problem</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> REM and N2 Stay Strong
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Even as **deep sleep (N3) declines**, **REM and light sleep (N2) remain stable**. These stages support:</li>
                          <li className="pl-4">- **Mental clarity**</li>
                          <li className="pl-4">- **Emotional regulation**</li>
                          <li className="pl-4">- **Problem-solving and learning**</li>
                          <li>• They help you **stay sharp and balanced** in the face of daily demands</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>⚠️</span> Life Gets in the Way of Sleep
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Busy work lives, parenting, health concerns, and stress** can seriously impact sleep quality in this stage of life</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'olderAdult' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🌙</span> Sleep Becomes More Fragmented
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Older adults often experience **lighter, more broken sleep**</li>
                          <li>• **Deep sleep (N3) becomes less common**, and **sleep cycles may be shorter** and less restorative than in earlier life stages</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🧠</span> REM Sleep Still Matters
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **REM sleep may decrease slightly** and feel lighter, but it's **still vital for**:</li>
                          <li className="pl-4">- **Emotional health**</li>
                          <li className="pl-4">- **Memory consolidation**</li>
                          <li className="pl-4">- **Brain maintenance**</li>
                          <li>• Even in later life, this stage **plays a key role in keeping the mind sharp**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>😴</span> Daytime Naps Are Common — and Helpful
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **More frequent daytime napping is normal**. It often helps **compensate for fragmented nighttime sleep** and can reduce fatigue</li>
                          <li>• **Especially when naps are short and timed well**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <span>🕰️</span> The Body Clock Shifts Earlier
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• Many older adults naturally start **feeling sleepy earlier in the evening** and **wake up earlier in the morning** — this is known as an **advanced sleep phase**</li>
                          <li>• However, things like **less sunlight exposure, social isolation, and medications** can also affect this rhythm</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sleep Stage Functions Section - Enhanced Card */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
              <button
                onClick={() => setStageFunctionsExpanded(!stageFunctionsExpanded)}
                className="w-full flex items-center justify-between"
                aria-expanded={stageFunctionsExpanded}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="font-bold text-lg text-green-800 dark:text-green-200">Sleep Stage Functions (Research-Based)</h3>
                </div>
                {stageFunctionsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </button>
              
              {stageFunctionsExpanded && (
                <div className="mt-4 text-green-800 dark:text-green-200 space-y-4 text-sm">
                  {ageGroup === 'newborn' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">Active Sleep (AS)</span>
                          <span className="text-xs text-muted-foreground">(Newborn equivalent of REM sleep)</span>
                        </div>
                        <p className="text-sm mb-3 italic">
                          **Brain is highly active, resembling wakefulness** — you might observe rapid eye movements, twitching, and vocalizations.
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Supremely critical for rapid brain maturation** and nervous system development</li>
                          <li>• **Formation of new neural connections (synapses)** — the foundation of learning</li>
                          <li>• **Actively processes and consolidates new experiences**, even those from in utero</li>
                          <li>• **Overall development of the nervous system** during this crucial period</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">Quiet Sleep (QS)</span>
                          <span className="text-xs text-muted-foreground">(Comparable to NREM sleep in adults)</span>
                        </div>
                        <p className="text-sm mb-3 italic">
                          **Newborn becomes very still** with deep, regular breathing — lacks the defined NREM sub-stages of older individuals.
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li>• **Essential basic restorative functions** for physical recovery</li>
                          <li>• **Vital physical rest** supporting the immense growth occurring in this period</li>
                          <li>• **Cellular repair and restoration** during this quiet phase</li>
                          <li>• **Energy conservation** for the rapid physical development happening daily</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'lateInfant' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 Sleep (≈5%)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• A **very brief, light entry point** into sleep—the transitional phase where the brain begins to slow down</li>
                          <li>• It's **easily disrupted**, meaning even small sounds can cause a baby to stir</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 Sleep (≈40%)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This is the **most frequent and dominant stage** of sleep at this age</li>
                          <li>• It's **crucial for supporting learning, memory consolidation** (like remembering faces and routines)</li>
                          <li>• **Development of motor skills** (such as rolling and crawling)</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 Sleep (≈25%)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• Also known as **deep or slow-wave sleep**, this stage is essential for **physical growth** (with growth hormone release)</li>
                          <li>• **Immune system support**, and **significant physical recovery** from their active days</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM Sleep (≈30%)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• During REM sleep, the baby's **brain is highly active**</li>
                          <li>• This stage plays a **vital role in language development, emotional regulation** (processing new stimuli)</li>
                          <li>• **Integrating and processing daytime experiences**, laying the groundwork for complex cognitive functions</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'toddler' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Light Transition)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• A **brief, essential gateway** from wakefulness into sleep</li>
                          <li>• While **not deeply restorative**, it's necessary for entry into the sleep cycle and is the stage from which toddlers are **most easily aroused**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **prominent stage is critical** for consolidating motor skill memory (like walking and climbing)</li>
                          <li>• **Aids in emotional regulation** (processing big toddler feelings)</li>
                          <li>• Is the **ideal stage for a smoother waking transition**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• Often called **slow-wave sleep**, N3 is the **powerhouse of physical restoration**</li>
                          <li>• It **strongly promotes growth hormone release**, supports the immune system</li>
                          <li>• **Facilitates crucial brain detoxification processes** that clear metabolic waste</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **active brain state significantly boosts language acquisition** and vocabulary building</li>
                          <li>• **Enhances emotional processing** of their complex world</li>
                          <li>• **Aids in memory integration** of all the new skills and concepts they're absorbing</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'preschooler' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Transition Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• A **quick entry phase** that gently prepares the brain and body for deeper rest</li>
                          <li>• It's a **very light stage** from which a child can be easily awakened</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **prominent stage is crucial** for the development of motor skill memory</li>
                          <li>• **Supports emotional regulation** (helping them manage their increasingly complex feelings)</li>
                          <li>• **Prepares the brain** for new memory consolidation</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• The **primary driver of physical growth**, immune system strength</li>
                          <li>• **Brain recovery** from the day's energetic activities</li>
                          <li>• This **restorative stage is when the body undertakes** significant repair and regeneration</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Actively helps with emotional processing**, fuels imagination and creative play</li>
                          <li>• **Hones early problem-solving abilities** as the child processes and consolidates their learning</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'schoolAge' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Transition Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• A **brief, delicate bridge** from wakefulness into deeper sleep stages</li>
                          <li>• It **represents minimal physiological changes** but is a necessary entry point into the sleep cycle</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **prominent and abundant stage is crucial** for learning retention (solidifying new academic information)</li>
                          <li>• **Refining motor coordination**, and **integrating daily memories** and skills</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• The **primary stage for promoting growth hormone release**, bolstering immune function against illnesses</li>
                          <li>• **Facilitating long-term memory consolidation**, especially for declarative memories (facts and events)</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Highly active for the brain**, REM sleep enhances creativity</li>
                          <li>• **Sharpens emotional regulation skills** (critical for social interactions)</li>
                          <li>• **Supports problem-solving skills** as children process complex social and academic challenges</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'adolescent' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Transition Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• The **initial, light stage** that prepares the brain for the deeper sleep stages</li>
                          <li>• It's **brief and signals the onset** of the sleep cycle</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Important for memory processing**, particularly for procedural memories (skills and habits)</li>
                          <li>• **Learning consolidation** of the day's academic material and social interactions</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Supports profound physical restoration** and recovery from sports and growth spurts</li>
                          <li>• **Enhances immune function**, and contributes to **crucial brain plasticity**—the brain's ability to reorganize itself by forming new neural connections</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Absolutely critical for emotional regulation** during a turbulent phase of development</li>
                          <li>• **Sharpens social cognition** (understanding social cues)</li>
                          <li>• **Fuels creative problem-solving** as adolescents navigate complex personal and academic challenges</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'youngAdult' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Transition Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• A **brief, initial stage** that effectively initiates sleep</li>
                          <li>• It's a **very light phase**, making it easy to wake from, but it's **essential for entering the sleep cycle**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **highly prevalent stage maintains daytime alertness**</li>
                          <li>• **Significantly aids in memory processing** (especially for new facts and experiences)</li>
                          <li>• **Supports motor learning** (refining physical skills)</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Crucial for profound physical recovery** from daily activities</li>
                          <li>• **Robust immune function** (helping the body fight off illness)</li>
                          <li>• **Essential cell repair and regeneration** throughout the body</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Actively enhances emotional intelligence**, fuels creative thinking</li>
                          <li>• **Fosters mental flexibility** needed to adapt to new situations and solve complex problems in academic and professional settings</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'adult' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Transition Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• The **lightest stage of sleep**, serving as a rapid bridge into deeper sleep</li>
                          <li>• It's the **most fragile stage** and from which individuals are most prone to disruption and awakening</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **dominant stage supports procedural memory** (how-to skills)</li>
                          <li>• **Consolidates motor skills**, and **processes sensory information** from the day</li>
                          <li>• It's **crucial for maintaining general cognitive function** and alertness</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• Though it **declines with age**, N3 remains **crucial for tissue growth and repair**</li>
                          <li>• **Robust immune support**, and **fundamental energy restoration** at the cellular level</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Promotes emotional stability and resilience**</li>
                          <li>• **Facilitates learning new complex information**, and **supports the creative integration** of new ideas and experiences</li>
                          <li>• **Vital for adaptability and innovation**</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'olderAdult' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">N1 (Transition Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• This **lightest stage is highly prone to disruption** and frequent awakenings</li>
                          <li>• It **primarily serves as the entry point** into the sleep architecture</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">N2 (Light Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Still the dominant sleep stage**, N2 is **crucial for maintaining cognitive function** and alertness</li>
                          <li>• **Supporting sensory memory**, and **facilitating basic day-to-day alertness**</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-full text-xs font-bold">N3 (Deep Sleep)</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• Although **less prevalent than in younger adults**, N3 continues to **aid in immune repair**</li>
                          <li>• **Regulate glucose metabolism**, and **contribute to overall physical restoration** and vitality</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Continues to be vital for emotional processing**, particularly for navigating life changes and managing mood</li>
                          <li>• For **long-term memory consolidation**, and for **essential neural maintenance** and brain plasticity</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {ageGroup === 'earlyInfant' && (
                    <div className="space-y-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full text-xs font-bold">REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• **Continues to be vital** for active memory consolidation of the day's new experiences</li>
                          <li>• **Supports the early brain development** essential for cognitive leaps like recognizing faces and responding to sounds</li>
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-xs font-bold">Non-REM</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          <li>• With the **emergence of N2 and N3**, Non-REM sleep begins to provide **more significant physical restoration** and deeper rest</li>
                          <li>• This is **crucial as babies become more active** and start developing motor skills</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Moon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Sleep Calculator</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* Main Input Section - Redesigned 3-Step Flow */}
        <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-2xl" data-main-input>
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
        {showResults && recommendations.length > 0 && (
        <div 
          id="resultsContainer" 
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
        >
        {recommendations.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/95 dark:bg-slate-800/95 rounded-2xl transition-all duration-300 hover:shadow-2xl">
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="text-2xl">🛏️</span>
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
                <h3 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3 text-gray-800 dark:text-white">
                  <span className="text-2xl">📊</span>
                  Sleep Cycle Analysis
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Understanding why each bedtime gets its rating based on sleep cycle completion:
                </p>
                
                <div className="space-y-4">
                  {recommendations.map((rec, index) => {
                    const getCycleEmoji = (cycles: number) => {
                      return cycles <= 4 ? '🌀' : '💤';
                    };
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
                    const isEven = index % 2 === 0;
                    const bgClass = isEven ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900/50';
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${colors.border} ${bgClass} transition-all duration-200 hover:shadow-md`}>
                        {/* Header with bedtime and rating */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-foreground">{rec.time}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCycleEmoji(rec.cycles)}</span>
                              <span className="text-sm font-medium text-muted-foreground">{rec.cycles} Cycles</span>
                            </div>
                            <Badge className={`${colors.text} font-bold text-sm px-3 py-1 shadow-sm`}>
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

        {/* Floating Edit Wake-up Time Button */}
        {showResults && (
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
        )}

        {/* Back to Top Button with enhanced styling */}
        {showResults && (
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
        )}
      </div>
    </div>
  );
}