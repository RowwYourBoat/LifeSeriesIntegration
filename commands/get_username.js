const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const axios = require('axios').default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get_username')
        .setDescription('Returns the Minecraft account with which the specified user is currently linked.')
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('The user of which to return the linked account.')
                .setRequired(true),
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const memberId = interaction.options.getMember('member').id;

        await interaction.deferReply({ ephemeral: true });

        const members = await db.get(`${guildId}.members`);
        let foundMatch = false;
        members.forEach(member => {
            if (member.id === memberId) {
                foundMatch = true;
                axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${member.uuid}`).then(res => {
                    interaction.followUp({ content: `:white_check_mark: That member is linked to the Minecraft account **${res.data.name}**!` })
                    foundMatch = true;
                }).catch(err => console.warn(err))
            }
        })
        if (foundMatch) return;

        await interaction.followUp({ content: `:x: That member isn't linked to a Minecraft account.` })

    }
}