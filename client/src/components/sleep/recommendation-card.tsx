import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlarmClock, ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";
import { useState } from "react";
import type { SleepRecommendation, SleepSettings } from "@/lib/sleep-calculations";
import { getAgeGroup, getCycleLength, getAgeGroupRecommendations } from "@/lib/sleep-calculations";

interface RecommendationCardProps {
  recommendation: SleepRecommendation;
  settings: SleepSettings;
  calculationMode: 'wakeUp' | 'bedTime';
}

export default function RecommendationCard({ recommendation, settings, calculationMode }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getQualityColor = (quality: SleepRecommendation['quality']) => {
    switch (quality) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-l-green-500';
      case 'GOOD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-l-blue-500';
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-l-yellow-500';
      case 'POOR':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-l-red-500';
    }
  };

  const getGradientColor = (quality: SleepRecommendation['quality']) => {
    switch (quality) {
      case 'EXCELLENT':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-green-500';
      case 'GOOD':
        return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-blue-500';
      case 'FAIR':
        return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-yellow-500';
      case 'POOR':
        return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/20 border-l-red-500';
    }
  };

  // Get sleep cycle analysis data
  const ageGroup = getAgeGroup(settings.age);
  const cycleLength = getCycleLength(settings.age);
  const ageData = getAgeGroupRecommendations(settings.age);

  // Create sleep cycle visualization for this specific recommendation
  const createSleepCycleTimeline = () => {
    const cycles = [];
    const [hours, minutes] = recommendation.time.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(hours, minutes, 0, 0);
    
    // Add fall asleep time
    currentTime.setMinutes(currentTime.getMinutes() + settings.fallAsleepTime);
    
    for (let i = 0; i < recommendation.cycles; i++) {
      const cycleStart = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + cycleLength);
      const cycleEnd = new Date(currentTime);
      
      cycles.push({
        cycle: i + 1,
        start: cycleStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        end: cycleEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        isLastCycle: i === recommendation.cycles - 1
      });
    }
    
    return cycles;
  };

  const cycleTimeline = createSleepCycleTimeline();

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={`bg-gradient-to-r ${getGradientColor(recommendation.quality)} border-l-4 rounded-lg p-4 hover:shadow-md transition-all duration-200`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-3xl font-bold text-foreground">{recommendation.time}</span>
            <Badge className={`ml-3 ${getQualityColor(recommendation.quality)}`}>
              {recommendation.quality}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:text-primary/70 dark:text-mint-400 dark:hover:text-mint-300"
            >
              <AlarmClock className="h-5 w-5" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{recommendation.cycles} complete sleep cycles</span>
          <span>{recommendation.totalSleep} of sleep</span>
        </div>

        <CollapsibleContent className="space-y-4 mt-4 pt-4 border-t border-border/50">
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep Cycle Analysis
            </h4>
            
            {/* Sleep Timeline */}
            <div className="space-y-2 mb-4">
              <div className="text-xs text-muted-foreground mb-2">Sleep Timeline for {recommendation.time} {calculationMode === 'wakeUp' ? 'bedtime' : 'wake time'}:</div>
              {cycleTimeline.map((cycle, index) => (
                <div key={index} className="flex items-center gap-3 text-xs">
                  <div className="w-16 text-center">
                    <span className="font-medium">Cycle {cycle.cycle}</span>
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full"></div>
                    {cycle.isLastCycle && (
                      <div className="absolute right-0 top-0 w-1 h-full bg-green-500"></div>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {cycle.start} → {cycle.end}
                    {cycle.isLastCycle && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                        <Sun className="h-3 w-3 inline ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sleep Quality Explanation */}
            <div className="p-3 bg-muted/30 rounded-lg text-xs">
              <div className="font-medium mb-1">Why this is {recommendation.quality.toLowerCase()} quality:</div>
              {recommendation.quality === 'EXCELLENT' && (
                <p>Perfect alignment with your {ageData.name.toLowerCase()} sleep needs. {recommendation.cycles} cycles provide optimal restoration with {cycleLength}-minute cycles.</p>
              )}
              {recommendation.quality === 'GOOD' && (
                <p>Good sleep duration with {recommendation.cycles} complete cycles. Slightly off optimal timing but still provides quality rest.</p>
              )}
              {recommendation.quality === 'FAIR' && (
                <p>Adequate sleep duration but may result in waking during deep sleep phase. Consider adjusting by 15-30 minutes.</p>
              )}
              {recommendation.quality === 'POOR' && (
                <p>Too few cycles or poor timing alignment. This may result in grogginess from interrupted deep sleep.</p>
              )}
            </div>

            {/* Age-Specific Notes */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
              <div className="font-medium mb-1">For {ageData.name}:</div>
              <p>• Recommended total sleep: {ageData.sleepRange}</p>
              <p>• Typical cycle length: {cycleLength} minutes</p>
              <p>• Fall asleep time: ~{settings.fallAsleepTime} minutes</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
