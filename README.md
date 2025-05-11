# Mazen Studio Broadcast System

A professional web-based VoIP phone management system for radio station broadcast environments, with robust network and communication interface configurations.

## Features

- Role-based access: Admin, Producer, and Talent views
- Audio routing configuration with real-time level meters
- SIP protocol integration for telephony
- Real-time device connection status monitoring
- Animated connection pulse indicators
- Advanced network interface management
- User management and system monitoring

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSockets (ws)
- **Styling**: Tailwind CSS with custom theme

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/mazen-studio.git
cd mazen-studio
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following:
```
DATABASE_URL=postgresql://username:password@localhost:5432/mazenstudio
```

4. Run database migrations
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared TypeScript types and utilities
- `/drizzle` - Database schema and migrations

## Main Features

### VoIP Interface

The system provides a comprehensive interface for managing VoIP calls in a broadcast environment, including:
- Multi-line call management
- Audio routing configuration
- Audio level monitoring
- Call status visualization

### Device Connection Monitoring

Real-time visualization of connected devices with animated status indicators:
- Input/output audio devices
- Network connections
- SIP server status
- Storage server status

### User Roles

- **Admin**: Access to all settings and configurations
- **Producer**: Call management, audio routing, talent communication
- **Talent**: Simplified interface focused on active calls and producer communication

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mazen Studio for the design and requirements
- ShadCN UI for component library
- TailwindCSS for styling