const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

// Definice předmětů v obchodě
const SHOP_ITEMS = {
    'lopata': {
        name: 'Lopata',
        price: 500,
        emoji: '🪓',
        type: 'tool',
        description: 'Zvýšuje výdělek z práce o 10%',
        effect: 'work_bonus_10'
    },
    'sekera': {
        name: 'Sekera',
        price: 800,
        emoji: '🪓',
        type: 'tool',
        description: 'Zvýšuje výdělek z práce o 15%',
        effect: 'work_bonus_15'
    },
    'auto': {
        name: 'Auto',
        price: 5000,
        emoji: '🚗',
        type: 'luxury',
        description: 'Luxusní předmět pro prestiž',
        effect: 'prestige'
    },
    'telefon': {
        name: 'Telefon',
        price: 1200,
        emoji: '📱',
        type: 'tool',
        description: 'Snižuje cooldown pro work o 10 minut',
        effect: 'work_cooldown_reduction'
    },
    'hodinky': {
        name: 'Hodinky',
        price: 2500,
        emoji: '⌚',
        type: 'luxury',
        description: 'Luxusní hodinky pro styl',
        effect: 'prestige'
    },
    'laptop': {
        name: 'Laptop',
        price: 3500,
        emoji: '💻',
        type: 'tool',
        description: 'Umožňuje vzdálenou práci s bonusem',
        effect: 'remote_work'
    },
    'diamant': {
        name: 'Diamant',
        price: 10000,
        emoji: '💎',
        type: 'collectible',
        description: 'Vzácný sběratelský předmět',
        effect: 'rare_collectible'
    },
    'zlato': {
        name: 'Zlatá cihla',
        price: 7500,
        emoji: '🧱',
        type: 'collectible',
        description: 'Investiční zlatá cihla',
        effect: 'investment'
    }
};

module.exports = {
    data: {
        name: 'shop',
        aliases: ['obchod', 'buy', 'koupit'],
        description: 'Zobrazí obchod nebo koupí předmět',
        category: 'Ekonomie',
        usage: '[název_předmětu]'
    },
    async execute(message, args) {
        try {
            if (!args[0]) {
                // Zobraz obchod
                const embed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('🏪 Obchod')
                    .setDescription('**Vítej v obchodě!** Zde si můžeš koupit užitečné předměty.\n\nPoužij `!shop <název>` pro nákup.')
                    .setTimestamp();

                // Rozdel předměty podle kategorií
                const tools = [];
                const luxury = [];
                const collectibles = [];

                Object.entries(SHOP_ITEMS).forEach(([key, item]) => {
                    const itemText = `${item.emoji} **${item.name}** - ${item.price.toLocaleString('cs-CZ')} Kč\n*${item.description}*`;
                    
                    if (item.type === 'tool') tools.push(itemText);
                    else if (item.type === 'luxury') luxury.push(itemText);
                    else if (item.type === 'collectible') collectibles.push(itemText);
                });

                if (tools.length > 0) {
                    embed.addFields({
                        name: '🔧 Nástroje',
                        value: tools.join('\n\n'),
                        inline: false
                    });
                }

                if (luxury.length > 0) {
                    embed.addFields({
                        name: '✨ Luxus',
                        value: luxury.join('\n\n'),
                        inline: false
                    });
                }

                if (collectibles.length > 0) {
                    embed.addFields({
                        name: '💎 Sběratelské',
                        value: collectibles.join('\n\n'),
                        inline: false
                    });
                }

                embed.setFooter({ text: '💰 Všechny ceny jsou v hotovosti' });
                return message.reply({ embeds: [embed] });
            }

            // Koupě předmětu
            const itemKey = args[0].toLowerCase();
            const item = SHOP_ITEMS[itemKey];

            if (!item) {
                return message.reply('❌ Tento předmět není v obchodě! Použij `!shop` pro zobrazení dostupných předmětů.');
            }

            const user = await economyService.getOrCreateUser(message.author.id, message.author.username);
            const userMoney = parseFloat(user.money);

            if (userMoney < item.price) {
                return message.reply(`❌ Nemáš dostatek peněz! Potřebuješ ${item.price.toLocaleString('cs-CZ')} Kč, ale máš pouze ${userMoney.toLocaleString('cs-CZ')} Kč.`);
            }

            // Zkontroluj, jestli už předmět nemá (pro některé předměty)
            const hasItem = await economyService.hasInventoryItem(message.author.id, item.name);
            if (hasItem && ['auto', 'laptop', 'telefon'].includes(itemKey)) {
                return message.reply(`❌ Už máš ${item.name}! Jeden kus ti stačí.`);
            }

            // Proveď nákup
            await economyService.updateUserMoney(message.author.id, item.price.toString(), 'subtract');
            await economyService.addInventoryItem(message.author.id, item.name, item.type, item.price);
            await economyService.addTransaction(message.author.id, 'buy', (-item.price).toString(), `Koupě: ${item.name}`);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🛒 Nákup dokončen!')
                .setDescription(`**Úspěšně jsi koupil ${item.emoji} ${item.name}!** 🎉`)
                .addFields(
                    {
                        name: '💰 Cena',
                        value: `${item.price.toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '💳 Nový zůstatek',
                        value: `${(userMoney - item.price).toLocaleString('cs-CZ')} Kč`,
                        inline: true
                    },
                    {
                        name: '📝 Popis',
                        value: item.description,
                        inline: false
                    }
                )
                .setFooter({ text: '📦 Předmět byl přidán do tvého inventáře!' })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Chyba v obchodě:', error);
            message.reply('❌ Došlo k chybě v obchodě.');
        }
    },
};