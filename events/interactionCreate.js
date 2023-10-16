const { Events, Collection} = require('discord.js');

const inDebounce = new Collection();

module.exports = {
    once: false,
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const memberId = interaction.member.id;
        if (inDebounce.has(memberId)) {
            if ((Date.now() - inDebounce.get(memberId)) < 5000) {
                interaction.reply({ content: ':warning: You\'re on a 5 second cooldown!', ephemeral: true });
                return;
            } else
                inDebounce.set(memberId, Date.now());
        } else
            inDebounce.set(memberId, Date.now());

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