import {Events, GuildMember} from "discord.js";
import { GuildAccessor } from '../db';
import { JustUpdatedNickname } from "../Util";

export default {

    once: false,
    name: Events.GuildMemberUpdate,

    async execute(oldMember: GuildMember, newMember: GuildMember): Promise<void> {

        if (JustUpdatedNickname.list.get(newMember.id)) return;

        const guildId = oldMember.guild.id;
        const oldNickname = oldMember.nickname

        const guildAccessor = new GuildAccessor(guildId);
        await guildAccessor.isReady;

        if (guildAccessor.allow_nickname_changes) return;
        if (oldMember.nickname === newMember.nickname) return;

        JustUpdatedNickname.list.set(newMember.id, true);
        setTimeout(() => {
            JustUpdatedNickname.list.set(newMember.id, false)
        }, 500)
        await newMember.setNickname(oldNickname, "Not Allowed").catch(err => console.log(err))

    }

}