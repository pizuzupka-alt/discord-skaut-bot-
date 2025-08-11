require('./server');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

// Vytvoření klienta
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Kolekce pro příkazy
client.commands = new Collection();
client.config = {
    presence: {
        activities: [{ name: 'tvůj server', type: 'WATCHING' }],
        status: 'online'
    }
};
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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
client.commands = new Collection();
const fs = require('fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Načtení ostatních eventů (bez messageCreate)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.name === 'messageCreate') continue; // řešíme níže
        if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
        else client.on(event.name, (...args) => event.execute(...args, client));
        console.log(`[INFO] Načten event: ${event.name}`);
    }
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Jediný handler pro příkazy
client.on('messageCreate', message => {
    if (!message.content.startsWith('!') || message.author.bot) return;
// Registrace event handleru messageCreate JEDNOU
client.on('messageCreate', async message => {
  if (message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
  console.log(`Příkaz detekován: ${message.content}`);

    console.log(`Příkaz detekován: ${commandName}`);
  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

    const command = client.commands.get(commandName) 
        || client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

    if (!command) {
        console.log(`[WARNING] Příkaz '${commandName}' nebyl nalezen`);
        return;
    }
  const command = client.commands.get(commandName);
  if (!command) return;

    try {
        command.execute(message, args, client);
    } catch (err) {
        console.error(`[ERROR] Chyba při spouštění příkazu ${commandName}:`, err);
        message.reply('Nastala chyba při vykonávání příkazu.');
    }
  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Chyba v ${commandName} příkazu:`, error);
    message.reply('❌ Nastala chyba!');
  }
});

client.on('error', console.error);
client.on('warn', console.warn);

process.on('SIGINT', () => { client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { client.destroy(); process.exit(0); });
client.once('ready', () => {
  console.log(`Bot je připojen jako ${client.user.tag}`);
});

client.login(process.env.TOKEN);
client.login('TOKEN_TVÉHO_BOTA');
