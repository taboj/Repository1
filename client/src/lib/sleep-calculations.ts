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
  if (age < 1) return 'infant'; // 3-12 months  
  if (age < 2) return 'toddler'; // 1-2 years
  if (age < 6) return 'preschool'; // 2-5 years
  if (age < 13) return 'schoolAge'; // 6-12 years
  if (age < 19) return 'teen'; // 10-18 years (research shows adolescence starts at 10)
  if (age < 60) return 'adult'; // 18-60 years
  return 'senior'; // 60+ years (research shows age-related changes begin around 60)
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
  
  // Use age-appropriate cycle options based on research
  const cycleOptions = calculateOptimalCyclesForAge(settings.age);
  
  cycleOptions.forEach(cycles => {
    const totalSleepTime = cycles * cycleLength + settings.fallAsleepTime;
    const bedtime = new Date(wakeTime.getTime() - totalSleepTime * 60 * 1000);
    
    // Determine quality based on age-appropriate sleep duration and research
    const sleepHours = (cycles * cycleLength) / 60;
    let quality: SleepRecommendation['quality'] = 'GOOD';
    
    // Calculate optimal cycle range for this age group
    const optimalMinCycles = Math.ceil((ageData.recommendedHours.min * 60) / cycleLength);
    const optimalMaxCycles = Math.floor((ageData.recommendedHours.max * 60) / cycleLength);
    
    if (cycles >= optimalMinCycles && cycles <= optimalMaxCycles) {
      // Within optimal range
      if (cycles >= optimalMinCycles && cycles <= optimalMaxCycles) {
        quality = 'EXCELLENT';
      }
    } else if (cycles < optimalMinCycles) {
      // Insufficient sleep
      const deficitHours = ageData.recommendedHours.min - sleepHours;
      quality = deficitHours > 2 ? 'POOR' : 'FAIR';
    } else {
      // Excessive sleep
      const excessHours = sleepHours - ageData.recommendedHours.max;
      quality = excessHours > 2 ? 'FAIR' : 'GOOD';
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
    // Sort by quality first, then by how close to optimal range
    const qualityOrder = { 'EXCELLENT': 4, 'GOOD': 3, 'FAIR': 2, 'POOR': 1 };
    const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
    if (qualityDiff !== 0) return qualityDiff;
    
    // If same quality, prefer cycles closer to the middle of optimal range
    const optimalMid = (Math.ceil((ageData.recommendedHours.min * 60) / cycleLength) + 
                      Math.floor((ageData.recommendedHours.max * 60) / cycleLength)) / 2;
    return Math.abs(a.cycles - optimalMid) - Math.abs(b.cycles - optimalMid);
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
  
  // Use age-appropriate cycle options based on research
  const cycleOptions = calculateOptimalCyclesForAge(settings.age);
  
  cycleOptions.forEach(cycles => {
    const wakeTime = new Date(actualSleepStart.getTime() + cycles * cycleLength * 60 * 1000);
    
    // Determine quality based on age-appropriate sleep duration and research
    const sleepHours = (cycles * cycleLength) / 60;
    let quality: SleepRecommendation['quality'] = 'GOOD';
    
    // Calculate optimal cycle range for this age group
    const optimalMinCycles = Math.ceil((ageData.recommendedHours.min * 60) / cycleLength);
    const optimalMaxCycles = Math.floor((ageData.recommendedHours.max * 60) / cycleLength);
    
    if (cycles >= optimalMinCycles && cycles <= optimalMaxCycles) {
      // Within optimal range
      quality = 'EXCELLENT';
    } else if (cycles < optimalMinCycles) {
      // Insufficient sleep
      const deficitHours = ageData.recommendedHours.min - sleepHours;
      quality = deficitHours > 2 ? 'POOR' : 'FAIR';
    } else {
      // Excessive sleep
      const excessHours = sleepHours - ageData.recommendedHours.max;
      quality = excessHours > 2 ? 'FAIR' : 'GOOD';
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
    // Sort by quality first, then by how close to optimal range
    const qualityOrder = { 'EXCELLENT': 4, 'GOOD': 3, 'FAIR': 2, 'POOR': 1 };
    const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
    if (qualityDiff !== 0) return qualityDiff;
    
    // If same quality, prefer cycles closer to the middle of optimal range
    const optimalMid = (Math.ceil((ageData.recommendedHours.min * 60) / cycleLength) + 
                      Math.floor((ageData.recommendedHours.max * 60) / cycleLength)) / 2;
    return Math.abs(a.cycles - optimalMid) - Math.abs(b.cycles - optimalMid);
  });
}

export const AGE_GROUPS: Record<string, AgeGroupData> = {
  newborn: {
    name: 'Newborn (0-3 months)',
    sleepRange: '16-18 hours',
    recommendedHours: { min: 16, max: 18 },
    cycleLength: 50, // 30-60 minutes from research, using 50 as average
    remSleepPercentage: 50, // Research shows 50% REM sleep
    deepSleepPercentage: 50, // Remaining 50% is quiet sleep (NREM)
    characteristics: [
      'Sleep onset occurs through REM (active sleep) rather than NREM',
      'Sleep cycles are 30-60 minutes, significantly shorter than adults',
      'Longest continuous sleep episode typically 2.5-4 hours',
      'Circadian rhythms not yet developed - emerge around 2-3 months'
    ]
  },
  infant: {
    name: 'Infant (3-12 months)',
    sleepRange: '12-16 hours (including naps)',
    recommendedHours: { min: 12, max: 16 },
    cycleLength: 75, // 60-90 minutes from research, using 75 as average
    remSleepPercentage: 25, // 20-30% from research table
    deepSleepPercentage: 75, // 70-80% NREM from research table
    characteristics: [
      'Sleep onset shifts to NREM sleep by 3 months',
      'Circadian rhythms establish with melatonin and cortisol cycling',
      'By 6 months: longest sleep episode extends to 6 hours',
      'By 12 months: sleep cycles solidify to ~90 minutes like adults'
    ]
  },
  toddler: {
    name: 'Toddler (1-2 years)',
    sleepRange: '11-14 hours (including naps)',
    recommendedHours: { min: 11, max: 14 },
    cycleLength: 90, // Research shows cycles solidify to ~90 minutes by 12+ months
    remSleepPercentage: 22, // 20-25% from research table
    deepSleepPercentage: 78, // 75-80% NREM from research table
    characteristics: [
      'Sleep cycles now mirror adult length at 90 minutes',
      'NREM sleep proportion reaches 75-80% like adults',
      'Total sleep decreases from 13 to 11 hours during this period',
      'More consolidated nighttime sleep with fewer awakenings'
    ]
  },
  preschool: {
    name: 'Preschool (2-5 years)',
    sleepRange: '10-13 hours (including naps)',
    recommendedHours: { min: 10, max: 13 },
    cycleLength: 90, // Adult-like 90 minute cycles established
    remSleepPercentage: 22, // 20-25% maintained
    deepSleepPercentage: 78, // 75-80% NREM maintained
    characteristics: [
      'Sleep patterns become increasingly adult-like',
      'High proportion of N3 (deep sleep) supports rapid growth',
      'Children spend more time in N3 compared to adolescents',
      'Sleep architecture prioritizes physical repair and immune development'
    ]
  },
  schoolAge: {
    name: 'School Age (6-12 years)',
    sleepRange: '9-11 hours',
    recommendedHours: { min: 9, max: 11 },
    cycleLength: 100, // 90-110 minutes similar to adult from research
    remSleepPercentage: 22, // ~20-25% maintained
    deepSleepPercentage: 78, // ~75-80% NREM maintained
    characteristics: [
      'Sleep cycle length now 90-110 minutes, similar to adults',
      'Continued high N3 deep sleep for growth and development',
      'More consistent sleep patterns than younger children',
      'Sleep efficiency and consolidation continue to improve'
    ]
  },
  teen: {
    name: 'Teen (10-18 years)',
    sleepRange: '8-10 hours',
    recommendedHours: { min: 8, max: 10 },
    cycleLength: 100, // 90-110 minutes, adult-like cycles
    remSleepPercentage: 22, // Adult-like proportions
    deepSleepPercentage: 78, // Adult-like proportions
    characteristics: [
      'Natural circadian shift - feel tired 1-2 hours later in evening',
      'Biological "night owl" preference conflicts with early school times',
      'Despite needing 8-10 hours, most get only 6.5-7.5 hours',
      'Increased sensitivity to blue light from electronic devices'
    ]
  },
  adult: {
    name: 'Adult (18-60 years)',
    sleepRange: '7-9 hours',
    recommendedHours: { min: 7, max: 9 },
    cycleLength: 100, // 90-110 minutes from research
    remSleepPercentage: 22, // 20-25% from research
    deepSleepPercentage: 78, // 75-80% NREM from research
    characteristics: [
      'Complete sleep cycles typically 90-110 minutes',
      'NREM sleep: 75-80% (N1: 2-5%, N2: 45-55%, N3: 10-25%)',
      'REM sleep: 20-25%, increases in duration through the night',
      'Deep sleep (N3) concentrated in first third of night'
    ]
  },
  senior: {
    name: 'Senior (60+ years)',
    sleepRange: '7-8 hours',
    recommendedHours: { min: 7, max: 8 },
    cycleLength: 100, // Cycle length remains similar, but quality changes
    remSleepPercentage: 18, // Reduced REM sleep with aging
    deepSleepPercentage: 62, // Significantly reduced N3, more N1 and N2
    characteristics: [
      'Significant decline in N3 (deep sleep) - decreases 2% per decade after age 20',
      'More fragmented sleep with 3-4 awakenings per night',
      'Advanced circadian phase - earlier bedtime and wake time',
      'Reduced sleep efficiency despite similar time in bed'
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
  const cycleLength = ageData.cycleLength;
  
  // Calculate cycles based on actual cycle length for each age group
  const minCycles = Math.ceil((ageData.recommendedHours.min * 60) / cycleLength);
  const maxCycles = Math.floor((ageData.recommendedHours.max * 60) / cycleLength);
  
  const cycles = [];
  
  // Generate a range of cycle options around the optimal range
  const startCycle = Math.max(1, minCycles - 1);
  const endCycle = Math.min(maxCycles + 2, 20); // Cap at 20 cycles for very young children
  
  for (let i = startCycle; i <= endCycle; i++) {
    cycles.push(i);
  }
  
  // Ensure we always have at least 5 options for the calculator
  if (cycles.length < 5) {
    const midPoint = Math.floor((startCycle + endCycle) / 2);
    return [midPoint - 2, midPoint - 1, midPoint, midPoint + 1, midPoint + 2].filter(c => c > 0);
  }
  
  return cycles.slice(0, 7); // Limit to 7 options for UI clarity
}