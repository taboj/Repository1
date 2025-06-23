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

export function getAgeGroup(age: number): 'newborn' | 'earlyInfant' | 'lateInfant' | 'toddler' | 'preschooler' | 'schoolAge' | 'adolescent' | 'youngAdult' | 'adult' | 'olderAdult' {
  if (age <= 2/12) return 'newborn'; // 0-2 months
  if (age <= 5/12) return 'earlyInfant'; // 3-5 months
  if (age <= 11/12) return 'lateInfant'; // 6-11 months
  if (age <= 2) return 'toddler'; // 12-23 months
  if (age <= 4) return 'preschooler'; // 2-4 years
  if (age <= 12) return 'schoolAge'; // 5-12 years
  if (age <= 17) return 'adolescent'; // 13-17 years
  if (age <= 25) return 'youngAdult'; // 18-25 years
  if (age <= 64) return 'adult'; // 26-64 years
  return 'olderAdult'; // 65+ years
}

export function getCycleLength(age: number): number {
  const ageGroup = getAgeGroup(age);
  return AGE_GROUPS[ageGroup].cycleLength;
}

export function getFallAsleepTime(age: number): number {
  const ageGroup = getAgeGroup(age);
  switch (ageGroup) {
    case 'newborn': return 5; // 0-2 months: ~5 mins
    case 'earlyInfant': return 10; // 3-5 months: ~10 mins
    case 'lateInfant': return 10; // 6-11 months: ~10 mins
    case 'toddler': return 10; // 12-23 months: ~10 mins
    case 'preschooler': return 10; // 2-4 years: ~10 mins
    case 'schoolAge': return 10; // 5-12 years: ~10 mins
    case 'adolescent': return 20; // 13-17 years: ~20 mins
    case 'youngAdult': return 15; // 18-25 years: ~15 mins
    case 'adult': return 15; // 26-64 years: ~15 mins
    case 'olderAdult': return 20; // 65+ years: ~20 mins
    default: return 15;
  }
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
    name: 'Newborn (0-2 months)',
    sleepRange: '14-17 hours',
    recommendedHours: { min: 14, max: 17 },
    cycleLength: 45, // 40-50 mins range, 45 mins average
    remSleepPercentage: 50, // Active Sleep (AS) ~50%
    deepSleepPercentage: 50, // Quiet Sleep (QS) ~50%
    characteristics: [
      'Active Sleep (AS) ~50%, Quiet Sleep (QS) ~50%',
      'No true NREM stages yet',
      '"Proto-cycles" alternate between AS and QS',
      'High variability; 45-min intruder phenomenon common'
    ]
  },
  earlyInfant: {
    name: 'Early Infant (3-5 months)',
    sleepRange: '12-15 hours',
    recommendedHours: { min: 12, max: 15 },
    cycleLength: 50, // 45-55 mins range, 50 mins average
    remSleepPercentage: 40, // REM ~40%
    deepSleepPercentage: 60, // NREM ~60%
    characteristics: [
      'True REM/NREM stages emerge',
      'REM ~40%, NREM ~60%',
      'N2 and N3 start to become distinguishable',
      'Cycles lengthen gradually'
    ]
  },
  lateInfant: {
    name: 'Late Infant (6-11 months)',
    sleepRange: '12-15 hours',
    recommendedHours: { min: 12, max: 15 },
    cycleLength: 60, // 50-65 mins range, 60 mins average
    remSleepPercentage: 30, // REM ~30%
    deepSleepPercentage: 70, // NREM ~70% (N1 ~5%, N2 ~40%, N3 ~25%)
    characteristics: [
      'REM ~30%, N1 ~5%, N2 ~40%, N3 ~25%',
      'Circadian rhythms strengthen',
      'Night sleep consolidates',
      'Sleep architecture becomes more mature'
    ]
  },
  toddler: {
    name: 'Toddler (12-23 months)',
    sleepRange: '11-14 hours',
    recommendedHours: { min: 11, max: 14 },
    cycleLength: 70, // 60-75 mins range, 70 mins average
    remSleepPercentage: 25, // REM ~25%
    deepSleepPercentage: 75, // NREM ~75% (N1 ~5%, N2 ~45%, N3 ~25%)
    characteristics: [
      'REM ~25%, N1 ~5%, N2 ~45%, N3 ~25%',
      'Adult-like sleep architecture emerging',
      'Sleep cycles approaching adult norms',
      'More consolidated nighttime sleep'
    ]
  },
  preschooler: {
    name: 'Preschooler (2-4 years)',
    sleepRange: '10-13 hours',
    recommendedHours: { min: 10, max: 13 },
    cycleLength: 80, // 70-85 mins range, 80 mins average
    remSleepPercentage: 25, // REM ~25%
    deepSleepPercentage: 75, // NREM ~75% (N1 ~5%, N2 ~45%, N3 ~25%)
    characteristics: [
      'REM ~25%, N1 ~5%, N2 ~45%, N3 ~25%',
      'Cycle length approaches adult norms by age 4',
      'Sleep architecture stabilizes',
      'High proportion of deep sleep for growth'
    ]
  },
  schoolAge: {
    name: 'School Age (5-12 years)',
    sleepRange: '9-11 hours',
    recommendedHours: { min: 9, max: 11 },
    cycleLength: 90, // 85-95 mins range, 90 mins average
    remSleepPercentage: 25, // REM ~25%
    deepSleepPercentage: 75, // NREM ~75% (N1 ~5%, N2 ~45%, N3 ~25%)
    characteristics: [
      'REM ~25%, N1 ~5%, N2 ~45%, N3 ~25%',
      'Peak slow-wave sleep; mature architecture',
      'Adult-like cycle lengths established',
      'Optimal sleep efficiency period'
    ]
  },
  adolescent: {
    name: 'Adolescent (13-17 years)',
    sleepRange: '8-10 hours',
    recommendedHours: { min: 8, max: 10 },
    cycleLength: 100, // 90-110 mins range, 100 mins average
    remSleepPercentage: 25, // REM ~25%
    deepSleepPercentage: 75, // NREM ~75% (N1 ~5%, N2 ~50%, N3 ~20%)
    characteristics: [
      'REM ~25%, N1 ~5%, N2 ~50%, N3 ~20%',
      'Circadian phase delay (~2 hrs); delayed sleep timing',
      'Biological preference for later bedtimes',
      'Deep sleep (N3) begins to decline'
    ]
  },
  youngAdult: {
    name: 'Young Adult (18-25 years)',
    sleepRange: '7-9 hours',
    recommendedHours: { min: 7, max: 9 },
    cycleLength: 105, // 90-120 mins range, 105 mins average
    remSleepPercentage: 25, // REM ~25%
    deepSleepPercentage: 75, // NREM ~75% (N1 ~5%, N2 ~45%, N3 ~25%)
    characteristics: [
      'REM ~25%, N1 ~5%, N2 ~45%, N3 ~25%',
      'First cycle shorter (70-90 mins), rich in deep sleep',
      'Peak efficiency period',
      'Optimal sleep architecture'
    ]
  },
  adult: {
    name: 'Adult (26-64 years)',
    sleepRange: '7-9 hours',
    recommendedHours: { min: 7, max: 9 },
    cycleLength: 96, // 90-120 mins range, 96 mins average
    remSleepPercentage: 25, // REM ~25%
    deepSleepPercentage: 75, // NREM ~75% (N1 ~5%, N2 ~45%, N3 ~25%)
    characteristics: [
      'REM ~25%, N1 ~5%, N2 ~45%, N3 ~25%',
      'Gradual N3 decline begins after age 30',
      'Individual variability high',
      'Stable sleep patterns'
    ]
  },
  olderAdult: {
    name: 'Older Adult (65+ years)',
    sleepRange: '7-8 hours',
    recommendedHours: { min: 7, max: 8 },
    cycleLength: 95, // 90-110 mins range, 95 mins average
    remSleepPercentage: 20, // REM ~20%
    deepSleepPercentage: 80, // NREM ~80% (N1 ~10%, N2 ~50%, N3 ~15-20%)
    characteristics: [
      'REM ~20%, N1 ~10%, N2 ~50%, N3 ~15-20%',
      'Increased fragmentation, lighter sleep',
      'Earlier bed/wake times',
      'Reduced deep sleep and REM sleep'
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