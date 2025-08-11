# Discord Bot Project

## Overview

A Discord bot built with Discord.js v14 that provides a comprehensive Czech-language economy system similar to "bot pepe", featuring gambling, income sources, and investment mechanics. The bot includes a modular command and event system with prefix-based commands, comprehensive logging, PostgreSQL database integration, and runs 24/7 on Replit's Autoscale deployment. Key features include economy game system, ping/latency checking, help system, message moderation, word football game, and full economic simulation with banking, gambling, work, and leaderboards. All user-facing messages, commands, help text, and system logs are localized in Czech.

## Recent Changes (2025-08-10)
- Database reset performed - all users start from zero again
- Complete economy system with 21 commands fully operational
- All gambling, investment, and economic features working properly

## User Preferences

Preferred communication style: Simple, everyday language.
Language preference: Czech (all bot messages, commands, and logs translated to Czech)

## System Architecture

### Bot Framework
- **Discord.js v14**: Main library for Discord API interaction with modern intents system
- **Modular Architecture**: Commands and events are loaded dynamically from separate directories
- **Collection-based Storage**: Commands are stored in Discord.js Collections for efficient access
- **Intent Configuration**: Configured for guilds, messages, message content, and direct messages

### Command System
- **Prefix-based Commands**: Traditional `!command` style with configurable prefix
- **Alias Support**: Commands can have multiple aliases for user convenience  
- **Category Organization**: Commands are grouped by categories (utility, moderation, economy, games, etc.)
- **Help System**: Auto-generated help with command details and usage information
- **Economy Commands**: Complete economic system with 8+ commands for money management
- **Moderation Commands**: Message management with !clear command for bulk deletion
- **Game Commands**: Word football game with "." prefix, gambling games (slots), and streak tracking
- **Future Slash Command Support**: Infrastructure prepared for slash command integration

### Event System
- **Dynamic Event Loading**: Events are automatically loaded from the events directory
- **Separation of Concerns**: Each event type handled in separate files
- **Message Processing**: Handles both command execution and mention responses
- **Interaction Ready**: Prepared for button, select menu, and slash command interactions

### Configuration Management
- **Environment Variables**: Sensitive data like tokens stored in .env files
- **Flexible Settings**: Configurable prefix, activity status, permissions, and logging
- **Owner/Admin System**: Role-based permission structure with owner IDs and admin roles

### Logging System
- **Custom Logger**: Built-in logging utility with multiple levels (error, warn, info, debug)
- **File Logging**: Optional file-based logging with daily log rotation
- **Console Output**: Formatted console logging with timestamps and levels
- **Error Tracking**: Comprehensive error handling and logging throughout the application

### Error Handling
- **Global Error Catching**: Unhandled promise rejections and exceptions are logged
- **Graceful Degradation**: Commands fail safely with user-friendly error messages
- **Development Support**: Detailed error logging for debugging and maintenance

## Economy System

### Database Architecture
- **PostgreSQL Integration**: Persistent data storage with Drizzle ORM
- **User Management**: Automatic user creation and profile management
- **Transaction History**: Complete audit trail of all economic activities
- **Investment Tracking**: Portfolio management for future investment features

### Economic Features
- **Starting Capital**: New users begin with 1,000 currency units
- **Daily Bonuses**: 200-699 currency every 24 hours with XP rewards
- **Work System**: Hourly income based on job level and experience (50-500+ currency)
- **Banking System**: Secure storage with deposit/withdraw functionality
- **Gambling Games**: Slot machines, coinflip, dice with varied payouts and risk levels
- **Robbery System**: PvP mechanic with 35% success rate and 2-hour cooldown
- **Shopping System**: 8 purchasable items including tools, luxury goods, and collectibles
- **Inventory Management**: Personal item storage with value tracking
- **Job Progression**: 8 career levels from unemployed to CEO with level requirements
- **Transfer System**: Player-to-player money transfers with 2% fee
- **Leaderboards**: Real-time ranking system for wealth accumulation
- **Profile System**: Detailed statistics, cooldowns, and progression tracking

### Economic Balance
- **Risk/Reward**: Gambling offers high rewards with proportional risk
- **Progression System**: Experience points and levels increase earning potential
- **Security Features**: Bank storage protects against future robbery mechanics
- **Anti-Exploitation**: Cooldown timers prevent economic abuse

## External Dependencies

### Core Dependencies
- **discord.js**: Primary Discord API wrapper library for bot functionality
- **dotenv**: Environment variable management for configuration and secrets
- **drizzle-orm**: Modern TypeScript ORM for database operations
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity

### Database Integration
- **PostgreSQL**: Primary database for persistent economy data storage
- **Drizzle Kit**: Database migration and schema management tools
- **Connection Pooling**: Efficient database connection management

### Discord API Integration
- **Gateway Intents**: Configured for message content, guild messages, and direct messages
- **Presence Management**: Bot status and activity configuration
- **Permission System**: Integration with Discord's role-based permissions

### File System Operations
- **Dynamic Module Loading**: Commands and events loaded from filesystem at runtime
- **Log File Management**: Automatic log directory creation and file writing

### Node.js Runtime
- **Process Management**: Signal handling for graceful shutdown and error recovery
- **Async/Await**: Modern asynchronous JavaScript throughout the codebase