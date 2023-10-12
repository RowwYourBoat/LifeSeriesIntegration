const { Events } = require('discord.js');

module.exports = {
    once: false,
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command with the name ${command.name} was found!`)
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.warn(error);
        }
    }
}