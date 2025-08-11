const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'invest',
        aliases: ['investice', 'investovat'],
        description: 'Investuj peníze do portfolia s denním výnosem',
        category: 'Ekonomie',
        usage: '<částka> nebo "collect" pro výběr'
    },
    async execute(message, args) {
        try {
            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            
            if (!args[0]) {
                // Zobraz informace o investicích
                const investments = await economyService.getUserInvestments(message.author.id);
                const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
                const totalReturns = investments.reduce((sum, inv) => sum + (parseFloat(inv.currentPrice) - parseFloat(inv.buyPrice)), 0);
                
                const embed = new EmbedBuilder()
                    .setColor('#0066cc')
                    .setTitle('📈 Investiční portfolio')
                    .setDescription('**Investuj své peníze a nech je růst!**\n\n**Jak to funguje:**\n• Denní výnos: 2-8% z investice\n• Minimální investice: 500 Kč\n• Maximální investice: 10,000 Kč najednou')
                    .addFields(
                        {
                            name: '💰 Celková investice',
                            value: `${totalInvested.toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        },
                        {
                            name: '📊 Celkové výnosy',
                            value: `${totalReturns.toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        },
                        {
                            name: '🎯 Zisk/Ztráta',
                            value: totalReturns > 0 ? 
                                `+${totalReturns.toLocaleString('cs-CZ')} Kč ✅` : 
                                `${totalReturns.toLocaleString('cs-CZ')} Kč ❌`,
                            inline: true
                        }
                    )
                    .setFooter({ text: 'Použij !invest <částka> pro investici nebo !invest collect pro výběr' })
                    .setTimestamp();

                if (investments.length > 0) {
                    let investmentList = '';
                    investments.forEach((inv, index) => {
                        const daysSince = Math.floor((new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
                        const profit = parseFloat(inv.currentPrice) - parseFloat(inv.buyPrice);
                        const profitPercent = ((profit / parseFloat(inv.buyPrice)) * 100).toFixed(1);
                        
                        investmentList += `**${index + 1}.** ${parseFloat(inv.amount).toLocaleString('cs-CZ')} Kč `;
                        investmentList += `(${daysSince}d) • ${profit >= 0 ? '+' : ''}${profit.toLocaleString('cs-CZ')} Kč (${profitPercent}%)\n`;
                    });
                    
                    embed.addFields({
                        name: '📋 Aktivní investice',
                        value: investmentList,
                        inline: false
                    });
                }

                return message.reply({ embeds: [embed] });
            }

            if (args[0].toLowerCase() === 'collect') {
                // Výběr všech investic
                const investments = await economyService.getUserInvestments(message.author.id);
                
                if (investments.length === 0) {
                    return message.reply('❌ Nemáš žádné aktivní investice!');
                }

                const totalAmount = investments.reduce((sum, inv) => sum + parseFloat(inv.currentPrice), 0);
                const totalReturns = investments.reduce((sum, inv) => sum + (parseFloat(inv.currentPrice) - parseFloat(inv.buyPrice)), 0);
                
                await economyService.updateUserMoney(message.author.id, totalAmount.toString(), 'add');
                await economyService.collectAllInvestments(message.author.id);
                await economyService.addTransaction(message.author.id, 'invest_collect', totalAmount.toString(), 'Výběr investic');

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('💰 Investice vybrány!')
                    .setDescription(`**Úspěšně jsi vybral všechny investice!** 🎉`)
                    .addFields(
                        {
                            name: '💵 Celková částka',
                            value: `${totalAmount.toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        },
                        {
                            name: totalReturns >= 0 ? '📈 Zisk' : '📉 Ztráta',
                            value: `${totalReturns >= 0 ? '+' : ''}${totalReturns.toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        },
                        {
                            name: '💳 Nový zůstatek',
                            value: `${(parseFloat(user.money) + totalAmount).toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        }
                    )
                    .setFooter({ text: totalReturns >= 0 ? '🎯 Skvělý obchod!' : '💪 Příště to půjde lépe!' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Nová investice
            const amount = parseFloat(args[0]);
            
            if (isNaN(amount)) {
                return message.reply('❌ Neplatná částka! Zadej číslo.');
            }

            if (amount < 500) {
                return message.reply('❌ Minimální investice je 500 Kč!');
            }

            if (amount > 10000) {
                return message.reply('❌ Maximální investice je 10,000 Kč najednou!');
            }

            const userMoney = parseFloat(user.money);
            if (userMoney < amount) {
                return message.reply('❌ Nemáš dostatek peněz v hotovosti!');
            }

            // Proveď investici
            await economyService.updateUserMoney(message.author.id, amount.toString(), 'subtract');
            await economyService.createInvestment(message.author.id, amount);
            await economyService.addTransaction(message.author.id, 'invest', (-amount).toString(), 'Nová investice');

            const embed = new EmbedBuilder()
                .setColor('#0066cc')
                .setTitle('📈 Investice vytvořena!')
                .setDescription(`**Úspěšně jsi investoval ${amount.toLocaleString('cs-CZ')} Kč!** 💼`)
                .addFields(
                    {
                        name: '💰 Investovaná částka',
                        value: `${amount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '📊 Očekávaný denní výnos',
                        value: '2-8%',
                        inline: true
                    },
                    {
                        name: '💳 Zbývající hotovost',
                        value: `${(userMoney - amount).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    }
                )
                .setFooter({ text: '📈 Investice začne generovat výnosy za 24 hodin!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Chyba při investování:', error);
            message.reply('❌ Došlo k chybě při investování.');
        }
    },
};