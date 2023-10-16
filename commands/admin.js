const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const {link} = require("./link");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Manage other members.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(1099511627776) // Moderate Members permission required
        .addSubcommand(builder =>
            builder
                .setName('unlink')
                .setDescription('Forcefully unlink members.')
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription('The member to unlink.')
                        .setRequired(true),
                ),
        )
        .addSubcommand(builder =>
            builder
                .setName('link')
                .setDescription('Forcefully link members.')
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription('The member to link.')
                        .setRequired(true),
                ).addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('Their Minecraft username.')
                        .setRequired(true),
                )
        ),

    async execute(interaction) {

        const guildId = interaction.guild.id;
        const user = interaction.options.getUser('member');

        const memberToUnlink = await interaction.guild.members.fetch(user.id);
        const members = await db.get(`${guildId}.members`);

        // Defer to indicate processing
        await interaction.deferReply({ ephemeral: true });
        if (interaction.options._subcommand === 'unlink') {

            // Verify whether member is actually linked
            const filter = members.filter(member => member.id === memberToUnlink.id);
            if (Object.entries(filter).length === 0) {
                await interaction.followUp({content: ':x: That member isn\'t linked to a Minecraft account.'});
                return;
            }

            // Remove member from database
            await db.set(`${guildId}.members`, members.filter(member => member.id !== memberToUnlink.id))
                .then(async () => await interaction.followUp({content: `:white_check_mark: Successfully unlinked <@${memberToUnlink.id}>'s Discord profile!`}))
                .catch(() => interaction.followUp({content: `:x: An error occured.`}));

            // Remove assigned roles related to the bot from member
            interaction.guild.members.fetch(memberToUnlink.id).then(async guildMember => {
                const roles = await db.get(`${guildId}.roles`);
                for (let rolesKey in roles) await guildMember.roles.remove(roles[rolesKey]);
            }).catch(err => console.warn(err));

        } else {

            const username = interaction.options.getString('username');
            await link(interaction, memberToUnlink, username);

        }
    }
}