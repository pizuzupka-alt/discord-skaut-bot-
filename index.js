const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.send('Bot běží!');
});

server.listen(3000, () => {
    console.log('🌐 Server je připraven.');
});

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Initialize collections
client.commands = new Collection();
client.config = config;

// Load commands and events
async function initialize() {
    try {
        logger.info('Spouštím inicializaci bota...');
        
        // Load commands
        await commandHandler.loadCommands(client);
        logger.info('Příkazy načteny úspěšně');
        
        // Load events
        await eventHandler.loadEvents(client);
        logger.info('Události načteny úspěšně');
        
        // Login to Discord
        await client.login(process.env.BOT_TOKEN);
        
    } catch (error) {
        logger.error('Nepodařilo se inicializovat bota:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    logger.error('Nezvládnuté odmítnutí promise:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
    logger.error('Nezachycená výjimka:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Přijat SIGINT, ukončuji s elegantě...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Přijat SIGTERM, ukončuji s elegantě...');
    client.destroy();
    process.exit(0);
});

// Start the bot
initialize();
