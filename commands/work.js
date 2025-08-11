const { SlashCommandBuilder } = require('discord.js');
const economy = require('../server/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Pracuj a vyděláváj peníze!'),

    async execute(interaction) {
        try {
            const result = economy.work(interaction.user.id, interaction.user.username);
            await interaction.reply(result.message);
        } catch (error) {
            console.error('Chyba v work příkazu:', error);
            await interaction.reply('❌ Nastala chyba!');
        }
    },
};
