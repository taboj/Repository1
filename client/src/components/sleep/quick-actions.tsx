import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlarmClock, Bell, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SleepRecommendation } from "@/lib/sleep-calculations";

interface QuickActionsProps {
  recommendations: SleepRecommendation[];
  calculationMode: 'wakeUp' | 'bedTime';
  onReverseCalculate: () => void;
}

export default function QuickActions({ recommendations, calculationMode, onReverseCalculate }: QuickActionsProps) {
  const { toast } = useToast();
  const bestRecommendation = recommendations[0];

  const handleSetAlarm = () => {
    if (bestRecommendation) {
      toast({
        title: "Alarm Set",
        description: `Alarm set for ${bestRecommendation.time}`,
      });
    }
  };

  const handleSetReminder = () => {
    if (bestRecommendation) {
      const reminderTime = calculationMode === 'wakeUp' ? bestRecommendation.time : '30 minutes before bedtime';
      toast({
        title: "Reminder Set",
        description: `Reminder set for ${reminderTime}`,
      });
    }
  };

  if (!bestRecommendation) return null;

  return (
    <Card className="mb-8 shadow-xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 dark:bg-mint-500 dark:hover:bg-mint-600 text-primary-foreground"
            onClick={handleSetAlarm}
          >
            <AlarmClock className="mr-2 h-4 w-4" />
            Set Alarm for {bestRecommendation.time}
          </Button>
          
          <Button 
            variant="secondary"
            className="flex-1"
            onClick={handleSetReminder}
          >
            <Bell className="mr-2 h-4 w-4" />
            {calculationMode === 'wakeUp' ? 'Remind Me at Bedtime' : 'Remind Me Before Wake'}
          </Button>
          
          <Button
            variant="outline"
            className="sm:w-auto hover:border-primary dark:hover:border-mint-400"
            onClick={onReverseCalculate}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reverse
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
