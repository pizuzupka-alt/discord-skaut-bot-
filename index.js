require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

// Express server pro Render
const server = express();
server.all('/', (req, res) => {
    res.send('Bot běží!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Server běží na portu ${PORT}`);
});

// Import handlers
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const logger = require('./utils/logger');

// Config objekt (místo config.js)
const config = {
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX || '!',
    clientId: process.env.CLIENT_ID || '',
    presence: {
        status: 'online',
        activities: [{
            name: process.env.BOT_ACTIVITY || 's Discord.js',
            type: 0
        }]
    },
    permissions: {
        ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
        adminRoles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : ['Admin', 'Moderátor']
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true' || false
    }
};

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Initialize collections and config
client.commands = new Collection();
client.config = config;

// Basic events (místo eventHandler pokud nemáš events složku)
client.once('ready', () => {
    logger.info(`✅ Bot je připraven! Přihlášen jako ${client.user.tag}`);
    
    // Set presence
    if (config.presence) {
        client.user.setPresence(config.presence);
    }
});

// Handle prefix commands
client.on('messageCreate', async (message) => {
    await commandHandler.handlePrefixCommand(message, client);
});

// Handle slash commands (pokud je používáš)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
        logger.info(`Slash příkaz ${interaction.commandName} proveden uživatelem ${interaction.user.tag}`);
    } catch (error) {
        logger.error(`Chyba při provádění slash příkazu ${interaction.commandName}:`, error);
        
        const errorMessage = '❌ Došlo k chybě při provádění tohoto příkazu!';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// Initialize bot
async function initialize() {
    try {
        logger.info('🚀 Spouštím inicializaci bota...');
        
        // Load commands
        await commandHandler.loadCommands(client);
        logger.info('✅ Příkazy načteny úspěšně');
        
        // Load events (pouze pokud existuje složka events)
        try {
            await eventHandler.loadEvents(client);
            logger.info('✅ Události načteny úspěšně');
        } catch (error) {
            logger.warn('⚠️ Složka events neexistuje nebo je prázdná, používám základní události');
        }
        
        // Login to Discord
        await client.login(config.token);
        
    } catch (error) {
        logger.error('❌ Nepodařilo se inicializovat bota:', error);
        process.exit(1);
    }
}

// Error handling
process.on('unhandledRejection', error => {
    logger.error('Nezvládnuté odmítnutí promise:', error);
});

process.on('uncaughtException', error => {
    logger.error('Nezachycená výjimka:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Přijat SIGINT, ukončuji elegantně...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Přijat SIGTERM, ukončuji elegantně...');
    client.destroy();
    process.exit(0);
});

// Start the bot
initialize();
