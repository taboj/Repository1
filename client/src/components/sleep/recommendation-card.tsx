import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlarmClock } from "lucide-react";
import type { SleepRecommendation } from "@/lib/sleep-calculations";

interface RecommendationCardProps {
  recommendation: SleepRecommendation;
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
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

  return (
    <div className={`bg-gradient-to-r ${getGradientColor(recommendation.quality)} border-l-4 rounded-lg p-4 hover:shadow-md transition-all duration-200`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className="text-3xl font-bold text-foreground">{recommendation.time}</span>
          <Badge className={`ml-3 ${getQualityColor(recommendation.quality)}`}>
            {recommendation.quality}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:text-primary/70 dark:text-mint-400 dark:hover:text-mint-300"
        >
          <AlarmClock className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{recommendation.cycles} complete sleep cycles</span>
        <span>{recommendation.totalSleep} of sleep</span>
      </div>
    </div>
  );
}
