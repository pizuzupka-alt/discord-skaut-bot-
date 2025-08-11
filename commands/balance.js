const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'balance',
        aliases: ['bal', 'money', 'peníze', 'penize'],
        description: 'Zobrazí tvůj aktuální zůstatek peněz',
        category: 'Ekonomie',
        usage: ''
    },
    async execute(message, args) {
        try {
            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            
            const totalWealth = parseFloat(user.money) + parseFloat(user.bank);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`💰 ${message.author.username} - Zůstatek`)
                .addFields(
                    {
                        name: '💵 Hotovost',
                        value: `**${parseFloat(user.money).toLocaleString('cs-CZ')} Kč**`,
                        inline: true
                    },
                    {
                        name: '🏦 V bance',
                        value: `**${parseFloat(user.bank).toLocaleString('cs-CZ')} Kč**`,
                        inline: true
                    },
                    {
                        name: '💎 Celkem',
                        value: `**${totalWealth.toLocaleString('cs-CZ')} Kč**`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Level ${user.level} • XP: ${user.experience}` 
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při získávání zůstatku:', error);
            message.reply('❌ Došlo k chybě při načítání tvého zůstatku.');
        }
    },
};
