import {ChatInputCommandInteraction, CommandInteraction, SlashCommandSubcommandBuilder} from "discord.js";

const { SlashCommandBuilder, SlashCommandUserOption } = require('discord.js');
const {link} = require("./link");
import { MemberAccessor } from '../db';

export default {

    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Manage other members.')
        .setDefaultMemberPermissions(1099511627776) // Moderate Members permission required
        .addSubcommand((builder: SlashCommandSubcommandBuilder) =>
            builder
                .setName('unlink')
                .setDescription('Forcefully unlink members.')
                .addUserOption((option: typeof SlashCommandUserOption) =>
                    option
                        .setName('member')
                        .setDescription('The member to unlink.')
                        .setRequired(true),
                ),
        )
        .addSubcommand((builder: SlashCommandSubcommandBuilder) =>
            builder
                .setName('link')
                .setDescription('Forcefully link members.')
                .addUserOption((option: typeof SlashCommandUserOption) =>
                    option
                        .setName('member')
                        .setDescription('The member to link.')
                        .setRequired(true),
                ).addStringOption((option: typeof SlashCommandUserOption) =>
                    option
                        .setName('username')
                        .setDescription('Their Minecraft username.')
                        .setRequired(true),
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) return;

        const guildId = interaction.guild.id;
        const user = interaction.options.getUser('member');

        if (!user) return;

        const memberToUnlink = await interaction.guild.members.fetch(user.id);
        const members = await db.get(`${guildId}.members`);

        // Defer to indicate processing
        await interaction.deferReply({ ephemeral: true });
        if (interaction.options.getSubcommand() === 'unlink') {

            // Verify whether member is actually linked
            const memberAccessor = new MemberAccessor({member_id: memberToUnlink.id, guild_id: memberToUnlink.guild.id})
            if (await memberAccessor.exists()) {
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