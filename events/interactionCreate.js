console.log("[DEBUG] Načten interactionCreate handler");
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

const logger = require('../utils/logger');
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands (for future expansion)
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                logger.error(`Nebyl nalezen příkaz odpovídající ${interaction.commandName}.`);
                return;
            }
            
            try {
                // Check if command has a slash command handler
                if (command.executeSlash) {
                    await command.executeSlash(interaction, client);
                } else {
                    await interaction.reply({
                        content: 'Tento příkaz je dostupný pouze jako prefixový příkaz.',
                        ephemeral: true
                    });
                }
                
                logger.info(`Slash příkaz ${interaction.commandName} proveden uživatelem ${interaction.user.tag}`);
            } catch (error) {
                logger.error(`Chyba při provádění slash příkazu ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: 'Došlo k chybě při provádění tohoto příkazu!',
                    ephemeral: true
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Handle button interactions (for future expansion)
        if (interaction.isButton()) {
            logger.info(`Interakce s tlačítkem: ${interaction.customId} kliknuto uživatelem ${interaction.user.tag}`);
        }
        
        // Handle select menu interactions (for future expansion)
        if (interaction.isStringSelectMenu()) {
            logger.info(`Interakce s výběrovým menu: ${interaction.customId} použito uživatelem ${interaction.user.tag}`);
        }
    }
};
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ Nastala chyba!', ephemeral: true });
  }
});
