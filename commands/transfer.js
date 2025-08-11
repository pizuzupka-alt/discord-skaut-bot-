const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'transfer',
        aliases: ['send', 'poslat', 'prevest'],
        description: 'Pošli peníze jinému uživateli',
        category: 'Ekonomie',
        usage: '<@uživatel> <částka>'
    },
    async execute(message, args) {
        try {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                return message.reply('❌ Musíš zmínit uživatele! Použití: `!transfer <@uživatel> <částka>`');
            }

            if (targetUser.id === message.author.id) {
                return message.reply('❌ Nemůžeš poslat peníze sám sobě!');
            }

            if (targetUser.bot) {
                return message.reply('❌ Nemůžeš poslat peníze botovi!');
            }

            if (!args[1]) {
                return message.reply('❌ Musíš zadat částku! Použití: `!transfer <@uživatel> <částka>`');
            }

            const amount = parseInt(args[1]);
            
            if (isNaN(amount)) {
                return message.reply('❌ Neplatná částka! Zadej číslo.');
            }

            if (amount <= 0) {
                return message.reply('❌ Částka musí být větší než 0!');
            }

            if (amount < 10) {
                return message.reply('❌ Minimální převod je 10 Kč!');
            }

            const sender = await economyService.getOrCreateUser(message.author.id, message.author.username);
            const senderMoney = parseFloat(sender.money);
            
            if (senderMoney < amount) {
                return message.reply('❌ Nemáš dostatek peněz v hotovosti!');
            }

            // Poplatek za převod (2% minimum 1 Kč, maximum 100 Kč)
            const fee = Math.min(Math.max(Math.ceil(amount * 0.02), 1), 100);
            const totalCost = amount + fee;
            
            if (senderMoney < totalCost) {
                return message.reply(`❌ Nemáš dostatek peněz! Potřebuješ ${totalCost.toLocaleString('cs-CZ')} Kč (${amount.toLocaleString('cs-CZ')} + ${fee.toLocaleString('cs-CZ')} poplatek).`);
            }

            // Vytvoř nebo najdi příjemce
            await economyService.getOrCreateUser(targetUser.id, targetUser.username);

            // Proveď převod
            await economyService.updateUserMoney(message.author.id, totalCost.toString(), 'subtract');
            await economyService.updateUserMoney(targetUser.id, amount.toString(), 'add');
            
            // Zaznamenej transakce
            await economyService.addTransaction(message.author.id, 'transfer', (-totalCost).toString(), `Převod pro ${targetUser.username} (včetně poplatku ${fee} Kč)`);
            await economyService.addTransaction(targetUser.id, 'transfer', amount.toString(), `Převod od ${message.author.username}`);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💸 Převod dokončen!')
                .setDescription(`**${message.author.username}** poslal **${amount.toLocaleString('cs-CZ')} Kč** uživateli **${targetUser.username}**! 💰`)
                .addFields(
                    {
                        name: '💵 Převedeno',
                        value: `${amount.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💳 Poplatek (2%)',
                        value: `${fee.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💰 Celkem odečteno',
                        value: `${totalCost.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '👤 Příjemce',
                        value: targetUser.username,
                        inline: true
                    },
                    {
                        name: '💳 Tvůj nový zůstatek',
                        value: `${(senderMoney - totalCost).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Tip: Převody mají poplatek 2% (min. 1 Kč, max. 100 Kč)' })
                .setTimestamp();

            message.reply({ embeds: [embed] });

            // Pošli notifikaci příjemci pokud je na stejném serveru
            try {
                const recipient = message.guild.members.cache.get(targetUser.id);
                if (recipient) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('💰 Obdržel jsi peníze!')
                        .setDescription(`**${message.author.username}** ti poslal **${amount.toLocaleString('cs-CZ')} Kč**!`)
                        .addFields({
                            name: '🏦 Server',
                            value: message.guild.name,
                            inline: true
                        })
                        .setTimestamp();
                    
                    await targetUser.send({ embeds: [dmEmbed] });
                }
            } catch (error) {
                // DM se nepovedlo poslat, ale převod je dokončen
                console.log('Nepovedlo se poslat DM příjemci:', error.message);
            }
            
        } catch (error) {
            console.error('Chyba při převodu peněz:', error);
            message.reply('❌ Došlo k chybě při převodu peněz.');
        }
    },
};