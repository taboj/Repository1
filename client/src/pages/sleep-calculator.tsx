import { useState, useEffect } from "react";
import { Moon, Sun, AlarmClock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import {
  calculateOptimalBedtimes,
  parseTimeString,
  getAgeGroupRecommendations,
  getCycleLength,
  getAgeGroup,
  type SleepRecommendation,
  type SleepSettings
} from "@/lib/sleep-calculations";

export default function SleepCalculator() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [wakeUpTime, setWakeUpTime] = useState({ hour: 7, minute: 0, period: 'AM' as 'AM' | 'PM' });
  const [age, setAge] = useState(25);
  const [fallAsleepTime, setFallAsleepTime] = useState(15);
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);

  const updateRecommendations = () => {
    const timeString = `${wakeUpTime.hour}:${wakeUpTime.minute.toString().padStart(2, '0')}`;
    const targetTime = parseTimeString(timeString, wakeUpTime.period);
    
    const settings: SleepSettings = {
      fallAsleepTime,
      selectedCycles: 5, // Not used in new calculation
      age
    };
    
    const newRecommendations = calculateOptimalBedtimes(targetTime, settings);
    setRecommendations(newRecommendations);
  };

  useEffect(() => {
    updateRecommendations();
  }, [wakeUpTime, age, fallAsleepTime]);

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

  const handleSetAlarm = (time: string) => {
    toast({
      title: "Alarm Set",
      description: `Alarm set for ${time}`,
    });
  };

  const ageData = getAgeGroupRecommendations(age);
  const cycleLength = getCycleLength(age);

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
        {/* Input Section */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Calculate Your Optimal Bedtime</h2>
            
            {/* Wake Up Time Input */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">What time do you want to wake up?</h3>
              <div className="flex items-center justify-center gap-4 bg-muted/30 rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <select
                    value={wakeUpTime.hour}
                    onChange={(e) => setWakeUpTime(prev => ({ ...prev, hour: Number(e.target.value) }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none min-w-[80px] text-center"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-4xl font-bold">:</span>
                  <select
                    value={wakeUpTime.minute}
                    onChange={(e) => setWakeUpTime(prev => ({ ...prev, minute: Number(e.target.value) }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none min-w-[80px] text-center"
                  >
                    {[0, 15, 30, 45].map(minute => (
                      <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={wakeUpTime.period}
                    onChange={(e) => setWakeUpTime(prev => ({ ...prev, period: e.target.value as 'AM' | 'PM' }))}
                    className="text-4xl font-bold bg-transparent border-none outline-none ml-2"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Age Input */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Your Age</h3>
                <span className="text-lg font-bold text-primary dark:text-mint-400">
                  {age} years old
                </span>
              </div>
              <Slider
                value={[age]}
                onValueChange={([value]) => setAge(value)}
                min={6}
                max={100}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>6 years</span>
                <span className="font-medium">Age Group: {ageData.name}</span>
                <span>100 years</span>
              </div>
            </div>

            {/* Fall Asleep Time Input */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">How long does it take you to fall asleep?</h3>
                <span className="text-lg font-bold text-primary dark:text-mint-400">
                  {fallAsleepTime} minutes
                </span>
              </div>
              <Slider
                value={[fallAsleepTime]}
                onValueChange={([value]) => setFallAsleepTime(value)}
                min={5}
                max={60}
                step={5}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>5 minutes</span>
                <span>60 minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {recommendations.length > 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-2">Recommended Bedtimes</h3>
              <p className="text-muted-foreground mb-6">
                Based on {cycleLength}-minute sleep cycles for {ageData.name.toLowerCase()}. 
                Recommended sleep: {ageData.sleepRange}
              </p>

              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-2xl font-bold">{rec.time}</div>
                        <Badge className={getQualityColor(rec.quality)}>
                          {rec.quality}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {getTimeUntil(rec.time)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{rec.cycles} sleep cycles</span> • {rec.totalSleep} total sleep
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Age-specific sleep info */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-lg">
                <h4 className="font-semibold mb-2">Sleep Information for {ageData.name}</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Recommended sleep:</span> {ageData.sleepRange}
                  </div>
                  <div>
                    <span className="font-medium">Sleep cycle length:</span> {cycleLength} minutes
                  </div>
                  <div>
                    <span className="font-medium">REM sleep:</span> {ageData.remSleepPercentage}% of total sleep
                  </div>
                  <div>
                    <span className="font-medium">Deep sleep:</span> {ageData.deepSleepPercentage}% of total sleep
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}