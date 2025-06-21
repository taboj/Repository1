import { formatTime } from "@/lib/sleep-calculations";
import type { SleepRecommendation } from "@/lib/sleep-calculations";
import { Sun } from "lucide-react";

interface SleepCycleVisualizationProps {
  selectedTime: {
    hour: number;
    minute: number;
    period: 'AM' | 'PM';
  };
  calculationMode: 'wakeUp' | 'bedTime';
  bestRecommendation?: SleepRecommendation;
}

export default function SleepCycleVisualization({ 
  selectedTime, 
  calculationMode, 
  bestRecommendation 
}: SleepCycleVisualizationProps) {
  const sleepPhases = [
    { name: 'Light', color: 'from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600' },
    { name: 'Deep', color: 'from-indigo-300 to-indigo-400 dark:from-indigo-700 dark:to-indigo-600' },
    { name: 'REM', color: 'from-purple-300 to-purple-400 dark:from-purple-700 dark:to-purple-600' },
    { name: 'Light', color: 'from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600' },
    { name: 'Deep', color: 'from-indigo-300 to-indigo-400 dark:from-indigo-700 dark:to-indigo-600' }
  ];

  const startTime = calculationMode === 'wakeUp' && bestRecommendation 
    ? bestRecommendation.time 
    : `${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, '0')} ${selectedTime.period}`;
    
  const endTime = calculationMode === 'bedTime' && bestRecommendation 
    ? bestRecommendation.time 
    : `${selectedTime.hour}:${selectedTime.minute.toString().padStart(2, '0')} ${selectedTime.period}`;

  return (
    <div className="bg-muted rounded-lg p-4">
      <h4 className="font-semibold mb-4 text-center">Sleep Cycle Timeline</h4>
      
      {/* Sleep cycle visualization with phases */}
      <div className="relative h-16 bg-background rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex">
          {sleepPhases.map((phase, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${phase.color} h-full flex-1 flex items-center justify-center text-xs font-medium ${
                phase.name === 'Deep' || phase.name === 'REM' ? 'text-white' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {phase.name}
            </div>
          ))}
        </div>
        
        {/* Wake-up marker */}
        <div className="absolute top-0 left-3/4 w-1 h-full bg-green-500 opacity-75"></div>
        <div className="absolute -top-6 left-3/4 transform -translate-x-1/2">
          <Sun className="h-4 w-4 text-green-500" />
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{calculationMode === 'wakeUp' ? 'Bedtime' : 'Sleep start'}: {startTime}</span>
        <span className="text-green-600 dark:text-green-400">Optimal wake window</span>
        <span>{calculationMode === 'bedTime' ? 'Wake time' : 'Target wake'}: {endTime}</span>
      </div>
    </div>
  );
}
