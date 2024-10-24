import {GuildAccessor} from '../db';
import { Events, GuildMember } from "discord.js";

export default {

    once: false,
    name: Events.GuildMemberRemove,

    async execute(member: GuildMember): Promise<void> {

        const guildAccessor = new GuildAccessor(member.guild.id);
        await guildAccessor.isReady;

        const memberAccessor = guildAccessor.getMemberAccessorById(member.id)
        if (!memberAccessor) return;
        memberAccessor.remove();

    }

}