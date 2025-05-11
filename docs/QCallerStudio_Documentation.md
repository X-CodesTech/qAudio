# QCaller Studio
## Comprehensive Features Documentation

![QCaller Logo](../attached_assets/qcaller_logo_v4.png)

**Version:** 1.0.0  
**Date:** May 8, 2025  
**Author:** QCaller Studio Development Team

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [User Roles](#user-roles)
4. [Studio Environments](#studio-environments)
5. [Technical Architecture](#technical-architecture)
6. [Features](#features)
   - [VoIP Communication System](#voip-communication-system)
   - [Studio Management](#studio-management)
   - [Radio Automation System](#radio-automation-system)
   - [Timer and Countdown System](#timer-and-countdown-system)
   - [Buzzer System](#buzzer-system)
   - [Traffic Management](#traffic-management)
   - [Audio Processing](#audio-processing)
   - [Internet Radio Streaming](#internet-radio-streaming)
   - [Media Library Management](#media-library-management)
   - [Artificial Intelligence Features](#artificial-intelligence-features)
   - [Audio Logger](#audio-logger)
   - [Playout System](#playout-system)
   - [Transmitter Monitoring](#transmitter-monitoring)
7. [User Interface](#user-interface)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Installation and Configuration](#installation-and-configuration)
10. [Security Features](#security-features)
11. [Technical Specifications](#technical-specifications)
12. [Troubleshooting](#troubleshooting)
13. [Glossary](#glossary)

---

## Introduction

QCaller Studio is a comprehensive VoIP (Voice over Internet Protocol) communication platform specifically designed for broadcast environments. It enables seamless audio communication between various roles in a broadcasting studio while integrating with radio automation, playout, and media management systems. The platform supports multiple studio environments with different color themes and is compatible with any SIP provider for maximum flexibility.

This documentation provides a detailed overview of all features and capabilities of the QCaller Studio system, to help users maximize their experience with the platform.

---

## System Overview

QCaller Studio is an integrated solution for broadcast facilities that brings together multiple communication, automation, and management tools under a single interface. The system coordinates studio communications, audio playout, media management, and scheduling in real-time, providing a centralized solution for broadcast operations.

Key aspects of the system include:

- **Real-time communication**: SIP-based VoIP system for studio communication
- **Role-based interfaces**: Different views for producers, talent, admins, and technical staff
- **Multi-studio support**: Support for Studio A, Studio B, RE Studio, and Tech environments with distinct color schemes
- **Radio automation**: Comprehensive playlist management and scheduling
- **Traffic management**: Client, campaign, and advertisement management with invoicing
- **AI-powered features**: Track analysis, playlist generation, and audio processing

---

## User Roles

QCaller Studio supports the following user roles, each with a customized interface:

### Admin
- Full system access
- User management
- System configuration
- Access to all features and settings
- Complete monitoring and reporting

### Producer
- Studio management
- Timer and countdown control
- Call line management
- Show rundown control
- Communication with talent

### Talent
- On-air interface
- Timer and countdown visibility
- Communication with producers
- Audio control
- Buzzer functionality

### Remote
- Remote participation
- Limited communication access
- Timer visibility
- Basic controls

### Tech
- Technical monitoring
- System diagnostics
- Audio processing controls
- Transmitter monitoring
- Configuration settings

Each role has access to specific features and functions tailored to their responsibilities within the broadcast environment.

---

## Studio Environments

QCaller Studio supports multiple studio environments, each with a dedicated color theme for easy visual identification:

### Studio A (Orange: #F28C28/D28D2D)
Primary studio environment with all features enabled. The orange color scheme provides a warm, energetic feel appropriate for main studio operations.

### Studio B (Green)
Secondary studio environment with equivalent functionality to Studio A. The green color scheme provides visual differentiation for simultaneous operations.

### RE Studio (Red)
Remote engagement studio for external connections and remote talent. The red color scheme signifies the external nature of this environment.

### Tech (Purple)
Technical operations environment for system monitoring and configuration. The purple color scheme denotes the technical nature of this workspace.

All color schemes are implemented consistently across component borders, buttons, and interface elements to maintain clear visual separation between studio environments.

---

## Technical Architecture

QCaller Studio is built on a modern web application stack with:

### Frontend
- **React with TypeScript**: For type-safe component development
- **Tailwind CSS**: For responsive styling and theming
- **WebSocket**: For real-time communication
- **SIP.js**: For VoIP implementation
- **Shadow DOM components**: For encapsulated UI elements

### Backend
- **Express.js**: API server for all backend operations
- **Socket.IO**: For real-time messaging
- **Drizzle ORM**: For database operations
- **PostgreSQL**: For persistent data storage
- **Authentication middleware**: For secure access

### Integration Points
- **SIP providers**: For VoIP communication
- **Audio processing**: For sound enhancement and normalization
- **Media encoding/decoding**: For supporting multiple audio formats
- **Streaming servers**: For internet radio broadcasting

The architecture follows a microservices approach with dedicated components for each major system feature, allowing for scalability and maintainability.

---

## Features

### VoIP Communication System

The core of QCaller Studio is its VoIP communication system, providing reliable audio communication between all users in the broadcast environment.

#### Key Features:
- **SIP Protocol Support**: Compatible with any SIP provider
- **Call Line Management**: Handle multiple incoming and outgoing calls
- **Audio Quality Control**: Audio processing and enhancement for optimal sound
- **Call Recording**: Record and store conversations for later use
- **Visual Call Status**: Clear visual indicators for call status
- **Multi-participant Calls**: Support for conference calls with multiple participants
- **Secure Communication**: Encrypted audio transmission

#### Call Management Interface
Producers can manage call lines with:
- Call status monitoring
- Caller information display
- Call duration tracking
- One-click call control (answer, hold, hang up)
- Caller priority settings
- Prescreen notes
- History tracking

---

### Studio Management

QCaller Studio provides comprehensive tools for managing studio operations across multiple environments.

#### Key Features:
- **Multi-studio Support**: Independent management of Studio A, B, RE Studio, and Tech
- **Color-coded Interfaces**: Visual differentiation between studio environments
- **Resource Allocation**: Assign resources (microphones, lines, etc.) to specific studios
- **Studio Status Monitoring**: Real-time status display of all studio environments
- **Quick Switching**: Seamless transition between studio environments
- **Studio Configuration**: Customizable settings for each studio
- **Studio Isolation**: Prevent cross-talk between studio environments when needed

Each studio maintains its own state, allowing for parallel operations across multiple broadcast environments.

---

### Radio Automation System

The integrated radio automation system handles all aspects of audio playout and scheduling.

#### Key Features:
- **Playlist Management**: Create, edit, and manage multiple playlists
- **Track Organization**: Categorize and tag audio tracks
- **Scheduling**: Schedule playlists for automatic playback
- **Auto-sequencing**: Intelligently sequence tracks based on rules
- **Real-time Control**: Manual override and control during broadcast
- **Jingle Management**: Organize and schedule station jingles and IDs
- **Crossfading**: Smooth transitions between tracks
- **Event Triggering**: Schedule actions based on time or events

#### Playout Features
- **Multi-format Support**: Play WAV, MP3, AAC, FLAC, and other formats
- **Audio Visualization**: Waveform display and audio level monitoring
- **Cue Points**: Set and manage intro/outro points
- **Track Metadata**: Display and edit track information
- **Search System**: Quickly find tracks in the library
- **Hotkeys**: Keyboard shortcuts for common actions
- **Emergency Content**: Quick access to emergency announcements

---

### Timer and Countdown System

The timer system synchronizes timing between producers and talent, ensuring smooth show pacing.

#### Key Features:
- **Multiple Timers**: Independent timers for Studio A and Studio B
- **Role-specific Views**: Different displays for producers and talent
- **Danger Zone Alerts**: Visual warnings when time is running low
- **Remote Synchronization**: All timers stay synchronized across devices
- **Preset Durations**: Quickly set common time intervals
- **Manual Adjustment**: Fine-tune timing during broadcast
- **Pause/Resume**: Control timer flow during unexpected events
- **Timer Events**: Trigger actions when timers reach specific points

The system uses WebSocket technology to ensure real-time updates across all connected clients, maintaining perfect synchronization between producer and talent views.

---

### Buzzer System

The buzzer system provides immediate attention-grabbing alerts between studio personnel.

#### Key Features:
- **Visual Alerts**: Flashing/blinking visual indicators
- **Audio Alerts**: Optional sound notifications
- **Studio-specific Buzzers**: Independent buzzers for each studio
- **Role-based Controls**: Controls based on user role
- **Acknowledgment System**: Confirm receipt of buzzer alerts
- **History Tracking**: Record of buzzer activations
- **Priority Levels**: Different urgency levels for alerts
- **Customizable Duration**: Set how long buzzer alerts remain active

The buzzer feature is essential for non-verbal communication during live broadcasts, allowing producers to signal talent without interrupting audio feeds.

---

### Traffic Management

The traffic management system handles commercial content scheduling and client management.

#### Key Features:
- **Client Management**: Create and manage client records
- **Campaign Creation**: Set up advertising campaigns with goals and budgets
- **Spot Scheduling**: Schedule commercial spots throughout the broadcast day
- **Invoicing**: Generate detailed invoices for clients
- **Performance Tracking**: Monitor campaign performance and spot plays
- **Budget Management**: Track spending against campaign budgets
- **Discount Management**: Apply and track discounts
- **VAT Calculation**: Automatic tax calculations
- **Report Generation**: Detailed reports on campaign performance

#### Client Management Features
- **Client Database**: Store client information and history
- **Contact Management**: Track multiple contacts per client
- **Activity History**: Record of all client interactions
- **Document Storage**: Store contracts and other documents
- **Financial Tracking**: Monitor client payment history

---

### Audio Processing

Advanced audio processing capabilities enhance sound quality throughout the system.

#### Key Features:
- **Equalization**: Multi-band EQ for sound shaping
- **Compression**: Dynamic range control
- **Limiting**: Prevent audio clipping
- **Noise Reduction**: Clean up audio signals
- **Audio Normalization**: Consistent volume levels
- **Presets**: Quickly apply common processing settings
- **Real-time Processing**: Hear changes as they're made
- **Format Conversion**: Convert between different audio formats
- **Quality Monitoring**: Visual feedback on audio quality

The audio processing system supports both real-time processing for live broadcasts and batch processing for media library content.

---

### Internet Radio Streaming

The streaming module enables broadcasting over the internet with multiple format support.

#### Key Features:
- **Multiple Stream Formats**: Support for various streaming protocols
- **Bitrate Management**: Configure stream quality
- **Server Integration**: Connect to popular streaming servers
- **Listener Statistics**: Monitor audience size and behavior
- **Stream Recording**: Archive streams for later use
- **Metadata Injection**: Send now-playing information to listeners
- **Multi-stream Support**: Broadcast multiple streams simultaneously
- **Stream Health Monitoring**: Ensure stable broadcasting

#### Stream Configuration
- **Format Selection**: Choose stream encoding format
- **Quality Settings**: Configure bitrate and quality
- **Server Settings**: Configure streaming server connection
- **Metadata Settings**: Configure track information display
- **Public Page**: Optional public-facing stream page

---

### Media Library Management

The media library system organizes and manages all audio content.

#### Key Features:
- **Track Organization**: Categorize and tag audio content
- **Metadata Management**: Edit and organize track information
- **Search System**: Find content quickly with advanced search
- **Batch Operations**: Process multiple files simultaneously
- **Format Support**: Handle multiple audio formats
- **Waveform Generation**: Visual representation of audio
- **Usage Tracking**: Monitor when and how often tracks are used
- **Content Rating**: Rate and tag tracks for appropriate use

#### Upload Features
- **Bulk Upload**: Add multiple files at once
- **Format Detection**: Automatically identify file formats
- **Auto-tagging**: Extract metadata from files
- **In/Out Point Detection**: Automatically find optimal cue points
- **Level Analysis**: Check and adjust audio levels
- **FLAC Conversion**: Convert uploads to high-quality format
- **AI Analysis**: Use AI to analyze track characteristics

---

### Artificial Intelligence Features

AI capabilities enhance various aspects of the system.

#### Key Features:
- **Track Analysis**: Automatic analysis of audio characteristics
- **Playlist Generation**: AI-powered playlist creation
- **Content Recommendations**: Suggested tracks based on context
- **Audio Enhancement**: AI-assisted audio processing
- **Metadata Generation**: Automatically generate track metadata
- **Content Classification**: Categorize content by style and mood
- **Audience Analytics**: Analyze listener preferences and trends
- **Voice Recognition**: Identify speakers in recorded content

The AI system learns from usage patterns to continually improve its recommendations and analyses.

---

### Audio Logger

The audio logger records and archives broadcast content.

#### Key Features:
- **Multi-input Recording**: Record from multiple audio sources
- **24/7 Operation**: Continuous recording capability
- **Storage Management**: Organize recordings by date and time
- **Input Level Monitoring**: Visual representation of input levels
- **Format Options**: Configure recording quality and format
- **Playback Tools**: Listen to archived recordings
- **Export Options**: Extract segments for external use
- **Annotation**: Add notes to recorded segments
- **Legal Compliance**: Meet broadcast archiving requirements

#### Archive Access Features
- **Calendar Navigation**: Find recordings by date
- **Search Tools**: Search archives by metadata
- **Segment Editing**: Mark in/out points for segments
- **Export as MP3**: Create portable versions of clips
- **Batch Processing**: Work with multiple recordings

---

### Playout System

The playout system handles the actual broadcasting of audio content.

#### Key Features:
- **Live Playout**: Real-time audio playback
- **Playlist Automation**: Automatic playback of scheduled content
- **Manual Override**: Take control during live broadcasts
- **Instant Players**: Quick access to commonly used audio
- **Crossfading**: Smooth transitions between tracks
- **Next-up Display**: Preview upcoming content
- **Play History**: Record of previously played content
- **Emergency Interrupt**: Override normal playout for urgent content

The playout system integrates with the radio automation system for seamless operation while maintaining the flexibility needed for live broadcasting.

---

### Transmitter Monitoring

Monitor and control broadcast transmitters remotely.

#### Key Features:
- **Status Monitoring**: Real-time status of transmitters
- **Alarm System**: Visual alerts for transmitter issues
- **Performance Metrics**: Track transmitter performance
- **Remote Control**: Adjust transmitter settings remotely
- **History Logging**: Record of transmitter performance
- **Fault Detection**: Early warning of potential issues
- **Maintenance Scheduling**: Plan maintenance based on performance

The transmitter monitoring system provides peace of mind for technical staff with clear visual indicators and proactive alerting.

---

## User Interface

QCaller Studio features a modern, responsive user interface designed for broadcast professionals:

### General UI Principles
- **Role-optimized Views**: Interfaces tailored to user roles
- **Studio-specific Themes**: Color coding by studio environment
- **Responsive Design**: Adapts to different screen sizes
- **Dark Mode**: Reduced eye strain in studio environments
- **Consistent Controls**: Familiar patterns across all interfaces
- **Accessibility**: Support for assistive technologies
- **Performance Optimization**: Fast loading and response times

### Admin Interface
- **Dashboard**: System overview with key metrics
- **Navigation Tabs**: Consistent screen dimensions across sections
- **Compact Design**: Maximum information density
- **Configuration Panels**: Organized settings access
- **User Management**: Control user access and permissions

### Producer Interface
- **Focus on Production**: Only production-relevant content
- **Timer Controls**: Prominent countdown management
- **Call Line Management**: Clear call status displays
- **Communication Tools**: Direct access to talent communication
- **Show Rundown**: Track show elements and timing

### Talent Interface
- **Distraction-free Design**: Only essential elements
- **Timer Display**: Clear countdown visualization
- **Communication Status**: See who is connected
- **Simple Controls**: One-click access to common functions
- **Audio Monitoring**: Visual feedback on audio status

---

## Internationalization (i18n)

QCaller Studio supports full internationalization across all interfaces:

### Language Support
- Complete translation of all text and labels
- Support for right-to-left languages
- Language selection in user preferences
- Regional format support (dates, times, numbers)

### Implementation
- React-i18next framework
- Language resource files for all supported languages
- Dynamic language switching without page reload
- Fallback mechanisms for missing translations

---

## Installation and Configuration

### System Requirements
- **Server**: Modern server with multi-core CPU
- **Memory**: Minimum 8GB RAM
- **Storage**: SSD storage for optimal performance
- **Network**: Reliable network connection
- **Database**: PostgreSQL database
- **OS**: Linux-based operating system

### Installation Process
1. System preparation and dependency installation
2. Database setup and initialization
3. Application deployment
4. Configuration file setup
5. Initial user creation
6. SIP provider configuration
7. System testing

### Configuration Options
- **General Settings**: Application name, organization details
- **Audio Settings**: Default formats, quality settings
- **Network Settings**: Connection parameters, timeouts
- **Security Settings**: Authentication options, session management
- **Backup Settings**: Automated backup configuration
- **Logging Settings**: Log level and retention policies

---

## Security Features

QCaller Studio implements comprehensive security measures:

### Authentication & Authorization
- **Role-based Access Control**: Granular permissions by role
- **Secure Password Storage**: Cryptographic password protection
- **Session Management**: Secure session handling
- **Failed Login Protection**: Prevent brute force attacks
- **Account Recovery**: Secure account recovery process

### Data Protection
- **Encrypted Communication**: Secure data transmission
- **Database Security**: Protected database connections
- **Input Validation**: Prevent injection attacks
- **Output Sanitization**: Prevent XSS vulnerabilities
- **File Upload Security**: Safe handling of uploaded files

### Audit & Compliance
- **Activity Logging**: Track user actions
- **System Monitoring**: Detect unusual behavior
- **Regular Updates**: Security patches and improvements
- **Compliance Features**: Support for regulatory requirements
- **Backup & Recovery**: Data protection and disaster recovery

---

## Technical Specifications

### Frontend Technology
- **Framework**: React with TypeScript
- **State Management**: React Context API
- **Real-time Updates**: WebSocket and Socket.IO
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API
- **VoIP Implementation**: SIP.js

### Backend Technology
- **Server**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js
- **WebSockets**: Socket.IO and native WebSockets
- **API Structure**: RESTful architecture
- **Media Processing**: FFmpeg integration

### Performance Metrics
- **Response Time**: <100ms for standard operations
- **Concurrent Users**: Support for 100+ simultaneous users
- **Media Library**: Support for 100,000+ tracks
- **Audio Quality**: Up to 320kbps MP3, 24-bit FLAC
- **Call Quality**: HD Voice support (where available)
- **Streaming Quality**: Up to 320kbps AAC

---

## Troubleshooting

### Common Issues and Solutions

#### Connection Problems
- **Symptom**: Unable to connect to the system
- **Solution**: Check network connection, verify server status, clear browser cache

#### Audio Issues
- **Symptom**: No audio or poor audio quality
- **Solution**: Check microphone settings, verify audio device connections, adjust audio processing settings

#### Timer Synchronization
- **Symptom**: Timers not synchronized between users
- **Solution**: Check network latency, refresh browser, verify WebSocket connection

#### Database Errors
- **Symptom**: Unable to save or retrieve data
- **Solution**: Verify database connection, check disk space, restart database service if necessary

#### Performance Issues
- **Symptom**: Slow system response
- **Solution**: Clear browser cache, check server load, optimize database queries

---

## Glossary

**VoIP**: Voice over Internet Protocol, technology for voice communication over the internet

**SIP**: Session Initiation Protocol, signaling protocol for controlling multimedia communication sessions

**Playout**: The actual broadcasting of audio content

**Traffic**: Management of commercial content and advertising

**Automation**: System for automatic sequencing and playback of content

**Buzzer**: Alert system for communication between studio roles

**Logger**: System for recording and archiving broadcast content

**Transmitter**: Equipment that broadcasts radio signals to listeners

**i18n**: Internationalization, the process of designing software for multiple languages

**WebSocket**: Technology for real-time, bidirectional communication between clients and servers