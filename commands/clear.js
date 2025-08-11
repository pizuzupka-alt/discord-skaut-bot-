const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: {
        name: 'clear',
        description: 'Smaže určitý počet zpráv v kanálu',
        usage: '!clear <počet zpráv (1-100)>',
        category: 'Moderace',
        aliases: ['delete', 'purge', 'smazat', 'vymazat']
    },
    async execute(message, args, client) {
        try {
            // Kontrola oprávnění
            if (!message.member.permissions.has('ManageMessages')) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Chyba oprávnění')
                    .setDescription('Nemáš oprávnění spravovat zprávy!');
                return message.reply({ embeds: [embed] });
            }

            // Kontrola argumentů
            if (!args.length) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Chyba')
                    .setDescription('Musíš zadat počet zpráv k smazání!\n**Použití:** `!clear <počet 1-100>`');
                return message.reply({ embeds: [embed] });
            }

            const amount = parseInt(args[0]);

            // Validace počtu
            if (isNaN(amount)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Chyba')
                    .setDescription('Počet zpráv musí být číslo!');
                return message.reply({ embeds: [embed] });
            }

            if (amount <= 0 || amount > 100) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Chyba')
                    .setDescription('Počet zpráv musí být mezi 1 a 100!');
                return message.reply({ embeds: [embed] });
            }

            // Smazání zpráv včetně příkazové zprávy
            const deletedMessages = await message.channel.bulkDelete(amount + 1, true);
            const actualDeleted = deletedMessages.size - 1; // -1 protože počítáme i příkazovou zprávu

            // Potvrzovací zpráva (automaticky se smaže po 5 sekundách)
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Zprávy smazány')
                .setDescription(`Smazáno **${actualDeleted}** zpráv`)
                .setFooter({ 
                    text: `Provedl ${message.author.tag} | Tato zpráva se smaže za 5 sekund`,
                    iconURL: message.author.displayAvatarURL()
                });

            const confirmMessage = await message.channel.send({ embeds: [embed] });

            // Automatické smazání potvrzovací zprávy po 5 sekundách
            setTimeout(() => {
                confirmMessage.delete().catch(err => {
                    logger.error(`Nepodařilo se smazat potvrzovací zprávu: ${err.message}`);
                });
            }, 5000);

            logger.info(`Uživatel ${message.author.tag} smazal ${actualDeleted} zpráv v kanálu ${message.channel.name} na serveru ${message.guild.name}`);

        } catch (error) {
            logger.error(`Chyba v příkazu clear: ${error.message}`);

            let errorMessage = 'Něco se pokazilo při mazání zpráv.';
            
            if (error.code === 50034) {
                errorMessage = 'Nelze smazat zprávy starší než 14 dní!';
            } else if (error.code === 50013) {
                errorMessage = 'Bot nemá oprávnění mazat zprávy v tomto kanálu!';
            }

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Chyba při mazání')
                .setDescription(errorMessage);

            return message.reply({ embeds: [embed] });
        }
    }
};