const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'dice',
        aliases: ['kostka', 'roll'],
        description: 'Hoď kostkou a vsaď si na výsledek (1-6)',
        category: 'Ekonomie',
        usage: '<částka> <číslo 1-6>'
    },
    async execute(message, args) {
        try {
            if (!args[0] || !args[1]) {
                return message.reply('❌ Použití: `!dice <částka> <číslo 1-6>`\nVyber číslo od 1 do 6 a vsaď si na něj!');
            }

            const betAmount = parseInt(args[0]);
            const guess = parseInt(args[1]);
            
            if (isNaN(betAmount)) {
                return message.reply('❌ Neplatná částka! Zadej číslo.');
            }

            if (isNaN(guess) || guess < 1 || guess > 6) {
                return message.reply('❌ Vyber číslo od 1 do 6!');
            }

            if (betAmount < 10) {
                return message.reply('❌ Minimální sázka je 10 Kč!');
            }

            if (betAmount > 2000) {
                return message.reply('❌ Maximální sázka je 2,000 Kč!');
            }

            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            const userMoney = parseFloat(user.money);
            
            if (userMoney < betAmount) {
                return message.reply('❌ Nemáš dostatek peněz!');
            }

            // Hoď kostkou
            const diceResult = Math.floor(Math.random() * 6) + 1;
            const won = diceResult === guess;

            // Výhra je 5x sázka (protože šance je 1/6)
            const winAmount = won ? betAmount * 5 : 0;
            const finalAmount = won ? (userMoney + winAmount - betAmount) : (userMoney - betAmount);
            
            await economyService.updateUserMoney(message.author.id, betAmount.toString(), 'subtract');
            if (won) {
                await economyService.updateUserMoney(message.author.id, winAmount.toString(), 'add');
            }
            
            const transactionAmount = won ? (winAmount - betAmount).toString() : (-betAmount).toString();
            await economyService.addTransaction(message.author.id, 'gamble', transactionAmount, 'Kostka');

            // Emoji pro kostku
            const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

            const embed = new EmbedBuilder()
                .setColor(won ? '#00ff00' : '#ff0000')
                .setTitle('🎲 Kostka')
                .setDescription(`**Kostka ukázala:** ${diceEmojis[diceResult]} **${diceResult}**\n**Tvůj tip:** ${diceEmojis[guess]} **${guess}**\n\n${won ? 
                    `🎉 **VÝHRA!** Vyhrál jsi **${winAmount.toLocaleString('cs-CZ')} Kč**!` : 
                    `💸 **Prohrál jsi!** Ztratil jsi **${betAmount.toLocaleString('cs-CZ')} Kč**.`}`)
                .addFields(
                    {
                        name: '💰 Sázka',
                        value: `${betAmount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: won ? '🎁 Výhra' : '💸 Ztráta',
                        value: won ? 
                            `${winAmount.toLocaleString('cs-CZ')} Kč (5x)` : 
                            `${betAmount.toLocaleString('cs-CZ')} Kč`,
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
                        '🎯 Přesný zásah!' : 
                        '🎲 Zkus to znovu!'
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Chyba při hození kostky:', error);
            message.reply('❌ Došlo k chybě při hození kostky.');
        }
    },
};