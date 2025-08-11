const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'withdraw',
        aliases: ['with', 'výběr', 'vyber'],
        description: 'Vyber peníze z banky',
        category: 'Ekonomie',
        usage: '<částka nebo "all">'
    },
    async execute(message, args) {
        try {
            if (!args[0]) {
                return message.reply('❌ Musíš zadat částku! Použití: `!withdraw <částka>` nebo `!withdraw all`');
            }

            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            let amount;

            if (args[0].toLowerCase() === 'all' || args[0].toLowerCase() === 'vše') {
                amount = parseFloat(user.bank);
                if (amount <= 0) {
                    return message.reply('❌ Nemáš žádné peníze v bance k výběru!');
                }
            } else {
                amount = parseFloat(args[0]);
                if (isNaN(amount)) {
                    return message.reply('❌ Neplatná částka! Zadej číslo nebo "all".');
                }
                if (amount <= 0) {
                    return message.reply('❌ Částka musí být větší než 0!');
                }
            }

            const result = await economyService.withdraw(message.author.id, message.author.username, amount);
            
            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Chyba!')
                    .setDescription(result.error)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🏦 Výběr z banky')
                .setDescription(`**Úspěšně jsi vybral ${amount.toLocaleString('cs-CZ')} Kč z banky!** 💰`)
                .addFields(
                    {
                        name: '💵 Vybráno',
                        value: `${amount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '🏦 V bance zůstává',
                        value: `${(parseFloat(user.bank) - amount).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💳 Hotovost',
                        value: `${(parseFloat(user.money) + amount).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Tip: Nech si v bance rezervu pro investice!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při výběru z banky:', error);
            message.reply('❌ Došlo k chybě při výběru peněz z banky.');
        }
    },
};