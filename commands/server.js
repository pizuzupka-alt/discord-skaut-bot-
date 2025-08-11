const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'server',
        description: 'Zobrazuje informace o aktuálním serveru',
        aliases: ['serverinfo', 'guild'],
        usage: '!server',
        category: 'užitečné'
    },
    async execute(message, args, client) {
        if (!message.guild) {
            return message.reply('❌ Tento příkaz lze použít pouze na serveru!');
        }

        const guild = message.guild;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📊 Informace o serveru: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '🆔 ID serveru',
                    value: guild.id,
                    inline: true
                },
                {
                    name: '👑 Vlastník',
                    value: `<@${guild.ownerId}>`,
                    inline: true
                },
                {
                    name: '📅 Vytvořen',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: '👥 Členové',
                    value: `${guild.memberCount}`,
                    inline: true
                },
                {
                    name: '💬 Kanály',
                    value: `${guild.channels.cache.size}`,
                    inline: true
                },
                {
                    name: '😃 Emoji',
                    value: `${guild.emojis.cache.size}`,
                    inline: true
                },
                {
                    name: '🚀 Boost level',
                    value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount} boostů)`,
                    inline: true
                },
                {
                    name: '🔒 Úroveň ověření',
                    value: this.getVerificationLevel(guild.verificationLevel),
                    inline: true
                },
                {
                    name: '📍 Region',
                    value: guild.preferredLocale || 'Neznámý',
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Požádal ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            });

        if (guild.description) {
            embed.setDescription(guild.description);
        }

        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
        }

        return message.reply({ embeds: [embed] });
    },

    getVerificationLevel(level) {
        const levels = {
            0: 'Žádné',
            1: 'Nízké',
            2: 'Střední', 
            3: 'Vysoké',
            4: 'Nejvyšší'
        };
        return levels[level] || 'Neznámé';
    }
};