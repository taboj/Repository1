import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { SleepSettings } from "@/lib/sleep-calculations";

interface PersonalizationControlsProps {
  settings: SleepSettings;
  onSettingsChange: (settings: Partial<SleepSettings>) => void;
}

export default function PersonalizationControls({ settings, onSettingsChange }: PersonalizationControlsProps) {
  const cycleOptions = [
    { cycles: 4, duration: '5.3h' },
    { cycles: 5, duration: '6.7h' },
    { cycles: 6, duration: '8h' }
  ];

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold">Personalization</h4>
      
      {/* Fall Asleep Time */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="font-medium">Time to fall asleep</Label>
          <span className="text-sm font-medium text-primary dark:text-mint-400">
            {settings.fallAsleepTime} minutes
          </span>
        </div>
        <Slider
          value={[settings.fallAsleepTime]}
          onValueChange={([value]) => onSettingsChange({ fallAsleepTime: value })}
          min={5}
          max={30}
          step={1}
          className="sleep-slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Sleep Cycle Length */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="font-medium">Sleep cycle length</Label>
          <span className="text-sm font-medium text-primary dark:text-mint-400">
            {settings.cycleLength} minutes
          </span>
        </div>
        <Slider
          value={[settings.cycleLength]}
          onValueChange={([value]) => onSettingsChange({ cycleLength: value })}
          min={80}
          max={100}
          step={1}
          className="sleep-slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>80 min</span>
          <span>100 min</span>
        </div>
      </div>

      {/* Number of Cycles */}
      <div>
        <Label className="block font-medium mb-3">Number of sleep cycles</Label>
        <div className="flex flex-wrap gap-2">
          {cycleOptions.map(({ cycles, duration }) => (
            <Button
              key={cycles}
              variant={settings.selectedCycles === cycles ? 'default' : 'outline'}
              className={`transition-all duration-200 ${
                settings.selectedCycles === cycles
                  ? 'bg-primary hover:bg-primary/90 dark:bg-mint-500 dark:hover:bg-mint-600'
                  : 'hover:border-primary dark:hover:border-mint-400'
              }`}
              onClick={() => onSettingsChange({ selectedCycles: cycles })}
            >
              {cycles} cycles <span className="text-xs opacity-70 ml-1">({duration})</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
