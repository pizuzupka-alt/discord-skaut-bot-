const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Přidání config objektu pro ready event
client.config = {
    presence: {
        activities: [{
            name: 'tvůj server',
            type: 'WATCHING'
        }],
        status: 'online'
    }
};

// Načtení příkazů
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`[INFO] Načten příkaz: ${command.data.name}`);
            } else {
                console.warn(`[WARNING] Příkaz v ${file} nemá data nebo execute funkci`);
            }
        } catch (error) {
            console.error(`[ERROR] Chyba při načítání příkazu ${file}:`, error);
        }
    }
} else {
    console.warn(`[WARNING] Složka commands neexistuje`);
}

// Načtení eventů
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            console.log(`[INFO] Načten event: ${event.name}`);
        } catch (error) {
            console.error(`[ERROR] Chyba při načítání eventu ${file}:`, error);
        }
    }
} else {
    console.warn(`[WARNING] Složka events neexistuje`);
}

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[INFO] Vypínám bota...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[INFO] Vypínám bota (SIGTERM)...');
    client.destroy();
    process.exit(0);
});

client.login(process.env.TOKEN).catch(console.error);
