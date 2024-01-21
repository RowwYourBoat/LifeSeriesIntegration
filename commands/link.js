const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios').default;
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your Discord with your Minecraft account!')
        .setDMPermission(false)
        .addStringOption( option =>
            option
                .setName('username')
                .setDescription('Your Minecraft Username!')
                .setRequired(true)
        ),
    async execute(interaction) {
        const username = interaction.options.getString('username');

        // Defer to indicate processing
        await interaction.deferReply({ ephemeral: true });
        await this.link(interaction, interaction.member, username);

    },

    async link(interaction, memberToLink, username) {

        await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`).then(async res => {

            const memberId = memberToLink.id;
            const guildId = memberToLink.guild.id;

            const minecraftPlayerUUID = res.data.id;
            const members = await db.get(`${guildId}.members`);

            // Verify whether the member or name isn't already linked
            let terminate = false;
            members.forEach(member => {
                if (member.id === memberId) {
                    interaction.followUp({ content: ':x: Discord profile is already linked to a username.', ephemeral: true });
                    terminate = true;
                } else if (member.uuid === minecraftPlayerUUID) {
                    interaction.followUp({ content: ':x: Username is already linked to a discord profile.', ephemeral: true });
                    terminate = true;
                }
            });
            if (terminate) return;

            // Add member to database
            await db.push(`${guildId}.members`, {
                "id": memberId,
                "uuid": minecraftPlayerUUID,
                "colour": 'green'
            });

            // Add coloured role to member and update nickname
            await memberToLink.roles.add(await db.get(`${guildId}.roles.green`));

            const shouldUpdateNickname = await db.get(`${guildId}.config.set_nickname`);
            if (shouldUpdateNickname) {
                await memberToLink.setNickname(username, "Linked").catch(err => {
                    console.log(err)
                    interaction.followUp( { content: `:x: Your nickname was unable to be changed due to your role(s) being positioned higher than the bot's!`, ephemeral: true })
                });
            }

            await interaction.followUp({ content: `:white_check_mark: Successfully linked Discord profile to the Minecraft account **${username}**!`, ephemeral: true });

        }).catch(err => {

            console.log(err);
            interaction.followUp({ content: ':x: Either something went wrong, or that username doesn\'t exist!' });

        })

    }
}