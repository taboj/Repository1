export interface SleepRecommendation {
  time: string;
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  cycles: number;
  totalSleep: string;
  totalMinutes: number;
}

export interface SleepSettings {
  fallAsleepTime: number; // minutes
  selectedCycles: number;
  age: number; // actual age in years
}

export function getAgeGroup(age: number): 'child' | 'teen' | 'adult' | 'senior' {
  if (age >= 6 && age <= 12) return 'child';
  if (age >= 13 && age <= 18) return 'teen';
  if (age >= 19 && age <= 64) return 'adult';
  return 'senior';
}

export function getCycleLength(age: number): number {
  const ageGroup = getAgeGroup(age);
  return AGE_GROUPS[ageGroup].cycleLength;
}

export interface AgeGroupData {
  name: string;
  sleepRange: string;
  recommendedHours: { min: number; max: number };
  cycleLength: number;
  remSleepPercentage: number;
  deepSleepPercentage: number;
  characteristics: string[];
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
  const cycleLength = getCycleLength(settings.age);
  const ageData = getAgeGroupRecommendations(settings.age);
  
  // Generate 5 recommendations with different cycle counts
  const cycleOptions = [3, 4, 5, 6, 7]; // Standard range for different sleep needs
  
  cycleOptions.forEach(cycles => {
    const totalSleepTime = cycles * cycleLength + settings.fallAsleepTime;
    const bedtime = new Date(wakeTime.getTime() - totalSleepTime * 60 * 1000);
    
    // Determine quality based on age-appropriate sleep duration
    let quality: SleepRecommendation['quality'] = 'GOOD';
    const sleepHours = (cycles * cycleLength) / 60;
    
    if (sleepHours >= ageData.recommendedHours.min && sleepHours <= ageData.recommendedHours.max) {
      quality = cycles >= 5 ? 'EXCELLENT' : 'GOOD';
    } else if (sleepHours < ageData.recommendedHours.min) {
      quality = sleepHours < (ageData.recommendedHours.min - 1) ? 'POOR' : 'FAIR';
    } else {
      quality = 'FAIR'; // Too much sleep
    }
    
    recommendations.push({
      time: formatTime(bedtime),
      quality,
      cycles,
      totalSleep: formatSleepDuration(cycles * cycleLength),
      totalMinutes: cycles * cycleLength
    });
  });
  
  return recommendations.sort((a, b) => {
    // Sort by quality first, then by optimal cycles for age
    const qualityOrder = { 'EXCELLENT': 4, 'GOOD': 3, 'FAIR': 2, 'POOR': 1 };
    return qualityOrder[b.quality] - qualityOrder[a.quality];
  });
}

export function calculateOptimalWakeTimes(
  bedtime: Date,
  settings: SleepSettings
): SleepRecommendation[] {
  const recommendations: SleepRecommendation[] = [];
  const cycleLength = getCycleLength(settings.age);
  const actualSleepStart = new Date(bedtime.getTime() + settings.fallAsleepTime * 60 * 1000);
  const cycleOptions = calculateOptimalCyclesForAge(settings.age);
  
  cycleOptions.forEach(cycles => {
    const wakeTime = new Date(actualSleepStart.getTime() + cycles * cycleLength * 60 * 1000);
    
    recommendations.push({
      time: formatTime(wakeTime),
      quality: getQualityFromCycles(cycles),
      cycles,
      totalSleep: formatSleepDuration(cycles * cycleLength),
      totalMinutes: cycles * cycleLength
    });
  });
  
  return recommendations;
}

export const AGE_GROUPS: Record<string, AgeGroupData> = {
  child: {
    name: 'School-aged Children (6-12 years)',
    sleepRange: '9-12 hours',
    recommendedHours: { min: 9, max: 12 },
    cycleLength: 90,
    remSleepPercentage: 25,
    deepSleepPercentage: 30,
    characteristics: [
      'Peak slow-wave (deep) sleep for growth and development',
      'Consistent sleep schedule is crucial for learning',
      'May still need occasional naps until age 6-7',
      'Earlier bedtimes (7-8 PM) are typical'
    ]
  },
  teen: {
    name: 'Teenagers (13-18 years)',
    sleepRange: '8-10 hours',
    recommendedHours: { min: 8, max: 10 },
    cycleLength: 90,
    remSleepPercentage: 23,
    deepSleepPercentage: 25,
    characteristics: [
      'Natural shift to later bedtimes due to circadian rhythm changes',
      'Melatonin production starts later in the evening',
      'Academic and social pressures can disrupt sleep',
      'Weekend sleep-in patterns can worsen sleep debt'
    ]
  },
  adult: {
    name: 'Adults (18-64 years)',
    sleepRange: '7-9 hours',
    recommendedHours: { min: 7, max: 9 },
    cycleLength: 90,
    remSleepPercentage: 20,
    deepSleepPercentage: 20,
    characteristics: [
      'Stable circadian rhythms when maintained consistently',
      'Work and lifestyle factors significantly impact sleep',
      'Sleep quality more important than quantity as you age',
      'Caffeine and alcohol tolerance decreases with age'
    ]
  },
  senior: {
    name: 'Older Adults (65+ years)',
    sleepRange: '7-8 hours',
    recommendedHours: { min: 7, max: 8 },
    cycleLength: 85,
    remSleepPercentage: 18,
    deepSleepPercentage: 15,
    characteristics: [
      'Earlier bedtimes and wake times (advanced phase)',
      'More fragmented sleep with frequent awakenings',
      'Reduced deep sleep and REM sleep',
      'Napping becomes more common and beneficial'
    ]
  }
};

export function getAgeGroupRecommendations(age: number): AgeGroupData {
  const ageGroup = getAgeGroup(age);
  return AGE_GROUPS[ageGroup];
}

export function shouldShowSleepWarning(recommendations: SleepRecommendation[], age: number): boolean {
  const ageData = getAgeGroupRecommendations(age);
  const bestRecommendation = recommendations[0];
  const minSleepMinutes = ageData.recommendedHours.min * 60;
  return bestRecommendation?.totalMinutes < minSleepMinutes;
}

export function calculateOptimalCyclesForAge(age: number): number[] {
  const ageData = getAgeGroupRecommendations(age);
  const minCycles = Math.ceil(ageData.recommendedHours.min / 1.5);
  const maxCycles = Math.floor(ageData.recommendedHours.max / 1.5);
  
  const cycles = [];
  for (let i = minCycles; i <= maxCycles; i++) {
    cycles.push(i);
  }
  return cycles.length > 0 ? cycles : [5, 6, 7];
}
