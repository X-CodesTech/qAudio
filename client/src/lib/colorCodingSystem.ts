import React from 'react';
import { 
  Music, 
  Radio, 
  Mic, 
  Speaker, 
  Megaphone, 
  Headphones, // Replaced Broadcast with Headphones
  MessageSquare, 
  Info, 
  Cloud, 
  DollarSign, 
  Receipt,
  Folder,
  FileMusic,
  FileText,
  CirclePlay,
  Disc
} from 'lucide-react';

// Track categories
export const TRACK_CATEGORIES = [
  // Program Content
  { value: 'music', label: 'Music', group: 'Program Content', color: '#3b82f6' }, // blue-500
  { value: 'talk', label: 'Talk', group: 'Program Content', color: '#8b5cf6' }, // violet-500
  { value: 'podcast', label: 'Podcast', group: 'Program Content', color: '#6366f1' }, // indigo-500
  
  // Station Elements
  { value: 'jingle', label: 'Jingle', group: 'Station Elements', color: '#f59e0b' }, // amber-500
  { value: 'sweeper', label: 'Sweeper', group: 'Station Elements', color: '#f97316' }, // orange-500
  { value: 'station-id', label: 'Station ID', group: 'Station Elements', color: '#ef4444' }, // red-500
  
  // Informational
  { value: 'news', label: 'News', group: 'Informational', color: '#06b6d4' }, // cyan-500
  { value: 'weather', label: 'Weather', group: 'Informational', color: '#0ea5e9' }, // sky-500
  { value: 'traffic', label: 'Traffic', group: 'Informational', color: '#14b8a6' }, // teal-500
  
  // Advertisements
  { value: 'commercial', label: 'Commercial', group: 'Advertisements', color: '#ec4899' }, // pink-500
  { value: 'promo', label: 'Promo', group: 'Advertisements', color: '#d946ef' }, // fuchsia-500
  { value: 'sponsor', label: 'Sponsorship', group: 'Advertisements', color: '#c026d3' }, // purple-500
];

// Folder categories
export const FOLDER_CATEGORIES = [
  { value: 'music', label: 'Music', color: '#3b82f6' }, // blue-500
  { value: 'jingles', label: 'Jingles', color: '#f59e0b' }, // amber-500
  { value: 'commercials', label: 'Commercials', color: '#ec4899' }, // pink-500
  { value: 'promos', label: 'Promos', color: '#d946ef' }, // fuchsia-500
  { value: 'news', label: 'News', color: '#06b6d4' }, // cyan-500
  { value: 'talk', label: 'Talk Shows', color: '#8b5cf6' }, // violet-500
  { value: 'sweepers', label: 'Sweepers', color: '#f97316' }, // orange-500
  { value: 'ids', label: 'IDs', color: '#ef4444' }, // red-500
  { value: 'podcasts', label: 'Podcasts', color: '#6366f1' }, // indigo-500
  { value: 'misc', label: 'Miscellaneous', color: '#71717a' }, // zinc-500
];

// Get category color by category value
export function getCategoryColor(category: string | null): string {
  if (!category) return '#71717a'; // zinc-500 as default
  
  const foundCategory = TRACK_CATEGORIES.find(cat => cat.value === category);
  return foundCategory ? foundCategory.color : '#71717a'; // zinc-500 as default
}

// Get folder category color
export function getFolderColor(category: string | null): string {
  if (!category) return '#71717a'; // zinc-500 as default
  
  const foundCategory = FOLDER_CATEGORIES.find(cat => cat.value === category);
  return foundCategory ? foundCategory.color : '#71717a'; // zinc-500 as default
}

// Get category icon by category value
export function getCategoryIcon(category: string | null): React.ReactNode {
  const color = getCategoryColor(category);
  const iconProps = { 
    style: { color },
    className: "h-4 w-4" 
  };
  
  switch (category) {
    case 'music':
      return React.createElement(Music, iconProps);
    case 'talk':
      return React.createElement(Mic, iconProps);
    case 'podcast':
      return React.createElement(Headphones, iconProps);
    case 'jingle':
      return React.createElement(Radio, iconProps);
    case 'sweeper':
      return React.createElement(Speaker, iconProps);
    case 'station-id':
      return React.createElement(CirclePlay, iconProps);
    case 'news':
      return React.createElement(MessageSquare, iconProps);
    case 'weather':
      return React.createElement(Cloud, iconProps);
    case 'traffic':
      return React.createElement(Info, iconProps);
    case 'commercial':
      return React.createElement(DollarSign, iconProps);
    case 'promo':
      return React.createElement(Megaphone, iconProps);
    case 'sponsor':
      return React.createElement(Receipt, iconProps);
    default:
      return React.createElement(FileMusic, iconProps);
  }
}

// Get folder icon by category value
export function getFolderIcon(category: string | null): React.ReactNode {
  const color = getFolderColor(category);
  const iconProps = { 
    style: { color },
    className: "h-4 w-4" 
  };
  
  switch (category) {
    case 'music':
      return React.createElement(Music, iconProps);
    case 'jingles':
      return React.createElement(Radio, iconProps);
    case 'commercials':
      return React.createElement(DollarSign, iconProps);
    case 'promos':
      return React.createElement(Megaphone, iconProps);
    case 'news':
      return React.createElement(MessageSquare, iconProps);
    case 'talk':
      return React.createElement(Mic, iconProps);
    case 'sweepers':
      return React.createElement(Speaker, iconProps);
    case 'ids':
      return React.createElement(CirclePlay, iconProps);
    case 'podcasts':
      return React.createElement(Headphones, iconProps);
    case 'misc':
      return React.createElement(Folder, iconProps);
    default:
      return React.createElement(Folder, iconProps);
  }
}

// Detect category based on track properties
export function detectCategory(track: any): string {
  // Default category
  let category = 'music';
  
  // Extract properties (handle nulls gracefully)
  const title = (track.title || '').toLowerCase();
  const artist = (track.artist || '').toLowerCase();
  const duration = track.duration || 0;
  
  // Check duration first (most reliable indicator)
  if (duration < 15) {
    // Very short tracks are likely station elements
    if (title.includes('id') || title.includes('ident')) {
      return 'station-id';
    }
    return 'sweeper';
  } else if (duration < 30) {
    // Short tracks could be jingles or short commercials
    if (title.includes('jingle') || title.includes('sting')) {
      return 'jingle';
    } else if (title.includes('promo') || title.includes('advert') || title.includes('commercial')) {
      return 'commercial';
    }
    return 'jingle';
  } else if (duration < 60) {
    // Medium-short tracks are often commercials or promos
    if (title.includes('commercial') || title.includes('advert') || title.includes('sponsor')) {
      return 'commercial';
    } else if (title.includes('promo') || title.includes('trailer')) {
      return 'promo';
    }
    return 'commercial';
  }
  
  // Check title keywords
  if (title.includes('news')) {
    return 'news';
  } else if (title.includes('weather')) {
    return 'weather';
  } else if (title.includes('traffic')) {
    return 'traffic';
  } else if (title.includes('jingle')) {
    return 'jingle';
  } else if (title.includes('sweeper')) {
    return 'sweeper';
  } else if (title.includes('commercial') || title.includes('advert')) {
    return 'commercial';
  } else if (title.includes('promo')) {
    return 'promo';
  } else if (title.includes('podcast') || title.includes('episode')) {
    return 'podcast';
  } else if (title.includes('talk') || title.includes('interview')) {
    return 'talk';
  }
  
  // Default to music for longer tracks
  return 'music';
}