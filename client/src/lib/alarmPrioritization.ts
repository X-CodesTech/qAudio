/**
 * Intelligent Alarm Prioritization System
 * 
 * This system categorizes and prioritizes transmitter alarms based on their severity,
 * potential impact, and urgency. It helps operators quickly identify which issues
 * require immediate attention.
 */

export enum AlarmSeverity {
  CRITICAL = 'critical',   // Immediate action required, major impact on broadcasting
  HIGH = 'high',           // Urgent attention needed, significant impact possible
  MEDIUM = 'medium',       // Requires attention soon, moderate impact
  LOW = 'low',             // Minor issue, minimal impact on operations
  INFO = 'info'            // Informational only, no immediate action needed
}

export enum AlarmCategory {
  POWER = 'power',         // Issues related to power systems (forward/reflected power)
  AUDIO = 'audio',         // Issues with audio signal or quality
  THERMAL = 'thermal',     // Temperature-related issues
  CONNECTION = 'connection', // Network or connection issues
  HARDWARE = 'hardware',   // Physical hardware failures or issues
  SYSTEM = 'system'        // General system issues
}

export interface Alarm {
  id: number;              // Unique identifier for the alarm
  transmitterId: number;   // ID of the transmitter generating the alarm
  timestamp: Date;         // When the alarm was generated
  severity: AlarmSeverity; // How severe is the issue
  category: AlarmCategory; // Type of issue
  message: string;         // Human-readable description
  value?: number;          // Current value that triggered the alarm (if applicable)
  threshold?: number;      // Threshold value that was exceeded (if applicable)
  acknowledged: boolean;   // Whether an operator has acknowledged the alarm
  resolved: boolean;       // Whether the issue has been resolved
  autoResolved?: boolean;  // Whether the system automatically resolved the issue
  notes?: string;          // Optional operator notes about the alarm
}

export interface AlarmThresholds {
  forwardPowerLow: number;       // Forward power below this level (W) = HIGH alarm
  forwardPowerCritical: number;  // Forward power below this level (W) = CRITICAL alarm
  forwardPowerHigh: number;      // Forward power above this level (W) = HIGH alarm
  reflectedPowerWarning: number; // Reflected power above this level (W) = MEDIUM alarm
  reflectedPowerHigh: number;    // Reflected power above this level (W) = HIGH alarm
  reflectedPowerCritical: number;// Reflected power above this level (W) = CRITICAL alarm
  vswr: number;                  // VSWR above this level = HIGH alarm
  temperatureWarning: number;    // Temperature above this level (°C) = MEDIUM alarm
  temperatureHigh: number;       // Temperature above this level (°C) = HIGH alarm
  temperatureCritical: number;   // Temperature above this level (°C) = CRITICAL alarm
  audioLevelLow: number;         // Audio below this level (dB) = MEDIUM alarm
  audioLevelHigh: number;        // Audio above this level (dB) = MEDIUM alarm
  audioSilenceTime: number;      // Audio silence longer than this (seconds) = HIGH alarm
}

/**
 * Default threshold values for various alarm conditions
 * These can be customized per transmitter
 */
export const defaultAlarmThresholds: AlarmThresholds = {
  forwardPowerLow: 300,          // 300W - HIGH
  forwardPowerCritical: 50,      // 50W - CRITICAL
  forwardPowerHigh: 1200,        // 1200W - HIGH (if rated for 1000W)
  reflectedPowerWarning: 20,     // 20W - MEDIUM
  reflectedPowerHigh: 50,        // 50W - HIGH
  reflectedPowerCritical: 100,   // 100W - CRITICAL
  vswr: 1.5,                     // VSWR 1.5:1 - HIGH
  temperatureWarning: 40,        // 40°C - MEDIUM
  temperatureHigh: 50,           // 50°C - HIGH
  temperatureCritical: 65,       // 65°C - CRITICAL
  audioLevelLow: -30,            // -30dB - MEDIUM
  audioLevelHigh: -3,            // -3dB - MEDIUM
  audioSilenceTime: 30,          // 30 sec - HIGH
};

/**
 * Check if the transmitter's current state should generate any alarms
 * @param transmitter The transmitter to check
 * @param thresholds The alarm thresholds to use (defaults to default thresholds)
 * @returns An array of alarms that should be raised based on current state
 */
export function checkTransmitterAlarms(
  transmitter: any,
  thresholds: AlarmThresholds = defaultAlarmThresholds
): Alarm[] {
  const alarms: Alarm[] = [];
  const now = new Date();
  
  // Check transmitter status
  if (transmitter.status === 'offline') {
    alarms.push({
      id: Date.now(),
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.CRITICAL,
      category: AlarmCategory.CONNECTION,
      message: 'Transmitter offline - No connection',
      acknowledged: false,
      resolved: false
    });
    
    // If transmitter is offline, we can't check other parameters reliably
    return alarms;
  }
  
  // Check forward power
  if (transmitter.forwardPower < thresholds.forwardPowerCritical) {
    alarms.push({
      id: Date.now() + 1,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.CRITICAL,
      category: AlarmCategory.POWER,
      message: 'Critical low forward power',
      value: transmitter.forwardPower,
      threshold: thresholds.forwardPowerCritical,
      acknowledged: false,
      resolved: false
    });
  } else if (transmitter.forwardPower < thresholds.forwardPowerLow) {
    alarms.push({
      id: Date.now() + 2,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.HIGH,
      category: AlarmCategory.POWER,
      message: 'Low forward power',
      value: transmitter.forwardPower,
      threshold: thresholds.forwardPowerLow,
      acknowledged: false,
      resolved: false
    });
  } else if (transmitter.forwardPower > thresholds.forwardPowerHigh) {
    alarms.push({
      id: Date.now() + 3,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.HIGH,
      category: AlarmCategory.POWER,
      message: 'Excessive forward power',
      value: transmitter.forwardPower,
      threshold: thresholds.forwardPowerHigh,
      acknowledged: false,
      resolved: false
    });
  }
  
  // Check reflected power
  if (transmitter.reflectedPower > thresholds.reflectedPowerCritical) {
    alarms.push({
      id: Date.now() + 4,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.CRITICAL,
      category: AlarmCategory.POWER,
      message: 'Critical high reflected power',
      value: transmitter.reflectedPower,
      threshold: thresholds.reflectedPowerCritical,
      acknowledged: false,
      resolved: false
    });
  } else if (transmitter.reflectedPower > thresholds.reflectedPowerHigh) {
    alarms.push({
      id: Date.now() + 5,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.HIGH,
      category: AlarmCategory.POWER,
      message: 'High reflected power',
      value: transmitter.reflectedPower,
      threshold: thresholds.reflectedPowerHigh,
      acknowledged: false,
      resolved: false
    });
  } else if (transmitter.reflectedPower > thresholds.reflectedPowerWarning) {
    alarms.push({
      id: Date.now() + 6,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.POWER,
      message: 'Elevated reflected power',
      value: transmitter.reflectedPower,
      threshold: thresholds.reflectedPowerWarning,
      acknowledged: false,
      resolved: false
    });
  }
  
  // Check temperature
  if (transmitter.temperature > thresholds.temperatureCritical) {
    alarms.push({
      id: Date.now() + 7,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.CRITICAL,
      category: AlarmCategory.THERMAL,
      message: 'Critical high temperature',
      value: transmitter.temperature,
      threshold: thresholds.temperatureCritical,
      acknowledged: false,
      resolved: false
    });
  } else if (transmitter.temperature > thresholds.temperatureHigh) {
    alarms.push({
      id: Date.now() + 8,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.HIGH,
      category: AlarmCategory.THERMAL,
      message: 'High temperature',
      value: transmitter.temperature,
      threshold: thresholds.temperatureHigh,
      acknowledged: false,
      resolved: false
    });
  } else if (transmitter.temperature > thresholds.temperatureWarning) {
    alarms.push({
      id: Date.now() + 9,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.THERMAL,
      message: 'Elevated temperature',
      value: transmitter.temperature,
      threshold: thresholds.temperatureWarning,
      acknowledged: false,
      resolved: false
    });
  }
  
  // Check audio levels
  const leftAudioTooLow = transmitter.audioLevelLeft < thresholds.audioLevelLow;
  const rightAudioTooLow = transmitter.audioLevelRight < thresholds.audioLevelLow;
  const leftAudioTooHigh = transmitter.audioLevelLeft > thresholds.audioLevelHigh;
  const rightAudioTooHigh = transmitter.audioLevelRight > thresholds.audioLevelHigh;
  
  if (leftAudioTooLow && rightAudioTooLow) {
    alarms.push({
      id: Date.now() + 10,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.AUDIO,
      message: 'Audio levels too low on both channels',
      value: Math.max(transmitter.audioLevelLeft, transmitter.audioLevelRight),
      threshold: thresholds.audioLevelLow,
      acknowledged: false,
      resolved: false
    });
  } else if (leftAudioTooLow) {
    alarms.push({
      id: Date.now() + 11,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.AUDIO,
      message: 'Left audio channel level too low',
      value: transmitter.audioLevelLeft,
      threshold: thresholds.audioLevelLow,
      acknowledged: false,
      resolved: false
    });
  } else if (rightAudioTooLow) {
    alarms.push({
      id: Date.now() + 12,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.AUDIO,
      message: 'Right audio channel level too low',
      value: transmitter.audioLevelRight,
      threshold: thresholds.audioLevelLow,
      acknowledged: false,
      resolved: false
    });
  }
  
  if (leftAudioTooHigh && rightAudioTooHigh) {
    alarms.push({
      id: Date.now() + 13,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.AUDIO,
      message: 'Audio levels too high on both channels',
      value: Math.min(transmitter.audioLevelLeft, transmitter.audioLevelRight),
      threshold: thresholds.audioLevelHigh,
      acknowledged: false,
      resolved: false
    });
  } else if (leftAudioTooHigh) {
    alarms.push({
      id: Date.now() + 14,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.AUDIO,
      message: 'Left audio channel level too high',
      value: transmitter.audioLevelLeft,
      threshold: thresholds.audioLevelHigh,
      acknowledged: false,
      resolved: false
    });
  } else if (rightAudioTooHigh) {
    alarms.push({
      id: Date.now() + 15,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.MEDIUM,
      category: AlarmCategory.AUDIO,
      message: 'Right audio channel level too high',
      value: transmitter.audioLevelRight,
      threshold: thresholds.audioLevelHigh,
      acknowledged: false,
      resolved: false
    });
  }
  
  // Add any custom alarms specified in the transmitter's hasAlarm property
  if (transmitter.hasAlarm && !alarms.length) {
    // If no other alarms were detected but the transmitter has an alarm flag,
    // add a generic alarm (likely from hardware-specific monitoring)
    alarms.push({
      id: Date.now() + 16,
      transmitterId: transmitter.id,
      timestamp: now,
      severity: AlarmSeverity.HIGH,
      category: AlarmCategory.SYSTEM,
      message: 'Transmitter system alarm',
      acknowledged: false,
      resolved: false
    });
  }
  
  return alarms;
}

/**
 * Calculate VSWR (Voltage Standing Wave Ratio) from forward and reflected power
 * @param forwardPower Forward power in watts
 * @param reflectedPower Reflected power in watts
 * @returns VSWR value (1.0 is perfect, higher is worse)
 */
export function calculateVSWR(forwardPower: number, reflectedPower: number): number {
  if (forwardPower <= 0 || reflectedPower < 0) return 1.0;
  
  // Reflection coefficient
  const gamma = Math.sqrt(reflectedPower / forwardPower);
  
  // VSWR calculation
  const vswr = (1 + gamma) / (1 - gamma);
  
  return isFinite(vswr) ? vswr : 999.9; // Handle division by zero
}

/**
 * Get a label for an alarm severity level
 * @param severity The severity level
 * @returns A user-friendly label
 */
export function getAlarmSeverityLabel(severity: AlarmSeverity): string {
  switch (severity) {
    case AlarmSeverity.CRITICAL:
      return 'CRITICAL';
    case AlarmSeverity.HIGH:
      return 'HIGH';
    case AlarmSeverity.MEDIUM:
      return 'MEDIUM';
    case AlarmSeverity.LOW:
      return 'LOW';
    case AlarmSeverity.INFO:
      return 'INFO';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Get the color class for an alarm severity level
 * @param severity The severity level
 * @returns CSS color class
 */
export function getAlarmSeverityColor(severity: AlarmSeverity): string {
  switch (severity) {
    case AlarmSeverity.CRITICAL:
      return 'text-red-500';
    case AlarmSeverity.HIGH:
      return 'text-orange-500';
    case AlarmSeverity.MEDIUM:
      return 'text-yellow-500';
    case AlarmSeverity.LOW:
      return 'text-blue-500';
    case AlarmSeverity.INFO:
      return 'text-gray-500';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get the color class for an alarm severity level's background
 * @param severity The severity level
 * @returns CSS color class
 */
export function getAlarmSeverityBgColor(severity: AlarmSeverity): string {
  switch (severity) {
    case AlarmSeverity.CRITICAL:
      return 'bg-red-900 border-red-700';
    case AlarmSeverity.HIGH:
      return 'bg-orange-900 border-orange-700';
    case AlarmSeverity.MEDIUM:
      return 'bg-yellow-900 border-yellow-700';
    case AlarmSeverity.LOW:
      return 'bg-blue-900 border-blue-700';
    case AlarmSeverity.INFO:
      return 'bg-gray-900 border-gray-700';
    default:
      return 'bg-gray-900 border-gray-700';
  }
}

/**
 * Get the animation class for an alarm severity level
 * All animations have been removed as requested
 * @param severity The severity level
 * @returns CSS animation class (empty string as animations are disabled)
 */
export function getAlarmSeverityAnimation(severity: AlarmSeverity): string {
  // No animations for any severity level, as animations have been disabled
  return '';
}

/**
 * Sort alarms by priority (severity, then timestamp)
 * @param alarms Array of alarms to sort
 * @returns Sorted array of alarms
 */
export function sortAlarmsByPriority(alarms: Alarm[]): Alarm[] {
  // Severity ranking map (for sorting)
  const severityRank: Record<AlarmSeverity, number> = {
    [AlarmSeverity.CRITICAL]: 0,
    [AlarmSeverity.HIGH]: 1,
    [AlarmSeverity.MEDIUM]: 2,
    [AlarmSeverity.LOW]: 3,
    [AlarmSeverity.INFO]: 4,
  };
  
  return [...alarms].sort((a, b) => {
    // First by severity
    const severityDiff = severityRank[a.severity] - severityRank[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then by timestamp (newest first)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

/**
 * Filter alarms by various criteria
 * @param alarms Array of alarms to filter
 * @param options Filter options
 * @returns Filtered array of alarms
 */
export function filterAlarms(
  alarms: Alarm[], 
  options: {
    severity?: AlarmSeverity[],
    category?: AlarmCategory[],
    transmitterId?: number,
    acknowledged?: boolean,
    resolved?: boolean,
    search?: string,
  } = {}
): Alarm[] {
  return alarms.filter(alarm => {
    // Filter by severity
    if (options.severity && options.severity.length > 0) {
      if (!options.severity.includes(alarm.severity)) return false;
    }
    
    // Filter by category
    if (options.category && options.category.length > 0) {
      if (!options.category.includes(alarm.category)) return false;
    }
    
    // Filter by transmitter
    if (options.transmitterId !== undefined) {
      if (alarm.transmitterId !== options.transmitterId) return false;
    }
    
    // Filter by acknowledgement status
    if (options.acknowledged !== undefined) {
      if (alarm.acknowledged !== options.acknowledged) return false;
    }
    
    // Filter by resolution status
    if (options.resolved !== undefined) {
      if (alarm.resolved !== options.resolved) return false;
    }
    
    // Filter by search text
    if (options.search && options.search.trim() !== '') {
      const searchLower = options.search.toLowerCase();
      const matchesMessage = alarm.message.toLowerCase().includes(searchLower);
      const matchesNotes = alarm.notes?.toLowerCase().includes(searchLower) || false;
      
      if (!matchesMessage && !matchesNotes) return false;
    }
    
    return true;
  });
}

/**
 * Get a short summary of transmitter alarms for dashboard display
 * @param alarms Array of alarms for a transmitter
 * @returns Summary object with counts by severity
 */
export function getAlarmSummary(alarms: Alarm[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
  highestSeverity: AlarmSeverity | null;
} {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: alarms.length,
    highestSeverity: null as AlarmSeverity | null,
  };
  
  for (const alarm of alarms) {
    switch (alarm.severity) {
      case AlarmSeverity.CRITICAL:
        summary.critical++;
        if (!summary.highestSeverity || summary.highestSeverity !== AlarmSeverity.CRITICAL) {
          summary.highestSeverity = AlarmSeverity.CRITICAL;
        }
        break;
      case AlarmSeverity.HIGH:
        summary.high++;
        if (!summary.highestSeverity || (
          summary.highestSeverity !== AlarmSeverity.CRITICAL &&
          summary.highestSeverity !== AlarmSeverity.HIGH
        )) {
          summary.highestSeverity = AlarmSeverity.HIGH;
        }
        break;
      case AlarmSeverity.MEDIUM:
        summary.medium++;
        if (!summary.highestSeverity || (
          summary.highestSeverity !== AlarmSeverity.CRITICAL &&
          summary.highestSeverity !== AlarmSeverity.HIGH &&
          summary.highestSeverity !== AlarmSeverity.MEDIUM
        )) {
          summary.highestSeverity = AlarmSeverity.MEDIUM;
        }
        break;
      case AlarmSeverity.LOW:
        summary.low++;
        if (!summary.highestSeverity || (
          summary.highestSeverity !== AlarmSeverity.CRITICAL &&
          summary.highestSeverity !== AlarmSeverity.HIGH &&
          summary.highestSeverity !== AlarmSeverity.MEDIUM &&
          summary.highestSeverity !== AlarmSeverity.LOW
        )) {
          summary.highestSeverity = AlarmSeverity.LOW;
        }
        break;
      case AlarmSeverity.INFO:
        summary.info++;
        if (!summary.highestSeverity) {
          summary.highestSeverity = AlarmSeverity.INFO;
        }
        break;
    }
  }
  
  return summary;
}