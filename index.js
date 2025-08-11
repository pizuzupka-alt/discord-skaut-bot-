require('./server');
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
client.config = {
    presence: {
        activities: [{ name: 'tvůj server', type: 'WATCHING' }],
        status: 'online'
    }
};

// Načtení příkazů
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[INFO] Načten příkaz: ${command.data.name}`);
        } else {
            console.warn(`[WARNING] ${file} nemá data nebo execute`);
        }
    }
}

// Načtení eventů – ⚠ sem NEpřidávej další messageCreate, aby nebyly dvojité odpovědi
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.name === 'messageCreate') continue; // přeskakujeme, řešíme níže
        if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
        else client.on(event.name, (...args) => event.execute(...args, client));
        console.log(`[INFO] Načten event: ${event.name}`);
    }
}


    try {
        command.execute(message, args, client);
    } catch (err) {
        console.error(`[ERROR] Chyba při spouštění příkazu ${commandName}:`, err);
        message.reply('Nastala chyba při vykonávání příkazu.');
    }
});

client.on('error', console.error);
client.on('warn', console.warn);

process.on('SIGINT', () => { client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { client.destroy(); process.exit(0); });

client.login(process.env.TOKEN);
