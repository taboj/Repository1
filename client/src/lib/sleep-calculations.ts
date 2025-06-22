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

export function getAgeGroup(age: number): 'newborn' | 'infant' | 'toddler' | 'preschool' | 'schoolAge' | 'teen' | 'adult' | 'senior' {
  if (age < 0.25) return 'newborn'; // 0-3 months
  if (age < 1) return 'infant'; // 4-12 months
  if (age < 3) return 'toddler'; // 1-2 years
  if (age < 6) return 'preschool'; // 3-5 years
  if (age < 13) return 'schoolAge'; // 6-12 years
  if (age < 19) return 'teen'; // 13-18 years
  if (age < 65) return 'adult'; // 18-64 years
  return 'senior'; // 65+ years
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
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
  if (duration < 0) {
    duration += 24 * 60 * 60 * 1000; // Add 24 hours if wake time is next day
  }
  return duration / (1000 * 60); // Return in minutes
}

export function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

export function getQualityFromCycles(cycles: number): SleepRecommendation['quality'] {
  if (cycles >= 6) return 'EXCELLENT';
  if (cycles >= 5) return 'GOOD';
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
  const ageData = getAgeGroupRecommendations(settings.age);
  const actualSleepStart = new Date(bedtime.getTime() + settings.fallAsleepTime * 60 * 1000);
  
  // Generate 5 recommendations with different cycle counts
  const cycleOptions = [3, 4, 5, 6, 7];
  
  cycleOptions.forEach(cycles => {
    const wakeTime = new Date(actualSleepStart.getTime() + cycles * cycleLength * 60 * 1000);
    
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
      time: formatTime(wakeTime),
      quality,
      cycles,
      totalSleep: formatSleepDuration(cycles * cycleLength),
      totalMinutes: cycles * cycleLength
    });
  });
  
  return recommendations.sort((a, b) => {
    const qualityOrder = { 'EXCELLENT': 4, 'GOOD': 3, 'FAIR': 2, 'POOR': 1 };
    return qualityOrder[b.quality] - qualityOrder[a.quality];
  });
}

export const AGE_GROUPS: Record<string, AgeGroupData> = {
  newborn: {
    name: 'Newborn (0-3 months)',
    sleepRange: '14-17 hours',
    recommendedHours: { min: 14, max: 17 },
    cycleLength: 50,
    remSleepPercentage: 50,
    deepSleepPercentage: 25,
    characteristics: [
      'Sleep occurs in 2-4 hour periods throughout day and night',
      'Highest proportion of REM sleep for brain development',
      'No established circadian rhythm yet',
      'Sleep is divided equally between day and night'
    ]
  },
  infant: {
    name: 'Infant (4-12 months)',
    sleepRange: '12-16 hours (including naps)',
    recommendedHours: { min: 12, max: 16 },
    cycleLength: 60,
    remSleepPercentage: 40,
    deepSleepPercentage: 30,
    characteristics: [
      'Longer sleep periods at night develop',
      'Regular nap schedule begins to form',
      'Sleep consolidation improves',
      'May experience sleep regressions'
    ]
  },
  toddler: {
    name: 'Toddler (1-2 years)',
    sleepRange: '11-14 hours (including naps)',
    recommendedHours: { min: 11, max: 14 },
    cycleLength: 70,
    remSleepPercentage: 30,
    deepSleepPercentage: 25,
    characteristics: [
      'Transition from 2 naps to 1 nap',
      'Bedtime resistance may increase',
      'Nighttime sleep becomes more consolidated',
      'Dreams and nightmares may begin'
    ]
  },
  preschool: {
    name: 'Preschool (3-5 years)',
    sleepRange: '10-13 hours (including naps)',
    recommendedHours: { min: 10, max: 13 },
    cycleLength: 80,
    remSleepPercentage: 25,
    deepSleepPercentage: 22,
    characteristics: [
      'Most children stop napping by age 5',
      'Bedtime fears and anxiety may emerge',
      'Sleep patterns becoming more adult-like',
      'Sleepwalking and night terrors may occur'
    ]
  },
  schoolAge: {
    name: 'School Age (6-12 years)',
    sleepRange: '9-12 hours',
    recommendedHours: { min: 9, max: 12 },
    cycleLength: 90,
    remSleepPercentage: 25,
    deepSleepPercentage: 20,
    characteristics: [
      'Peak deep sleep for growth and development',
      'More consistent sleep patterns',
      'Academic and social pressures may affect sleep',
      'Screen time can impact sleep quality'
    ]
  },
  teen: {
    name: 'Teen (13-18 years)',
    sleepRange: '8-10 hours',
    recommendedHours: { min: 8, max: 10 },
    cycleLength: 90,
    remSleepPercentage: 23,
    deepSleepPercentage: 18,
    characteristics: [
      'Natural shift to later bedtimes (delayed circadian rhythm)',
      'High sleep pressure due to brain development',
      'Often experience chronic sleep deprivation',
      'REM sleep important for emotional regulation'
    ]
  },
  adult: {
    name: 'Adult (18-60 years)',
    sleepRange: '7-9 hours',
    recommendedHours: { min: 7, max: 9 },
    cycleLength: 90,
    remSleepPercentage: 20,
    deepSleepPercentage: 15,
    characteristics: [
      'Stable circadian rhythms',
      'Sleep efficiency typically 85-90%',
      'Work and life stress can impact sleep',
      'Career and family responsibilities affect schedule'
    ]
  },
  senior: {
    name: 'Senior (65+ years)',
    sleepRange: '7-8 hours',
    recommendedHours: { min: 7, max: 8 },
    cycleLength: 85,
    remSleepPercentage: 18,
    deepSleepPercentage: 12,
    characteristics: [
      'Earlier bedtime and wake time preferences',
      'More fragmented sleep with frequent awakenings',
      'Reduced deep sleep and REM sleep',
      'Increased daytime napping tendency'
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