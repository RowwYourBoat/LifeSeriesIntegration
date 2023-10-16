const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const guildCreate = require('../events/guildCreate.js');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Clears all data related to your Discord Server from the bot\'s database.')
        .setDMPermission(false)
        .addBooleanOption(option =>
            option
                .setName('reform')
                .setDescription('Whether the bot should initialize setup again after finishing the purge.')
                .setRequired(true),
        )
        .setDefaultMemberPermissions(8), // Administrator permissions required

    async execute(interaction) {
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        // Delete all roles created by the bot
        await interaction.followUp({ content: ':warning: Deleting related roles..' });
        const roleIds = await db.get(`${guildId}.roles`)
        for (let roleIdsKey in roleIds) await interaction.guild.roles.delete(roleIds[roleIdsKey]).catch(err => console.warn(err));

        // Clear data
        await interaction.followUp({ content: ':warning: Clearing data..', ephemeral: true });
        await db.delete(guildId);
        await interaction.followUp({ content: ':warning: All data has been cleared. There\'s no turning back now!', ephemeral: true });

        // Execute setup if requested
        const reform = interaction.options.getBoolean('reform');
        if (reform) {
            await interaction.followUp({ content: ':warning: Setting up your server..', ephemeral: true });
            await guildCreate.execute(interaction.guild);
            await interaction.followUp({ content: ':white_check_mark: The bot is ready to be used again!', ephemeral: true });
        }
    }
}