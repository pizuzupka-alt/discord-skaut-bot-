const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'daily',
        aliases: ['denní', 'denni'],
        description: 'Získej denní bonus peněz (každých 24 hodin)',
        category: 'Ekonomie',
        usage: ''
    },
    async execute(message, args) {
        try {
            const result = await economyService.claimDaily(message.author.id, message.author.username);
            
            if (!result.success) {
                const timeLeft = Math.ceil((result.nextDaily - new Date()) / (1000 * 60 * 60));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Denní bonus už byl vybrán!')
                    .setDescription(`Další denní bonus můžeš získat za **${timeLeft} hodin**.`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎁 Denní bonus!')
                .setDescription(`**Gratuluju!** Získal jsi denní bonus ve výši **${result.amount.toLocaleString('cs-CZ')} Kč**! 💰`)
                .addFields(
                    {
                        name: '📈 Bonus XP',
                        value: '+10 XP',
                        inline: true
                    },
                    {
                        name: '⏰ Další bonus',
                        value: 'Za 24 hodin',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Tip: Nezapomeň si každý den vybrat bonus!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při získávání denního bonusu:', error);
            message.reply('❌ Došlo k chybě při získávání denního bonusu.');
        }
    },
};