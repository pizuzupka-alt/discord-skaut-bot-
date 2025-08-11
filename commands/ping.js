const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'ping',
        description: 'Odpovídá Pong a zobrazuje latenci bota',
        aliases: ['latency', 'ms', 'latence'],
        usage: '!ping',
        category: 'užitečné'
    },
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pinguji...');
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏓 Pong!')
            .addFields(
                { 
                    name: 'Latence zprávy', 
                    value: `${sent.createdTimestamp - message.createdTimestamp}ms`, 
                    inline: true 
                },
                { 
                    name: 'Websocket heartbeat', 
                    value: `${client.ws.ping}ms`, 
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Požádal ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL() 
            });

        await sent.edit({ content: null, embeds: [embed] });
    }
};
