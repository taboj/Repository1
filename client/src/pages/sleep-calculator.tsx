import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Moon, Sun, AlarmClock, ArrowUp, Target, Calendar, Clock, Info, Star, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/hooks/use-toast';
import {
  calculateOptimalBedtimes,
  calculateOptimalWakeTimes,
  formatTime,
  parseTimeString,
  getFallAsleepTime,
  getAgeGroupRecommendations,
  getCycleLength,
  getAgeGroup,
  calculateOptimalCyclesForAge,
  type SleepSettings,
  type SleepRecommendation
} from '@/lib/sleep-calculations';

type CalculationMode = 'wakeUp' | 'bedTime';

export default function SleepCalculator() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('wakeUp');
  const [selectedTime, setSelectedTime] = useState({
    hour: 7,
    minute: 0,
    period: 'AM' as 'AM' | 'PM'
  });

  const [settings, setSettings] = useState<SleepSettings>({
    fallAsleepTime: 15,
    selectedCycles: 5,
    age: 25
  });

  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showStickyEditButton, setShowStickyEditButton] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);

  const timeInputRef = useRef<HTMLDivElement>(null);

  // Update settings when age changes
  useEffect(() => {
    const fallAsleepTime = getFallAsleepTime(settings.age);
    const optimalCycles = calculateOptimalCyclesForAge(settings.age);
    setSettings(prev => ({
      ...prev,
      fallAsleepTime,
      selectedCycles: optimalCycles[0]
    }));
  }, [settings.age]);

  // Scroll handlers
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowBackToTop(scrollY > 400);
      setShowStickyEditButton(scrollY > 200 && showResults);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showResults]);

  const scrollToTimeInput = useCallback(() => {
    timeInputRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCalculate = useCallback(() => {
    const inputTime = parseTimeString(
      `${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, '0')}`,
      selectedTime.period
    );

    let newRecommendations: SleepRecommendation[];
    
    if (calculationMode === 'wakeUp') {
      newRecommendations = calculateOptimalBedtimes(inputTime, settings);
    } else {
      newRecommendations = calculateOptimalWakeTimes(inputTime, settings);
    }

    setRecommendations(newRecommendations);
    setShowResults(true);

    // Scroll to results with offset for header
    setTimeout(() => {
      const resultsElement = document.querySelector('[data-results]');
      if (resultsElement) {
        const offsetTop = resultsElement.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    }, 100);
  }, [selectedTime, calculationMode, settings]);

  // Hide results when age changes
  useEffect(() => {
    setShowResults(false);
    setRecommendations([]);
  }, [settings.age]);

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

        {/* Main Input Section */}
        <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-800/90 rounded-2xl mb-8 transition-all duration-300 hover:shadow-2xl" data-main-input ref={timeInputRef}>
          <CardContent className="p-8 md:p-10">
            <div className="space-y-8">
              {/* Step 1: Mode Selection */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">Step 1: Choose Your Goal</h2>
                  <p className="text-base text-gray-600 dark:text-gray-300">What would you like to calculate?</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button
                    variant={calculationMode === 'wakeUp' ? 'default' : 'outline'}
                    onClick={() => setCalculationMode('wakeUp')}
                    className={`h-auto p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      calculationMode === 'wakeUp' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0' 
                        : 'bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-600'
                    }`}
                    aria-label="Plan when to sleep based on wake time"
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Sun className="h-8 w-8" />
                      <div>
                        <div className="text-lg font-bold">I need to wake up at...</div>
                        <div className="text-sm opacity-90">Find ideal bedtimes</div>
                      </div>
                    </div>
                  </Button>
                  
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

              {/* Step 2: Time Selection */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">Step 2: Set Your Time</h3>
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    {calculationMode === 'wakeUp' ? 'When do you need to wake up?' : 'When do you want to go to bed?'}
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-gray-50 dark:bg-slate-700 rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedTime.hour.toString()}
                        onValueChange={(value) => setSelectedTime(prev => ({ ...prev, hour: parseInt(value) }))}
                      >
                        <SelectTrigger className="w-20 h-12 text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-2xl font-bold">:</span>
                      <Select
                        value={selectedTime.minute.toString().padStart(2, '0')}
                        onValueChange={(value) => setSelectedTime(prev => ({ ...prev, minute: parseInt(value) }))}
                      >
                        <SelectTrigger className="w-20 h-12 text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i * 5} value={(i * 5).toString().padStart(2, '0')}>
                              {(i * 5).toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedTime.period}
                        onValueChange={(value: 'AM' | 'PM') => setSelectedTime(prev => ({ ...prev, period: value }))}
                      >
                        <SelectTrigger className="w-20 h-12 text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
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
              <div className="text-center pt-4">
                <Button
                  onClick={handleCalculate}
                  size="lg"
                  className="text-xl px-12 py-6 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Target className="h-6 w-6 mr-3" />
                  Calculate Sleep Times
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {showResults && recommendations.length > 0 && (
          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 rounded-2xl mb-8 transition-all duration-500" data-results>
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                    {calculationMode === 'wakeUp' ? (
                      <Moon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <Sun className="h-8 w-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                    Recommended {calculationMode === 'wakeUp' ? 'Bedtimes' : 'Wake Times'}
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Based on {cycleLength}-minute sleep cycles for {ageData.name.toLowerCase()}
                </p>
              </div>

              <div className="grid gap-4 md:gap-6">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl transition-all duration-300 hover:scale-102 hover:shadow-lg ${
                      index % 2 === 0 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600' 
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-600 dark:to-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                            {rec.time}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            rec.quality === 'EXCELLENT' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            rec.quality === 'GOOD' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                            rec.quality === 'FAIR' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {rec.quality}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-gray-800 dark:text-white">
                            {rec.cycles} Sleep Cycles
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Total sleep: {rec.totalSleep}
                          </div>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        index % 3 === 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        index % 3 === 1 ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                        'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        Cycle {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sleep Quality Info */}
              <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl">
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
                      <div className="text-base md:text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">Fall asleep time:</span> ~{settings.fallAsleepTime} minutes
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Key Characteristics</h3>
                    <ul className="space-y-1">
                      {ageData.characteristics.map((char, index) => (
                        <li key={index} className="text-base md:text-sm text-slate-700 dark:text-slate-200">
                          • {char}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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

        {/* Back to Top Button */}
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