const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'help',
        description: 'Zobrazuje všechny dostupné příkazy nebo detailní informace o konkrétním příkazu',
        aliases: ['h', 'commands', 'pomoc', 'prikazy'],
        usage: '!help [příkaz]',
        category: 'užitečné'
    },
    async execute(message, args, client) {
        const { prefix } = client.config;
        
        if (!args.length) {
            // Show all commands
            const commands = client.commands;
            const categories = {};
            
            // Group commands by category
            commands.forEach(command => {
                const category = command.data.category || 'Obecné';
                if (!categories[category]) categories[category] = [];
                categories[category].push(command.data.name);
            });
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📚 Nápověda - Dostupné příkazy')
                .setDescription(`Použij \`${prefix}help <příkaz>\` pro detailní informace o příkazu.`)
                .setTimestamp()
                .setFooter({ 
                    text: `Požádal ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            // Add fields for each category
            Object.keys(categories).forEach(category => {
                embed.addFields({
                    name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
                    value: categories[category].map(cmd => `\`${cmd}\``).join(', '),
                    inline: false
                });
            });

            return message.reply({ embeds: [embed] });
        }
        
        // Show specific command info
        const name = args[0].toLowerCase();
        const command = client.commands.get(name) || 
                       client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(name));
        
        if (!command) {
            return message.reply(`❌ Neexistuje příkaz s názvem nebo aliasem \`${name}\``);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📖 Nápověda - ${command.data.name}`)
            .setDescription(command.data.description)
            .addFields(
                { 
                    name: 'Použití', 
                    value: `\`${command.data.usage || `${prefix}${command.data.name}`}\``, 
                    inline: true 
                },
                { 
                    name: 'Kategorie', 
                    value: command.data.category || 'Obecné', 
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Požádal ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL() 
            });

        if (command.data.aliases) {
            embed.addFields({
                name: 'Aliasy',
                value: command.data.aliases.map(alias => `\`${alias}\``).join(', '),
                inline: true
            });
        }

        return message.reply({ embeds: [embed] });
    }
};
