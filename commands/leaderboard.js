const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'leaderboard',
        aliases: ['top', 'žebříček', 'zebricek', 'lb'],
        description: 'Zobrazí žebříček nejbohatších uživatelů',
        category: 'Ekonomie',
        usage: ''
    },
    async execute(message, args) {
        try {
            const topUsers = await economyService.getLeaderboard(10);
            
            if (topUsers.length === 0) {
                return message.reply('❌ V žebříčku zatím nejsou žádní uživatelé.');
            }

            let description = '';
            const medals = ['🥇', '🥈', '🥉'];
            
            topUsers.forEach((user, index) => {
                const totalWealth = parseFloat(user.money) + parseFloat(user.bank);
                const medal = index < 3 ? medals[index] : `**${index + 1}.**`;
                description += `${medal} **${user.username}** • ${totalWealth.toLocaleString('cs-CZ')} Kč\n`;
            });

            // Najdi pozici aktuálního uživatele
            const allUsers = await economyService.getLeaderboard(1000); // Získej více uživatelů
            const currentUserIndex = allUsers.findIndex(user => user.id === message.author.id);
            const currentUserRank = currentUserIndex + 1;

            const embed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('🏆 Žebříček nejbohatších')
                .setDescription(description)
                .setFooter({ 
                    text: currentUserRank > 0 ? 
                        `📊 Tvá pozice: ${currentUserRank}. místo` : 
                        '💡 Začni hrát a objevíš se na žebříčku!'
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při načítání žebříčku:', error);
            message.reply('❌ Došlo k chybě při načítání žebříčku.');
        }
    },
};