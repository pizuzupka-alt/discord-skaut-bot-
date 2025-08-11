const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'coinflip',
        aliases: ['flip', 'cf', 'mince'],
        description: 'Házej mincí a zkus své štěstí (50% šance na výhru)',
        category: 'Ekonomie',
        usage: '<částka> <h/o>'
    },
    async execute(message, args) {
        try {
            if (!args[0] || !args[1]) {
                return message.reply('❌ Použití: `!coinflip <částka> <h/o>`\nVyber hlavu (h) nebo orel (o)!');
            }

            const betAmount = parseInt(args[0]);
            const choice = args[1].toLowerCase();
            
            if (isNaN(betAmount)) {
                return message.reply('❌ Neplatná částka! Zadej číslo.');
            }

            if (betAmount < 10) {
                return message.reply('❌ Minimální sázka je 10 Kč!');
            }

            if (betAmount > 5000) {
                return message.reply('❌ Maximální sázka je 5,000 Kč!');
            }

            if (!['h', 'o', 'hlava', 'orel'].includes(choice)) {
                return message.reply('❌ Vyber hlavu (h) nebo orel (o)!');
            }

            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            const userMoney = parseFloat(user.money);
            
            if (userMoney < betAmount) {
                return message.reply('❌ Nemáš dostatek peněz!');
            }

            // Flip the coin
            const coinResult = Math.random() < 0.5 ? 'hlava' : 'orel';
            const userChoice = ['h', 'hlava'].includes(choice) ? 'hlava' : 'orel';
            const won = coinResult === userChoice;

            const finalAmount = won ? (userMoney + betAmount) : (userMoney - betAmount);
            
            await economyService.updateUserMoney(message.author.id, betAmount.toString(), won ? 'add' : 'subtract');
            
            const transactionAmount = won ? betAmount.toString() : (-betAmount).toString();
            await economyService.addTransaction(message.author.id, 'gamble', transactionAmount, 'Házení mincí');

            const embed = new EmbedBuilder()
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTitle('🪙 Házení mincí')
                .setDescription(`**Mince padla:** ${coinResult === 'hlava' ? '👤 Hlava' : '🦅 Orel'}\n**Tvá volba:** ${userChoice === 'hlava' ? '👤 Hlava' : '🦅 Orel'}\n\n${won ? 
                    `🎉 **VÝHRA!** Vyhrál jsi **${betAmount.toLocaleString('cs-CZ')} Kč**!` : 
                    `💸 **Prohrál jsi!** Ztratil jsi **${betAmount.toLocaleString('cs-CZ')} Kč**.`}`)
                .addFields(
                    {
                        name: '💰 Sázka',
                        value: `${betAmount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: won ? '🎁 Výhra' : '💸 Ztráta',
                        value: `${betAmount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💳 Nový zůstatek',
                        value: `${finalAmount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: won ? 
                        '🍀 Dobrá volba!' : 
                        '🎲 Příště to vyjde!'
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při házení mincí:', error);
            message.reply('❌ Došlo k chybě při házení mincí.');
        }
    },
};