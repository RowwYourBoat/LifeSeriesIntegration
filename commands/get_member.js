const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const axios = require('axios').default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get_member')
        .setDescription('Returns the Discord account with which the specified Minecraft username is currently linked.')
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('The username of which to return the linked member.')
                .setRequired(true),
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const username = interaction.options.getString('username');

        await interaction.deferReply({ ephemeral: true });

        const members = await db.get(`${guildId}.members`);
        await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`).then(res => {
            const playerUUID = res.data.id;
            let foundMatch = false;
            members.forEach(member => {
                if (member.uuid === playerUUID) {
                    interaction.followUp({ content: `:white_check_mark: That Minecraft account is linked to <@${member.id}>!` });
                    foundMatch = true;
                }
            })
            if (!foundMatch) interaction.followUp({ content: ':x: That Minecraft account isn\'t linked to anyone.' })
        }).catch(() => {
            interaction.followUp({ content: ':x: Either something went wrong, or that username doesn\'t exist!' });
        });

    }
}