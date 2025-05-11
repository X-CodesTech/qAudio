/**
 * Mazen Studio Database Seed
 * 
 * This script populates the database with initial data for testing and development.
 * Run with: npm run db:seed
 */

import { db } from './db';
import { 
  users, 
  audioDevices, 
  contacts, 
  sipConfig,
  networkInterfaces,
  mediaFolders,
  audioTracks,
  playlists,
  playlistItems,
  UserRole 
} from '../shared/schema';
import { eq, and, like, or } from 'drizzle-orm';
import * as path from 'path';
import * as fs from 'fs';
import { hashPassword } from './auth';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create default users
    console.log('Creating users...');
    await db.insert(users).values([
      {
        username: 'admin',
        password: await hashPassword('admin123'),
        displayName: 'Administrator',
        role: 'admin' as UserRole,
      },
      {
        username: 'producer',
        password: await hashPassword('producer123'),
        displayName: 'Studio Producer',
        role: 'producer' as UserRole,
      },
      {
        username: 'talent',
        password: await hashPassword('talent123'),
        displayName: 'On-Air Talent',
        role: 'talent' as UserRole,
      },
      {
        username: 'playout',
        password: await hashPassword('123456'),
        displayName: 'Radio Playout',
        role: 'playout' as UserRole,
      }
    ]).onConflictDoNothing();

    // Create audio devices
    console.log('Creating audio devices...');
    
    const devices = [
      {
        name: 'Main Studio Mic',
        type: 'input',
        channelCount: 1,
        isDefault: true,
        status: 'connected'
      },
      {
        name: 'Headphones',
        type: 'output',
        channelCount: 2,
        isDefault: true,
        status: 'connected'
      },
      {
        name: 'Control Room Monitors',
        type: 'output',
        channelCount: 2,
        isDefault: false,
        status: 'connected'
      },
      {
        name: 'Guest Mic 1',
        type: 'input',
        channelCount: 1,
        isDefault: false,
        status: 'disconnected'
      },
      {
        name: 'Guest Mic 2',
        type: 'input',
        channelCount: 1,
        isDefault: false,
        status: 'disconnected'
      }
    ];
    
    for (const device of devices) {
      await db.insert(audioDevices).values(device).onConflictDoNothing();
    }

    // Create contacts
    console.log('Creating contacts...');
    
    const contactsList = [
      {
        name: 'John Smith',
        phone: '+1234567890',  // changed from phoneNumber to phone to match schema
        organization: 'WXYZ Radio',
        notes: 'Regular caller, political commentator',
        isFrequentCaller: true  // changed from isFavorite to isFrequentCaller to match schema
      },
      {
        name: 'Jane Doe',
        phone: '+1987654321',
        organization: 'Local News',
        notes: 'Reporter, available for breaking news',
        isFrequentCaller: true
      },
      {
        name: 'Mike Johnson',
        phone: '+1122334455',
        organization: 'Sports Update',
        notes: 'Sports analyst, call for game commentary',
        isFrequentCaller: false
      },
      {
        name: 'Sarah Williams',
        phone: '+1555666777',
        organization: 'Community Outreach',
        notes: 'Community organizer, good for local events',
        isFrequentCaller: false
      }
    ];
    
    for (const contact of contactsList) {
      await db.insert(contacts).values(contact).onConflictDoNothing();
    }

    // Create SIP configuration
    console.log('Creating SIP configuration...');
    
    const sipConfigs = [
      {
        username: 'mazen_studio',
        password: 'sip_password',
        sipServer: 'sip.broadcast.com',
        lineNumber: '1000',
        isRegistered: true,
        lastRegistration: new Date()
      }
    ];
    
    for (const config of sipConfigs) {
      await db.insert(sipConfig).values(config).onConflictDoNothing();
    }

    // Create network interfaces
    console.log('Creating network interfaces...');
    
    const interfaces = [
      {
        name: 'Primary Ethernet',
        type: 'ethernet',
        address: '192.168.1.100',  // changed from ipAddress to address
        macAddress: '00:11:22:33:44:55',
        isDefault: true,
        status: 'up'
      },
      {
        name: 'Backup Ethernet',
        type: 'ethernet',
        address: '192.168.1.101',
        macAddress: '00:11:22:33:44:56',
        isDefault: false,
        status: 'up'
      },
      {
        name: 'Wireless',
        type: 'wireless',
        address: '192.168.1.102',
        macAddress: '00:11:22:33:44:57',
        isDefault: false,
        status: 'down'
      }
    ];
    
    for (const netInterface of interfaces) {
      await db.insert(networkInterfaces).values(netInterface).onConflictDoNothing();
    }

    // Create media folders for radio automation
    console.log('Creating media folders...');
    
    const folders = [
      {
        name: 'Music',
        path: 'uploads/music',
        description: 'All music tracks',
      },
      {
        name: 'Jingles',
        path: 'uploads/jingles',
        description: 'Station jingles and sound effects',
      },
      {
        name: 'Commercials',
        path: 'uploads/commercials',
        description: 'Advertisements and sponsor spots',
      },
      {
        name: 'News',
        path: 'uploads/news',
        description: 'News segments and bulletins',
      },
      {
        name: 'Interviews',
        path: 'uploads/interviews',
        description: 'Recorded interviews and talk segments',
      }
    ];
    
    // Insert folders and keep track of their IDs
    const folderIds = {};
    
    for (const folder of folders) {
      const [insertedFolder] = await db.insert(mediaFolders)
        .values(folder)
        .returning()
        .onConflictDoNothing();
      
      if (insertedFolder) {
        folderIds[folder.name] = insertedFolder.id;
      } else {
        // If the folder already exists, get its ID
        const existingFolder = await db.query.mediaFolders.findFirst({
          where: eq(mediaFolders.name, folder.name)
        });
        if (existingFolder) {
          folderIds[folder.name] = existingFolder.id;
        }
      }
    }
    
    // Create audio tracks for each folder
    console.log('Creating audio tracks...');
    
    const musicTracks = [
      {
        title: 'City Lights',
        artist: 'Electronic Dreams',
        album: 'Urban Nights',
        duration: 240, // 4:00
        path: 'uploads/music/city_lights.mp3',
        fileType: 'mp3',
        fileSize: 5000000,
        category: 'music',
        folderId: folderIds['Music'],
      },
      {
        title: 'Summer Vibes',
        artist: 'Beach Boys',
        album: 'Sunshine Collection',
        duration: 180, // 3:00
        path: 'uploads/music/summer_vibes.mp3',
        fileType: 'mp3',
        fileSize: 4000000,
        category: 'music',
        folderId: folderIds['Music'],
      },
      {
        title: 'Midnight Jazz',
        artist: 'Smooth Quartet',
        album: 'Late Night Sessions',
        duration: 300, // 5:00
        path: 'uploads/music/midnight_jazz.mp3',
        fileType: 'mp3',
        fileSize: 6000000,
        category: 'music',
        folderId: folderIds['Music'],
      }
    ];
    
    const jingleTracks = [
      {
        title: 'Station ID 1',
        artist: 'Studio Production',
        duration: 10,
        path: 'uploads/jingles/station_id_1.mp3',
        fileType: 'mp3',
        fileSize: 500000,
        category: 'jingle',
        folderId: folderIds['Jingles'],
      },
      {
        title: 'News Intro',
        artist: 'Studio Production',
        duration: 5,
        path: 'uploads/jingles/news_intro.mp3',
        fileType: 'mp3',
        fileSize: 300000,
        category: 'jingle',
        folderId: folderIds['Jingles'],
      }
    ];
    
    const commercialTracks = [
      {
        title: 'Local Restaurant Ad',
        artist: 'Marketing Dept',
        duration: 30,
        path: 'uploads/commercials/restaurant_ad.mp3',
        fileType: 'mp3',
        fileSize: 1000000,
        category: 'commercial',
        folderId: folderIds['Commercials'],
      },
      {
        title: 'Car Dealership Spot',
        artist: 'Marketing Dept',
        duration: 45,
        path: 'uploads/commercials/car_dealership.mp3',
        fileType: 'mp3',
        fileSize: 1500000,
        category: 'commercial',
        folderId: folderIds['Commercials'],
      }
    ];
    
    // Combine all tracks and insert them
    const allTracks = [...musicTracks, ...jingleTracks, ...commercialTracks];
    const trackIds = {};
    
    for (const track of allTracks) {
      const [insertedTrack] = await db.insert(audioTracks)
        .values(track)
        .returning()
        .onConflictDoNothing();
      
      if (insertedTrack) {
        trackIds[track.title] = insertedTrack.id;
      } else {
        // If the track already exists, get its ID
        const existingTrack = await db.query.audioTracks.findFirst({
          where: eq(audioTracks.title, track.title)
        });
        if (existingTrack) {
          trackIds[track.title] = existingTrack.id;
        }
      }
    }
    
    // Create playlists
    console.log('Creating playlists...');
    
    const playlistsData = [
      {
        name: 'Daytime Music Mix',
        description: 'Popular hits for daytime rotation',
        type: 'music',
        isActive: true,
        studio: 'A',
      },
      {
        name: 'Evening Chill',
        description: 'Relaxing tracks for evening hours',
        type: 'music',
        isActive: false,
        studio: 'A',
      },
      {
        name: 'Commercial Break 1',
        description: 'Standard commercial break rotation',
        type: 'commercial',
        isActive: true,
        studio: 'B',
      }
    ];
    
    const playlistIds = {};
    
    for (const playlist of playlistsData) {
      const [insertedPlaylist] = await db.insert(playlists)
        .values(playlist)
        .returning()
        .onConflictDoNothing();
      
      if (insertedPlaylist) {
        playlistIds[playlist.name] = insertedPlaylist.id;
      } else {
        // If the playlist already exists, get its ID
        const existingPlaylist = await db.query.playlists.findFirst({
          where: eq(playlists.name, playlist.name)
        });
        if (existingPlaylist) {
          playlistIds[playlist.name] = existingPlaylist.id;
        }
      }
    }
    
    // Add tracks to playlists
    console.log('Adding tracks to playlists...');
    
    // Add music tracks to Daytime Music Mix
    if (playlistIds['Daytime Music Mix'] && trackIds['City Lights'] && trackIds['Summer Vibes']) {
      await db.insert(playlistItems)
        .values([
          {
            playlistId: playlistIds['Daytime Music Mix'],
            trackId: trackIds['City Lights'],
            position: 1,
          },
          {
            playlistId: playlistIds['Daytime Music Mix'],
            trackId: trackIds['Summer Vibes'],
            position: 2,
          }
        ])
        .onConflictDoNothing();
    }
    
    // Add commercial tracks to Commercial Break 1
    if (playlistIds['Commercial Break 1'] && trackIds['Local Restaurant Ad'] && trackIds['Car Dealership Spot']) {
      await db.insert(playlistItems)
        .values([
          {
            playlistId: playlistIds['Commercial Break 1'],
            trackId: trackIds['Local Restaurant Ad'],
            position: 1,
          },
          {
            playlistId: playlistIds['Commercial Break 1'],
            trackId: trackIds['Car Dealership Spot'],
            position: 2,
          }
        ])
        .onConflictDoNothing();
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seed();