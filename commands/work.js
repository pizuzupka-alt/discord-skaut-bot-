const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'work',
        aliases: ['práce', 'prace', 'job'],
        description: 'Jdi do práce a vydělejte peníze (každou půl hodinu)',
        category: 'Ekonomie',
        usage: ''
    },
    async execute(message, args) {
        try {
            const result = await economyService.work(message.author.id, message.author.username);
            
            if (!result.success) {
                const timeLeft = Math.ceil((result.nextWork - new Date()) / (2000 * 60));
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Už jsi pracoval!')
                    .setDescription(`Další práci můžeš vykonat za **${timeLeft} minut**.`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Různé pracovní aktivity pro zábavu
            const workActivities = [
                'Vyřídil jsi zákazníky v obchodě',
                'Dokončil jsi důležitý projekt',
                'Úspěšně jsi vyřešil problém',
                'Provedl jsi údržbu systému',
                'Obsloužil jsi klienty',
                'Dokončil jsi papírování',
                'Vyčistil jsi pracovní prostor',
                'Pomohl jsi kolegovi s úkolem',
                
            ];
            
            const randomActivity = workActivities[Math.floor(Math.random() * workActivities.length)];
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💼 Práce dokončena!')
                .setDescription(`**${randomActivity}**\n\nZa tvou práci dostáváš **${result.amount.toLocaleString('cs-CZ')} Kč**! 💰`)
                .addFields(
                    {
                        name: '📈 Bonus XP',
                        value: '+5 XP',
                        inline: true
                    },
                    {
                        name: '⏰ Další práce',
                        value: 'Za 30 minut',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Tip: Změň povolání pro vyšší výdělek!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Chyba při práci:', error);
            message.reply('❌ Došlo k chybě při práci.');
        }
    },
};
