const { Events } = require('discord.js');

// Nastavení prefixu (můžeš změnit)
const PREFIX = '!';

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignoruj zprávy od botů
        if (message.author.bot) return;
        
        // Kontrola jestli zpráva začína prefixem
        if (!message.content.startsWith(PREFIX)) return;
        
        // Rozdělení příkazu a argumentů
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        if (!commandName) return;
        
        // Najdi příkaz
        const command = message.client.commands.get(commandName);
        if (!command) return;
        
        // Kontrola jestli má příkaz prefix support
        if (!command.executePrefix && !command.execute) return;
        
        try {
            // Použij executePrefix pokud existuje, jinak execute
            if (command.executePrefix) {
                await command.executePrefix(message, args);
            } else {
                // Pro kompatibilitu se starými příkazy
                await command.execute(message, args);
            }
            
            console.log(`[INFO] Příkaz ${PREFIX}${commandName} proveden uživatelem ${message.author.username} v ${message.guild?.name || 'DM'}`);
        } catch (error) {
            console.error(`[ERROR] Chyba při vykonávání příkazu ${PREFIX}${commandName}:`, error);
            
            try {
                await message.reply('❌ Nastala chyba při vykonávání tohoto příkazu!');
            } catch (replyError) {
                console.error('[ERROR] Nelze odpovědět na zprávu:', replyError);
            }
        }
    },
};
