const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'rob',
        aliases: ['krast', 'steal'],
        description: 'Pokus se okrást jiného uživatele (riziko a cooldown)',
        category: 'Ekonomie',
        usage: '<@uživatel>'
    },
    async execute(message, args) {
        try {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                return message.reply('❌ Musíš zmínit uživatele! Použití: `!rob <@uživatel>`');
            }

            if (targetUser.id === message.author.id) {
                return message.reply('❌ Nemůžeš okrást sám sebe!');
            }

            if (targetUser.bot) {
                return message.reply('❌ Nemůžeš okrást bota!');
            }

            const robber = await economyService.getOrCreateUser(message.author.id, message.author.username);
            
            // Zkontroluj cooldown (1 hodiny)
            const now = new Date();
            if (robber.lastRob) {
                const nextRob = new Date(robber.lastRob);
                nextRob.setHours(nextRob.getHours() + 1);
                
                if (now < nextRob) {
                    const hoursLeft = Math.ceil((nextRob - now) / (10000 * 60 * 60 ));
                    return message.reply(`❌ Další krádež můžeš zkusit za **${hoursLeft} hodinu**.`);
                }
            }

            // Minimální requirements
            if (parseFloat(robber.money) < 100) {
                return message.reply('❌ Potřebuješ alespoň 100 Kč v hotovosti pro pokus o krádež!');
            }

            const target = await economyService.getOrCreateUser(targetUser.id, targetUser.username);
            const targetMoney = parseFloat(target.money);
            
            if (targetMoney < 50) {
                return message.reply('❌ Tento uživatel nemá dostatek peněz v hotovosti (min. 50 Kč)!');
            }

            // 35% šance na úspěch
            const success = Math.random() < 0.35;
            const fine = Math.floor(Math.random() * 200) + 100; // Pokuta 100-299 Kč
            
            // Aktualizuj cooldown
            await economyService.updateRobCooldown(message.author.id, now);

            if (success) {
                // Úspěšná krádež - ukradni 10-40% z hotovosti oběti (max 1000 Kč)
                const stealPercentage = Math.random() * 0.20 + 0.10; // 10-30%
                const stolenAmount = Math.min(Math.floor(targetMoney * stealPercentage), 1000);
                
                await economyService.updateUserMoney(message.author.id, stolenAmount.toString(), 'add');
                await economyService.updateUserMoney(targetUser.id, stolenAmount.toString(), 'subtract');
                
                await economyService.addTransaction(message.author.id, 'rob', stolenAmount.toString(), `Úspěšná krádež u ${targetUser.username}`);
                await economyService.addTransaction(targetUser.id, 'rob', (-stolenAmount).toString(), `Okraden uživatelem ${message.author.username}`);

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('💰 Úspěšná krádež!')
                    .setDescription(`**${message.author.username}** úspěšně okradl **${targetUser.username}**! 🥷`)
                    .addFields(
                        {
                            name: '💵 Ukradeno',
                            value: `${stolenAmount.toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        },
                        {
                            name: '🎯 Oběť',
                            value: targetUser.username,
                            inline: true
                        },
                        {
                            name: '⏰ Další krádež',
                            value: 'Za 2 hodiny',
                            inline: true
                        }
                    )
                    .setFooter({ text: '💡 Tip: Uložte peníze do banky pro ochranu!' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
                
                // Pošli notifikaci oběti
                try {
                    const victimEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🚨 Byl jsi okraden!')
                        .setDescription(`**${message.author.username}** tě okradl o **${stolenAmount.toLocaleString('cs-CZ')} Kč**!`)
                        .addFields({
                            name: '🏦 Tip',
                            value: 'Používej `!deposit` k uložení peněz do banky pro ochranu před krádeží.',
                            inline: false
                        })
                        .setTimestamp();
                    
                    await targetUser.send({ embeds: [victimEmbed] });
                } catch (error) {
                    console.log('Nepovedlo se poslat DM oběti:', error.message);
                }

            } else {
                // Neúspěšná krádež - pokuta
                await economyService.updateUserMoney(message.author.id, fine.toString(), 'subtract');
                await economyService.addTransaction(message.author.id, 'rob', (-fine).toString(), `Pokuta za neúspěšnou krádež u ${targetUser.username}`);

                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🚔 Krádež se nezdařila!')
                    .setDescription(`**${message.author.username}** byl při krádeži chycen! 👮‍♂️`)
                    .addFields(
                        {
                            name: '💸 Pokuta',
                            value: `${fine.toLocaleString('cs-CZ')} Kč`,
                            inline: true
                        },
                        {
                            name: '🎯 Cíl',
                            value: targetUser.username,
                            inline: true
                        },
                        {
                            name: '⏰ Další pokus',
                            value: 'Za 2 hodiny',
                            inline: true
                        }
                    )
                    .setFooter({ text: '⚖️ Zločin se nevyplácí!' })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Chyba při krádeži:', error);
            message.reply('❌ Došlo k chybě při pokusu o krádež.');
        }
    },
};