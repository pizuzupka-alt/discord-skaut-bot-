const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'deposit',
        aliases: ['dep', 'vklad'],
        description: 'Vlož peníze do banky pro bezpečné uložení',
        category: 'Ekonomie',
        usage: '<částka nebo "all">'
    },
    async execute(message, args) {
        try {
            if (!args[0]) {
                return message.reply('❌ Musíš zadat částku! Použití: `!deposit <částka>` nebo `!deposit all`');
            }

            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            let amount;

            if (args[0].toLowerCase() === 'all' || args[0].toLowerCase() === 'vše') {
                amount = parseFloat(user.money);
                if (amount <= 0) {
                    return message.reply('❌ Nemáš žádné peníze v hotovosti k uložení!');
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

            const result = await economyService.deposit(message.author.id, message.author.username, amount);
            
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
                .setTitle('🏦 Vklad do banky')
                .setDescription(`**Úspěšně jsi uložil ${amount.toLocaleString('cs-CZ')} Kč do banky!** 💰`)
                .addFields(
                    {
                        name: '💵 Uloženo',
                        value: `${amount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '🏦 V bance celkem',
                        value: `${(parseFloat(user.bank) + amount).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💳 Hotovost',
                        value: `${(parseFloat(user.money) - amount).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    }
                )
                .setFooter({ text: '🔒 Peníze v bance jsou v bezpečí před krádeží!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při vkladu do banky:', error);
            message.reply('❌ Došlo k chybě při ukládání peněz do banky.');
        }
    },
};