const { Events, Collection} = require("discord.js");
const { QuickDB } = require('quick.db')
const db = new QuickDB();

const justUpdated = new Collection();

module.exports = {
    once: false,
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        if (justUpdated.get(newMember.id)) return;

        const guildId = oldMember.guild.id;
        const oldNickname = oldMember.nickname
        const shouldUpdateNickname = await db.get(`${guildId}.config.set_nickname`);

        if (!shouldUpdateNickname) return;
        if (oldMember.nickname === newMember.nickname) return;

        const linkedMembers = await db.get(`${guildId}.members`)
        if (linkedMembers.filter(linkedMember => linkedMember.id === oldMember.id).size === 0) return;
        justUpdated.set(newMember.id, true);
        setTimeout(() => {
            justUpdated.set(newMember.id, false)
        }, 500)
        await newMember.setNickname(oldNickname, "Not Allowed")
    }
}