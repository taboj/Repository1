export interface SleepRecommendation {
  time: string;
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  cycles: number;
  totalSleep: string;
  totalMinutes: number;
}

export interface SleepSettings {
  fallAsleepTime: number; // minutes
  cycleLength: number; // minutes
  selectedCycles: number;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function parseTimeString(timeStr: string, period: 'AM' | 'PM'): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  date.setHours(hour24, minutes, 0, 0);
  return date;
}

export function calculateSleepDuration(bedtime: Date, wakeTime: Date): number {
  let duration = wakeTime.getTime() - bedtime.getTime();
  
  // If wake time is before bedtime, it's the next day
  if (duration < 0) {
    duration += 24 * 60 * 60 * 1000;
  }
  
  return Math.floor(duration / (1000 * 60)); // Return minutes
}

export function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
}

export function getQualityFromCycles(cycles: number): SleepRecommendation['quality'] {
  if (cycles >= 5) return 'EXCELLENT';
  if (cycles >= 4) return 'GOOD';
  if (cycles >= 3) return 'FAIR';
  return 'POOR';
}

export function calculateOptimalBedtimes(
  wakeTime: Date,
  settings: SleepSettings
): SleepRecommendation[] {
  const recommendations: SleepRecommendation[] = [];
  const cycleOptions = [6, 5, 4, 3]; // Different cycle counts to try
  
  cycleOptions.forEach(cycles => {
    const totalSleepTime = cycles * settings.cycleLength + settings.fallAsleepTime;
    const bedtime = new Date(wakeTime.getTime() - totalSleepTime * 60 * 1000);
    
    recommendations.push({
      time: formatTime(bedtime),
      quality: getQualityFromCycles(cycles),
      cycles,
      totalSleep: formatSleepDuration(cycles * settings.cycleLength),
      totalMinutes: cycles * settings.cycleLength
    });
  });
  
  return recommendations;
}

export function calculateOptimalWakeTimes(
  bedtime: Date,
  settings: SleepSettings
): SleepRecommendation[] {
  const recommendations: SleepRecommendation[] = [];
  const actualSleepStart = new Date(bedtime.getTime() + settings.fallAsleepTime * 60 * 1000);
  const cycleOptions = [4, 5, 6]; // Different cycle counts to try
  
  cycleOptions.forEach(cycles => {
    const wakeTime = new Date(actualSleepStart.getTime() + cycles * settings.cycleLength * 60 * 1000);
    
    recommendations.push({
      time: formatTime(wakeTime),
      quality: getQualityFromCycles(cycles),
      cycles,
      totalSleep: formatSleepDuration(cycles * settings.cycleLength),
      totalMinutes: cycles * settings.cycleLength
    });
  });
  
  return recommendations;
}

export function shouldShowSleepWarning(recommendations: SleepRecommendation[]): boolean {
  // Show warning if the best recommendation is less than 6 hours
  const bestRecommendation = recommendations[0];
  return bestRecommendation?.totalMinutes < 360; // 6 hours = 360 minutes
}
