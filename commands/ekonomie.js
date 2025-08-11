const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'eko',
        aliases: ['eco', 'economy', 'e'],
        description: 'Zobrazí nápovědu pro ekonomický systém',
        category: 'Ekonomie',
        usage: ''
    },
    execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('💰 Ekonomický systém - Nápověda')
            .setDescription('**Vítej ve světě virtuální ekonomiky!** 🎮\n\nZačínáš s **1,000 penězi** a můžeš se stát nejbohatším na serveru!')
            .addFields(
                {
                    name: '💳 **Základní příkazy**',
                    value: '`!balance` - Zobrazí tvůj zůstatek\n`!profile` - Tvůj profil a statistiky\n`!leaderboard` - Žebříček nejbohatších',
                    inline: false
                },
                {
                    name: '💰 **Příjmy**',
                    value: '`!daily` - Denní bonus (každých 24h)\n`!work` - Jdi do práce (každou hodinu)\n`!job <název>` - Změň povolání',
                    inline: false
                },
                {
                    name: '🎰 **Gambling**',
                    value: '`!slots <částka>` - Automaty (min. 10)\n`!coinflip <částka> <h/o>` - Házení mincí\n`!dice <částka>` - Kostky',
                    inline: false
                },
                {
                    name: '🏦 **Banka**',
                    value: '`!deposit <částka>` - Vlož peníze do banky\n`!withdraw <částka>` - Vyber peníze z banky\n`!transfer <@uživatel> <částka>` - Pošli peníze',
                    inline: false
                },
                {
                    name: '🛒 **Obchod a investice**',
                    value: '`!shop` - Obchod s předměty\n`!buy <předmět>` - Kup předmět\n`!inventory` - Tvůj inventář\n`!invest` - Investiční možnosti',
                    inline: false
                },
                {
                    name: '🎯 **Další aktivity**',
                    value: '`!rob <@uživatel>` - Pokus o krádež\n`!history` - Historie transakcí\n`!jobs` - Seznam povolání',
                    inline: false
                }
            )
            .setFooter({ text: '💡 Tip: Používej banku pro bezpečné uložení peněz!' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};