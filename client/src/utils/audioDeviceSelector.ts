/**
 * Utilities for selecting the best audio input and output devices
 * Based on analysis of device labels and types for professional broadcast use
 * 
 * Enhanced to provide better detection of professional audio hardware
 * and improved prioritization of high-quality inputs
 */

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

// Define device categories for better organization
enum DeviceCategory {
  PROFESSIONAL = 'PROFESSIONAL',
  CAPTURE = 'CAPTURE',
  EXTERNAL = 'EXTERNAL',
  STANDARD = 'STANDARD',
  FALLBACK = 'FALLBACK'
}

/**
 * Scores a device based on its label to determine how suitable it is
 * for professional audio work. Higher scores = better quality devices.
 */
function scoreAudioInputDevice(device: AudioDevice): number {
  if (!device || !device.label) return 0;
  
  const label = device.label.toLowerCase();
  let score = 0;
  
  // Core technology scores
  if (label.includes('line in') || label.includes('line-in')) score += 50;
  if (label.includes('stereo mix') || label.includes('what u hear') || 
      label.includes('what you hear')) score += 45;
  if (label.includes('aux') && !label.includes('auxiliary')) score += 40;
  if (label.includes('loopback')) score += 35;
  
  // Professional audio interfaces
  if (label.includes('audio interface')) score += 60;
  if (label.includes('rme')) score += 80; // RME is very high quality
  if (label.includes('motu')) score += 75; // MOTU - professional
  if (label.includes('universal audio') || label.includes('uad')) score += 78;
  if (label.includes('apogee')) score += 78; // Apogee - professional
  if (label.includes('avid') || label.includes('protools')) score += 75;
  if (label.includes('focusrite') || label.includes('scarlett')) score += 70;
  if (label.includes('presonus') || label.includes('audiobox')) score += 65;
  if (label.includes('behringer')) score += 60;
  if (label.includes('steinberg') || label.includes('ur22') || 
      label.includes('ur44')) score += 68;
  if (label.includes('tascam')) score += 65;
  if (label.includes('mackie')) score += 65;
  if (label.includes('roland') || label.includes('boss')) score += 63;
  if (label.includes('yamaha')) score += 63;
  if (label.includes('ssl') || label.includes('solid state')) score += 78;
  if (label.includes('audient')) score += 70;
  if (label.includes('mbox')) score += 68;
  if (label.includes('m-audio') || label.includes('maudio')) score += 60;
  if (label.includes('native instruments') || label.includes('komplete')) score += 65;
  if (label.includes('arturia')) score += 62;
  
  // Connection types (good indicators of quality)
  if (label.includes('adat')) score += 40; // Digital connection
  if (label.includes('spdif')) score += 35;
  if (label.includes('firewire')) score += 30;
  if (label.includes('thunderbolt')) score += 35;
  if (label.includes('usb audio')) score += 25;
  
  // Input types
  if (label.includes('xlr')) score += 30;
  if (label.includes('rca')) score += 25;
  if (label.includes('trs')) score += 28;
  if (label.includes('balanced')) score += 25;
  
  // Decrease score for likely low quality inputs
  if (label.includes('builtin') || label.includes('built-in') || 
      label.includes('built in')) score -= 20;
  if (label.includes('webcam')) score -= 40;
  if (label.includes('internal')) score -= 15;
  if (label.includes('realtek')) score -= 10; // Common consumer audio
  if (label.includes('bluetooth')) score -= 30; // Bluetooth has compression
  if (label.includes('headset mic')) score -= 35;
  
  // If it explicitly mentions a mic without other redeeming qualities, lower score
  if ((label.includes('mic') || label.includes('microphone')) && score < 20) {
    score -= 15;
  }
  
  // Default/communications devices are typically not ideal
  if (label.includes('default')) score -= 20;
  if (label.includes('communication')) score -= 25;
  
  return score;
}

/**
 * Finds the best audio input device for music/broadcast quality
 * Prioritizes hardware inputs over software/virtual devices
 * using a comprehensive scoring system
 */
export function findBestInputDevice(devices: AudioDevice[]): AudioDevice | undefined {
  if (!devices || devices.length === 0) {
    console.log('No audio devices available to select from');
    return undefined;
  }

  console.log('Finding best input device from', devices.length, 'devices');
  
  // First pass: fast categorization by keywords
  // Build a map of device categories with their member devices
  const devicesByCategory: Record<DeviceCategory, AudioDevice[]> = {
    [DeviceCategory.PROFESSIONAL]: [],
    [DeviceCategory.CAPTURE]: [],
    [DeviceCategory.EXTERNAL]: [],
    [DeviceCategory.STANDARD]: [],
    [DeviceCategory.FALLBACK]: [],
  };
  
  // Categorize devices
  devices.forEach(device => {
    const label = device.label.toLowerCase();
    
    // Professional category: audio interfaces, direct lines, high quality equipment
    if (label.includes('audio interface') || 
        label.includes('line in') || 
        label.includes('scarlett') || 
        label.includes('focusrite') ||
        label.includes('presonus') ||
        label.includes('steinberg') ||
        label.includes('motu') ||
        label.includes('rme') ||
        label.includes('apollo') ||
        label.includes('apogee')) {
      devicesByCategory[DeviceCategory.PROFESSIONAL].push(device);
    }
    // Capture category: system audio capture, mixes, loopbacks
    else if (label.includes('stereo mix') || 
             label.includes('loopback') || 
             label.includes('what u hear') || 
             label.includes('what you hear')) {
      devicesByCategory[DeviceCategory.CAPTURE].push(device);
    }
    // External category: external inputs that might be useful
    else if (label.includes('aux') || 
             label.includes('spdif') || 
             label.includes('rca') ||
             label.includes('xlr') ||
             label.includes('optical')) {
      devicesByCategory[DeviceCategory.EXTERNAL].push(device);
    }
    // Fallback category: last resort, typically low quality
    else if (label.includes('default') || 
             label.includes('communication') ||
             label.includes('webcam') ||
             label.includes('bluetooth')) {
      devicesByCategory[DeviceCategory.FALLBACK].push(device);
    }
    // Standard category: everything else
    else {
      devicesByCategory[DeviceCategory.STANDARD].push(device);
    }
  });
  
  // Score and sort devices within each category
  for (const category in devicesByCategory) {
    devicesByCategory[category as DeviceCategory].sort((a, b) => {
      return scoreAudioInputDevice(b) - scoreAudioInputDevice(a);
    });
  }
  
  // Try to find the best device starting with professional category
  // then moving to less optimal categories
  for (const category of [
    DeviceCategory.PROFESSIONAL,
    DeviceCategory.CAPTURE,
    DeviceCategory.EXTERNAL,
    DeviceCategory.STANDARD,
    DeviceCategory.FALLBACK
  ]) {
    if (devicesByCategory[category].length > 0) {
      const bestDevice = devicesByCategory[category][0];
      const score = scoreAudioInputDevice(bestDevice);
      console.log(`Found best device in category ${category} with score ${score}:`, bestDevice.label);
      return bestDevice;
    }
  }
  
  // Last resort - just use the first available device
  console.log('No categorized devices found, using first available:', devices[0].label);
  return devices[0];
}

/**
 * Scores an output device based on its label to determine how suitable it is
 * for professional audio monitoring. Higher scores = better quality monitoring devices.
 */
function scoreAudioOutputDevice(device: AudioDevice): number {
  if (!device || !device.label) return 0;
  
  const label = device.label.toLowerCase();
  let score = 0;
  
  // Professional monitoring equipment
  if (label.includes('studio monitor')) score += 80;
  if (label.includes('monitor') && !label.includes('computer monitor')) score += 60;
  if (label.includes('speakers') || label.includes('speaker')) score += 50;
  if (label.includes('main out') || label.includes('main output')) score += 70;
  
  // Professional audio interface outputs
  if (label.includes('audio interface')) score += 65;
  if (label.includes('interface output')) score += 65;
  if (label.includes('output 1') || label.includes('output 2')) score += 55;
  if (label.includes('main mix') || label.includes('main')) score += 60;
  
  // Professional brands
  if (label.includes('genelec')) score += 80; // High-end studio monitors
  if (label.includes('yamaha') && label.includes('hs')) score += 75; // Yamaha HS series monitors
  if (label.includes('krk')) score += 70; // KRK monitors
  if (label.includes('focal')) score += 80; // Focal monitors
  if (label.includes('adam')) score += 80; // ADAM monitors
  if (label.includes('jbl')) score += 65; // JBL monitors
  if (label.includes('mackie')) score += 65; // Mackie monitors/interfaces
  if (label.includes('presonus') || label.includes('audiobox')) score += 65;
  if (label.includes('focusrite') || label.includes('scarlett')) score += 70;
  if (label.includes('steinberg') || label.includes('ur')) score += 68;
  if (label.includes('rme')) score += 80;
  if (label.includes('motu')) score += 75;
  if (label.includes('universal audio') || label.includes('apollo')) score += 78;
  
  // Connection types
  if (label.includes('hdmi')) score += 30; // HDMI can carry high quality audio
  if (label.includes('spdif')) score += 40; // Digital connection
  if (label.includes('optical')) score += 40; // Digital optical
  if (label.includes('xlr')) score += 45; // Professional balanced connections
  if (label.includes('balanced')) score += 45;
  
  // Headphones - generally lower priority than monitors but still useful
  if (label.includes('headphones')) score += 40;
  if (label.includes('headset')) score += 30;
  
  // Decrease score for likely low quality outputs
  if (label.includes('builtin') || label.includes('built-in') || 
      label.includes('built in')) score -= 20;
  if (label.includes('laptop')) score -= 30;
  if (label.includes('internal')) score -= 15;
  if (label.includes('bluetooth')) score -= 25; // Bluetooth has latency and compression
  
  // Default/communications devices are typically not ideal
  if (label.includes('default')) score -= 20;
  if (label.includes('communication')) score -= 25;
  
  return score;
}

/**
 * Finds the best audio output device for monitoring
 * Prioritizes studio monitors and professional audio interfaces
 * using a comprehensive scoring system
 */
export function findBestOutputDevice(devices: AudioDevice[]): AudioDevice | undefined {
  if (!devices || devices.length === 0) {
    console.log('No audio output devices available');
    return undefined;
  }
  
  console.log('Finding best output device from', devices.length, 'devices');
  
  // Create output categories
  enum OutputCategory {
    STUDIO_MONITORS = 'STUDIO_MONITORS',
    INTERFACE_OUTPUT = 'INTERFACE_OUTPUT',
    SPEAKERS = 'SPEAKERS',
    HEADPHONES = 'HEADPHONES',
    OTHER = 'OTHER',
    FALLBACK = 'FALLBACK'
  }
  
  // Build a map of output categories with their member devices
  const devicesByCategory: Record<OutputCategory, AudioDevice[]> = {
    [OutputCategory.STUDIO_MONITORS]: [],
    [OutputCategory.INTERFACE_OUTPUT]: [],
    [OutputCategory.SPEAKERS]: [],
    [OutputCategory.HEADPHONES]: [],
    [OutputCategory.OTHER]: [],
    [OutputCategory.FALLBACK]: [],
  };
  
  // Categorize output devices
  devices.forEach(device => {
    const label = device.label.toLowerCase();
    
    // Studio monitors - highest priority for professional monitoring
    if (label.includes('monitor') || 
        label.includes('genelec') || 
        label.includes('yamaha hs') ||
        label.includes('krk') ||
        label.includes('focal') ||
        label.includes('adam')) {
      devicesByCategory[OutputCategory.STUDIO_MONITORS].push(device);
    }
    // Audio interface outputs - next best choice
    else if (label.includes('interface') || 
             label.includes('focusrite') || 
             label.includes('scarlett') ||
             label.includes('presonus') ||
             label.includes('audiobox') ||
             label.includes('motu') ||
             label.includes('rme') ||
             label.includes('output 1') ||
             label.includes('output 2')) {
      devicesByCategory[OutputCategory.INTERFACE_OUTPUT].push(device);
    }
    // Regular speakers - good fallback
    else if (label.includes('speaker') || 
             label.includes('audio out') || 
             label.includes('spdif') ||
             label.includes('hdmi') ||
             label.includes('main out')) {
      devicesByCategory[OutputCategory.SPEAKERS].push(device);
    }
    // Headphones - acceptable for monitoring
    else if (label.includes('headphone') || 
             label.includes('phones') || 
             label.includes('headset')) {
      devicesByCategory[OutputCategory.HEADPHONES].push(device);
    }
    // Low-quality or problematic outputs
    else if (label.includes('default') || 
             label.includes('communications') ||
             label.includes('bluetooth') ||
             label.includes('virtual')) {
      devicesByCategory[OutputCategory.FALLBACK].push(device);
    }
    // Everything else
    else {
      devicesByCategory[OutputCategory.OTHER].push(device);
    }
  });
  
  // Score and sort devices within each category
  for (const category in devicesByCategory) {
    devicesByCategory[category as OutputCategory].sort((a, b) => {
      return scoreAudioOutputDevice(b) - scoreAudioOutputDevice(a);
    });
  }
  
  // Try to find the best device starting with studio monitors
  // then moving to less optimal categories
  for (const category of [
    OutputCategory.STUDIO_MONITORS,
    OutputCategory.INTERFACE_OUTPUT,
    OutputCategory.SPEAKERS,
    OutputCategory.HEADPHONES,
    OutputCategory.OTHER,
    OutputCategory.FALLBACK
  ]) {
    if (devicesByCategory[category].length > 0) {
      const bestDevice = devicesByCategory[category][0];
      const score = scoreAudioOutputDevice(bestDevice);
      console.log(`Found best output device in category ${category} with score ${score}:`, bestDevice.label);
      return bestDevice;
    }
  }
  
  // Last resort - just use the first available device
  console.log('No categorized output devices found, using first available:', devices[0].label);
  return devices[0];
}