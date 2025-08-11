const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

// Definice dostupných povolání
const AVAILABLE_JOBS = {
    'nezaměstnaný': {
        name: 'Nezaměstnaný',
        minSalary: 30,
        maxSalary: 80,
        requiredLevel: 1,
        description: 'Základní příjem bez specializace'
    },
    'prodavač': {
        name: 'Prodavač',
        minSalary: 60,
        maxSalary: 120,
        requiredLevel: 2,
        description: 'Práce v obchodě s vyšším výdělkem'
    },
    'kuchař': {
        name: 'Kuchař',
        minSalary: 80,
        maxSalary: 150,
        requiredLevel: 5,
        description: 'Vaření v restauraci'
    },
    'mechanik': {
        name: 'Mechanik',
        minSalary: 100,
        maxSalary: 180,
        requiredLevel: 8,
        description: 'Oprava vozidel a strojů'
    },
    'učitel': {
        name: 'Učitel',
        minSalary: 120,
        maxSalary: 200,
        requiredLevel: 12,
        description: 'Vzdělávání mladé generace'
    },
    'lékař': {
        name: 'Lékař',
        minSalary: 180,
        maxSalary: 300,
        requiredLevel: 20,
        description: 'Léčení pacientů'
    },
    'právník': {
        name: 'Právník',
        minSalary: 200,
        maxSalary: 350,
        requiredLevel: 25,
        description: 'Právní poradenství'
    },
    'ceo': {
        name: 'CEO',
        minSalary: 300,
        maxSalary: 500,
        requiredLevel: 35,
        description: 'Řízení velké společnosti'
    }
};

module.exports = {
    data: {
        name: 'jobs',
        aliases: ['job', 'práce', 'prace', 'povolání', 'povolani'],
        description: 'Zobrazí dostupná povolání nebo změní tvé povolání',
        category: 'Ekonomie',
        usage: '[název_povolání]'
    },
    async execute(message, args) {
        try {
            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            
            if (!args[0]) {
                // Zobraz dostupná povolání
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('💼 Dostupná povolání')
                    .setDescription(`**Aktuální povolání:** ${user.job}\n**Tvůj level:** ${user.level}\n\nPoužij \`!jobs <název>\` pro změnu povolání.`)
                    .setTimestamp();

                let jobsList = '';
                Object.entries(AVAILABLE_JOBS).forEach(([key, job]) => {
                    const available = user.level >= job.requiredLevel;
                    const status = available ? '✅' : '❌';
                    const current = user.job === job.name ? ' **(AKTUÁLNÍ)**' : '';
                    
                    jobsList += `${status} **${job.name}**${current}\n`;
                    jobsList += `*Level: ${job.requiredLevel} • Výdělek: ${job.minSalary}-${job.maxSalary} Kč*\n`;
                    jobsList += `*${job.description}*\n\n`;
                });

                embed.addFields({
                    name: '📋 Seznam povolání',
                    value: jobsList,
                    inline: false
                });

                embed.setFooter({ text: '💡 Vyšší level = lepší povolání = vyšší výdělek!' });
                return message.reply({ embeds: [embed] });
            }

            // Změna povolání
            const jobKey = args[0].toLowerCase()
                .replace(/á/g, 'a')
                .replace(/č/g, 'c')
                .replace(/ď/g, 'd')
                .replace(/é/g, 'e')
                .replace(/ě/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ň/g, 'n')
                .replace(/ó/g, 'o')
                .replace(/ř/g, 'r')
                .replace(/š/g, 's')
                .replace(/ť/g, 't')
                .replace(/ú/g, 'u')
                .replace(/ů/g, 'u')
                .replace(/ý/g, 'y')
                .replace(/ž/g, 'z');

            const job = AVAILABLE_JOBS[jobKey];
            
            if (!job) {
                return message.reply('❌ Toto povolání neexistuje! Použij `!jobs` pro zobrazení dostupných povolání.');
            }

            if (user.level < job.requiredLevel) {
                return message.reply(`❌ Pro toto povolání potřebuješ level ${job.requiredLevel}! Aktuálně máš level ${user.level}.`);
            }

            if (user.job === job.name) {
                return message.reply(`❌ Už pracuješ jako ${job.name}!`);
            }

            // Změň povolání
            await economyService.updateUserJob(message.author.id, job.name);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎉 Povolání změněno!')
                .setDescription(`**Gratuluju!** Nyní pracuješ jako **${job.name}**! 💼`)
                .addFields(
                    {
                        name: '💰 Nový výdělek',
                        value: `${job.minSalary}-${job.maxSalary} Kč za práci`,
                        inline: true
                    },
                    {
                        name: '📋 Popis',
                        value: job.description,
                        inline: true
                    },
                    {
                        name: '📈 Požadovaný level',
                        value: `Level ${job.requiredLevel}`,
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Použij !work pro výdělek v novém povolání!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Chyba při správě povolání:', error);
            message.reply('❌ Došlo k chybě při správě povolání.');
        }
    },
};