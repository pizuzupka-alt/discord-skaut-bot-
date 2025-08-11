require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

// Express server pro Render
const server = express();
server.all('/', (req, res) => {
    res.send('Bot běží!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Server běží na portu ${PORT}`);
});

// Discord bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot je online jako ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);
