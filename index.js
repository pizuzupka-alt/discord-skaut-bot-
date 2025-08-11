require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

// Config objekt
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

client.commands = new Collection();
client.config = config;

client.once('ready', () => {
    console.log(`✅ Bot je připraven! Přihlášen jako ${client.user.tag}`);
    if (config.presence) client.user.setPresence(config.presence);
});

client.on('messageCreate', async (message) => {
    await commandHandler.handlePrefixCommand(message, client);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
        console.log(`Slash příkaz ${interaction.commandName} proveden uživatelem ${interaction.user.tag}`);
    } catch (error) {
        console.error(`Chyba při provádění slash příkazu ${interaction.commandName}:`, error);
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
        console.log('🚀 Spouštím inicializaci bota...');

        // Load commands (pouze pokud složka existuje)
        const commandsPath = path.join(__dirname, 'commands');
        if (fs.existsSync(commandsPath)) {
            await commandHandler.loadCommands(client);
            console.log('✅ Příkazy načteny úspěšně');
        } else {
            console.warn('⚠️ Složka "commands" neexistuje, žádné příkazy nenačteny');
        }

        // Load events (pouze pokud složka existuje)
        const eventsPath = path.join(__dirname, 'events');
        if (fs.existsSync(eventsPath)) {
            await eventHandler.loadEvents(client);
            console.log('✅ Události načteny úspěšně');
        } else {
            console.warn('⚠️ Složka "events" neexistuje, používám základní události');
        }

        // Login to Discord
        if (!config.token) {
            throw new Error('❌ Chybí DISCORD_TOKEN v proměnných prostředí!');
        }
        await client.login(config.token);

    } catch (error) {
        console.error('❌ Nepodařilo se inicializovat bota!');
        console.error(error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Nezvládnuté odmítnutí promise:', error);
});
process.on('uncaughtException', error => {
    console.error('Nezachycená výjimka:', error);
    process.exit(1);
});

// Start the bot
initialize();
