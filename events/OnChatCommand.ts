import {Events, GuildMember, Interaction} from "discord.js";
import { Commands } from "../Util";

const inDebounce: Map<string, number> = new Map();

export default {

    once: false,
    name: Events.InteractionCreate,

    async execute(interaction: Interaction): Promise<void> {

        if (!interaction.isChatInputCommand()) return;

        const member = interaction.member;
        if (!(member instanceof GuildMember)) return;

        const memberId = member.id
        if (inDebounce.has(memberId)) {

            const currentDebounce: number | undefined = inDebounce.get(memberId);
            if (!currentDebounce) return;

            if ((Date.now() - currentDebounce) < 5000) {
                interaction.reply({ content: ':warning: You\'re on a 5 second cooldown!', ephemeral: true });
                return;
            } else
                inDebounce.set(memberId, Date.now());

        } else
            inDebounce.set(memberId, Date.now());


        const command = Commands.list.get(interaction.commandName);

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