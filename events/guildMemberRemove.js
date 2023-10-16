const { Events } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    once: false,
    name: Events.GuildMemberRemove,
    async execute(guildMember) {
        const guildId = guildMember.guild.id;
        const members = await db.get(`${guildId}.members`);
        await db.set(`${guildId}.members`, members.filter(member => member.id !== guildMember.id));
    }
}