/**
 * Format number of seconds into a MM:SS format
 * @param seconds The number of seconds to format
 * @returns Formatted string in MM:SS format
 */
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to a human-readable format (KB, MB, GB)
 * @param bytes File size in bytes
 * @returns Formatted string with appropriate unit
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === undefined || bytes === null) return '0 B';
  
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Format a date to a human-readable format
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a number with commas as thousands separators
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === undefined || num === null) return '0';
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format duration in HH:MM:SS format for longer durations
 * @param seconds The number of seconds to format
 * @returns Formatted string in HH:MM:SS format
 */
export function formatLongDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate the total duration of an array of tracks
 * @param tracks Array of tracks, each with a duration property
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(tracks: { duration: number }[]): number {
  if (!tracks || !tracks.length) return 0;
  
  return tracks.reduce((total, track) => {
    return total + (track.duration || 0);
  }, 0);
}