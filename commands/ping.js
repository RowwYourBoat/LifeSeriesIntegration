const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check whether the bot is currently online!'),
    async execute(interaction) {
        interaction.reply({ content: 'Pong!', ephemeral: true })
    }
}