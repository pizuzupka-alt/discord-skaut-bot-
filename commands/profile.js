const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'profile',
        aliases: ['profil', 'p', 'me'],
        description: 'Zobrazí tvůj ekonomický profil a statistiky',
        category: 'Ekonomie',
        usage: '[@uživatel]'
    },
    async execute(message, args) {
        try {
            // Pokud je zmíněn uživatel, zobraz jeho profil, jinak vlastní
            const targetUser = message.mentions.users.first() || message.author;
            const user = await economyService.getOrCreateUser(targetUser.id, targetUser.username);
            
            const totalWealth = parseFloat(user.money) + parseFloat(user.bank);
            const isOwnProfile = targetUser.id === message.author.id;
            
            // Spočítej level na základě experience
            const level = Math.floor(user.experience / 100) + 1;
            const currentLevelXP = user.experience % 100;
            const xpToNextLevel = 100 - currentLevelXP;
            
            // Emoji podle levelu
            let levelEmoji = '🆕';
            if (level >= 50) levelEmoji = '👑';
            else if (level >= 25) levelEmoji = '💎';
            else if (level >= 10) levelEmoji = '⭐';
            else if (level >= 5) levelEmoji = '🥉';
            
            // Zjisti pozici na žebříčku
            const allUsers = await economyService.getLeaderboard(1000);
            const userRank = allUsers.findIndex(u => u.id === targetUser.id) + 1;
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${levelEmoji} Profil: ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: '💰 Finanční přehled',
                        value: `**Hotovost:** ${parseFloat(user.money).toLocaleString('cs-CZ')} Kč\n**V bance:** ${parseFloat(user.bank).toLocaleString('cs-CZ')} Kč\n**Celkem:** ${totalWealth.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '📊 Statistiky',
                        value: `**Level:** ${level} ${levelEmoji}\n**XP:** ${user.experience.toLocaleString('cs-CZ')}\n**Do dalšího:** ${xpToNextLevel} XP`,
                        inline: true
                    },
                    {
                        name: '💼 Kariéra',
                        value: `**Povolání:** ${user.job}\n**Žebříček:** #${userRank || 'N/A'}\n**Účet od:** ${new Date(user.createdAt).toLocaleDateString('cs-CZ')}`,
                        inline: true
                    }
                );

            // Přidej další info pro vlastní profil
            if (isOwnProfile) {
                const now = new Date();
                let cooldowns = [];
                
                if (user.lastDaily) {
                    const nextDaily = new Date(user.lastDaily);
                    nextDaily.setHours(nextDaily.getHours() + 24);
                    if (now < nextDaily) {
                        const hoursLeft = Math.ceil((nextDaily - now) / (1000 * 60 * 60));
                        cooldowns.push(`Daily: ${hoursLeft}h`);
                    } else {
                        cooldowns.push('Daily: ✅ dostupný');
                    }
                }
                
                if (user.lastWork) {
                    const nextWork = new Date(user.lastWork);
                    nextWork.setHours(nextWork.getHours() + 1);
                    if (now < nextWork) {
                        const minutesLeft = Math.ceil((nextWork - now) / (1000 * 60));
                        cooldowns.push(`Work: ${minutesLeft}m`);
                    } else {
                        cooldowns.push('Work: ✅ dostupný');
                    }
                }
                
                if (cooldowns.length > 0) {
                    embed.addFields({
                        name: '⏰ Cooldowny',
                        value: cooldowns.join('\n'),
                        inline: false
                    });
                }
                
                embed.setFooter({ 
                    text: '💡 Tip: Používej !daily a !work pro pravidelný příjem!' 
                });
            } else {
                embed.setFooter({ 
                    text: `Požádal ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                });
            }

            embed.setTimestamp();
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Chyba při zobrazování profilu:', error);
            message.reply('❌ Došlo k chybě při načítání profilu.');
        }
    },
};