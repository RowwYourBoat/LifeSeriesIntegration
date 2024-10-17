const { Events } = require("discord.js");
const db = require("db");

module.exports = {
    once: false,
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const client = oldMember.client
        if (client.justUpdatedNickname.get(newMember.id)) return;

        const guildId = oldMember.guild.id;
        const oldNickname = oldMember.nickname
        const shouldUpdateNickname = await db.get(`${guildId}.config.set_nickname`);

        if (!shouldUpdateNickname) return;
        if (oldMember.nickname === newMember.nickname) return;

        const linkedMembers = await db.get(`${guildId}.members`)
        if (linkedMembers.filter(linkedMember => linkedMember.id === oldMember.id).size === 0) return;
        client.justUpdatedNickname.set(newMember.id, true);
        setTimeout(() => {
            client.justUpdatedNickname.set(newMember.id, false)
        }, 500)
        await newMember.setNickname(oldNickname, "Not Allowed").catch(err => console.log(err))
    }
}