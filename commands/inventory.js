const { EmbedBuilder } = require('discord.js');
const { economyService } = require('../server/economy');

module.exports = {
    data: {
        name: 'inventory',
        aliases: ['inv', 'inventář', 'inventar', 'items'],
        description: 'Zobrazí tvůj inventář s předměty',
        category: 'Ekonomie',
        usage: '[@uživatel]'
    },
    async execute(message, args) {
        try {
            // Pokud je zmíněn uživatel, zobraz jeho inventář, jinak vlastní
            const targetUser = message.mentions.users.first() || message.author;
            const isOwnInventory = targetUser.id === message.author.id;
            
            const items = await economyService.getInventory(targetUser.id);
            
            if (items.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle(`📦 ${isOwnInventory ? 'Tvůj inventář' : `Inventář: ${targetUser.username}`}`)
                    .setDescription(`${isOwnInventory ? 'Tvůj inventář' : 'Inventář tohoto uživatele'} je prázdný! 📦\n\n${isOwnInventory ? 'Navštiv `!shop` pro nákup předmětů.' : ''}`)
                    .setTimestamp();
                
                if (!isOwnInventory) {
                    embed.setFooter({ 
                        text: `Požádal ${message.author.tag}`, 
                        iconURL: message.author.displayAvatarURL() 
                    });
                }
                
                return message.reply({ embeds: [embed] });
            }

            // Spočítej celkovou hodnotu inventáře
            const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.value) * item.quantity), 0);
            
            // Seřaď předměty podle typu a hodnoty
            const sortedItems = items.sort((a, b) => {
                if (a.itemType !== b.itemType) {
                    const typeOrder = { 'tool': 1, 'luxury': 2, 'collectible': 3 };
                    return (typeOrder[a.itemType] || 4) - (typeOrder[b.itemType] || 4);
                }
                return parseFloat(b.value) - parseFloat(a.value);
            });

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📦 ${isOwnInventory ? 'Tvůj inventář' : `Inventář: ${targetUser.username}`}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            // Rozdělení podle kategorií
            const categories = {
                'tool': { name: '🔧 Nástroje', items: [], emoji: '🔧' },
                'luxury': { name: '✨ Luxus', items: [], emoji: '✨' },
                'collectible': { name: '💎 Sběratelské', items: [], emoji: '💎' }
            };

            // Emoji pro různé předměty
            const itemEmojis = {
                'Lopata': '🪓',
                'Sekera': '🪓', 
                'Auto': '🚗',
                'Telefon': '📱',
                'Hodinky': '⌚',
                'Laptop': '💻',
                'Diamant': '💎',
                'Zlatá cihla': '🧱'
            };

            sortedItems.forEach(item => {
                const emoji = itemEmojis[item.itemName] || '📦';
                const quantity = item.quantity > 1 ? ` x${item.quantity}` : '';
                const value = parseFloat(item.value) * item.quantity;
                
                const itemText = `${emoji} **${item.itemName}**${quantity}\n*Hodnota: ${value.toLocaleString('cs-CZ')} Kč*`;
                
                if (categories[item.itemType]) {
                    categories[item.itemType].items.push(itemText);
                }
            });

            // Přidej kategorie do embedu
            Object.values(categories).forEach(category => {
                if (category.items.length > 0) {
                    embed.addFields({
                        name: category.name,
                        value: category.items.join('\n\n'),
                        inline: false
                    });
                }
            });

            embed.addFields({
                name: '📊 Statistiky',
                value: `**Počet předmětů:** ${items.length}\n**Celková hodnota:** ${totalValue.toLocaleString('cs-CZ')} Kč`,
                inline: false
            });

            if (!isOwnInventory) {
                embed.setFooter({ 
                    text: `Požádal ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                });
            } else {
                embed.setFooter({ text: '💡 Tip: Některé předměty poskytují bonusy!' });
            }

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Chyba při zobrazování inventáře:', error);
            message.reply('❌ Došlo k chybě při načítání inventáře.');
        }
    },
};