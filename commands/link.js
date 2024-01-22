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
        const member = interaction.member

        // Defer to indicate processing
        await interaction.deferReply({ ephemeral: true });

        // Verify permission
        const required_role_id = await db.get(`${interaction.guild.id}.config.required_role`)
        if (required_role_id == null || member.roles.cache.has(required_role_id))
            await this.link(interaction, member, username);
        else
            await interaction.followUp({ content: ":x: You don't have the role required to link your account." })

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
                const client = interaction.client
                client.justUpdatedNickname.set(memberToLink.id, true);
                setTimeout(() => {
                    client.justUpdatedNickname.set(memberToLink.id, false)
                }, 500)
                await memberToLink.setNickname(username, "Linked").catch(err => {
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