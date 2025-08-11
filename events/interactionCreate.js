const { Events } = require('discord.js');
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.replied || interaction.deferred) return;
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`[ERROR] Slash příkaz ${interaction.commandName} nebyl nalezen.`);
            return;
        }

        // Spustíme jen příkazy označené jako "slash"
        if (!command.slash) return;

        try {
            await command.execute(interaction);
            console.log(`[INFO] Vykonán slash příkaz: ${interaction.commandName} od ${interaction.user.tag}`);
        } catch (error) {
            console.error(`[ERROR] Chyba při vykonávání slash příkazu ${interaction.commandName}:`, error);
            const errorMessage = 'Nastala chyba při vykonávání tohoto příkazu!';
            try {
                if (interaction.replied) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (followUpError) {
                console.error('[ERROR] Nelze odpovědět na interakci:', followUpError);
            }
        }
    },
};
