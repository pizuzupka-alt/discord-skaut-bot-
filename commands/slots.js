const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'slots',
        aliases: ['automaty', 'slot'],
        description: 'Zahraj si automaty (minimální sázka 10 Kč)',
        category: 'Ekonomie',
        usage: '<částka>'
    },
    async execute(message, args) {
        try {
            if (!args[0]) {
                return message.reply('❌ Musíš zadat částku! Použití: `!slots <částka>`\nMinimální sázka je 10 Kč.');
            }

            const betAmount = parseInt(args[0]);
            
            if (isNaN(betAmount)) {
                return message.reply('❌ Neplatná částka! Zadej číslo.');
            }

            if (betAmount < 10) {
                return message.reply('❌ Minimální sázka je 10 Kč!');
            }

            if (betAmount > 10000) {
                return message.reply('❌ Maximální sázka je 10,000 Kč!');
            }

            const result = await economyService.playSlots(message.author.id, message.author.username, betAmount);
            
            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Chyba!')
                    .setDescription(result.error)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(result.won ? '#00ff00' : '#ff0000')
                .setTitle('🎰 Automaty')
                .setDescription(`**${result.symbols.join(' | ')}**\n\n${result.won ? 
                    `🎉 **VÝHRA!** Vyhrál jsi **${result.amount.toLocaleString('cs-CZ')} Kč**!` : 
                    `💸 **Prohrál jsi!** Ztratil jsi **${betAmount.toLocaleString('cs-CZ')} Kč**.`}`)
                .addFields(
                    {
                        name: '💰 Sázka',
                        value: `${betAmount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: result.won ? '🎁 Výhra' : '💸 Ztráta',
                        value: result.won ? 
                            `${result.amount.toLocaleString('cs-CZ')} Kč` : 
                            `${betAmount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💳 Nový zůstatek',
                        value: `${result.balance.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: result.won ? 
                        '🍀 Štěstí přeje připraveným!' : 
                        '🎲 Příště to vyjde lépe!'
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při hře automaty:', error);
            message.reply('❌ Došlo k chybě při hře automaty.');
        }
    },
};