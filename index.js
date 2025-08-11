const { Client, GatewayIntentBits, Collection } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Načtení příkazů
client.commands = new Collection();
const fs = require('fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Registrace event handleru messageCreate JEDNOU
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  console.log(`Příkaz detekován: ${message.content}`);

  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Chyba v ${commandName} příkazu:`, error);
    message.reply('❌ Nastala chyba!');
  }
});

client.once('ready', () => {
  console.log(`Bot je připojen jako ${client.user.tag}`);
});

client.login('TOKEN_TVÉHO_BOTA');
