const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Returns a link to the help page.'),
    async execute(interaction) {
        interaction.reply({ content: 'https://github.com/RowwYourBoat/LimitedLifeIntegration/blob/master/README.md', ephemeral: true })
    }
}