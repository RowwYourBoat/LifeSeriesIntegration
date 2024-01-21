const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Change configuration settings.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(8) // Administrator permission required
        .addSubcommand(builder =>
            builder
                .setName('set_nickname')
                .setDescription('Whether the Discord Nickname of linked users should be forced to their Minecraft Username.')
                .addBooleanOption(option =>
                    option
                        .setName('value')
                        .setDescription('The new value to set.')
                        .setRequired(true),
                ),
        ),

    async execute(interaction) {

        const guild = interaction.guild;
        await interaction.deferReply({ ephemeral: true });
        if (interaction.options._subcommand === 'set_nickname') {

            const newValue = interaction.options.getBoolean('value');
            const currentValue = await db.get(`${guild.id}.config.set_nickname`);

            if (newValue === currentValue) {
                await interaction.followUp({content: `:x: That configuration option is already set to that value!`}).catch(err => console.log(err))
                return;
            }

            await db.set(`${guild.id}.config.set_nickname`, newValue).then(async () => {

                await interaction.followUp({ content: `:white_check_mark: You've successfully set the configuration value of \`set_nickname\` to \`${newValue}\`!` }).catch(err => console.log(err));

            }).catch(async err => {
                await interaction.followUp({ content: `:x: Something went wrong! Please try again.` }).catch(err => console.log(err));
                console.log(err);
            });

        }

    }
}