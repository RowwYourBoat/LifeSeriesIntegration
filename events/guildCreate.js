const { Events, PermissionsBitField } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    once: false,
    name: Events.GuildCreate,
    async execute(guild) {

        if (!guild.available) {
            console.warn('A guild was registered as unavailable.');
            return;
        }

        console.log(`Creating roles for guild ${guild.id}!`);
        const roleManager = guild.roles;
        const dark_green_role = await roleManager.create({ name: 'Dark Green', color: '#009703', hoist: true, mentionable: false, permissions: [], reason: 'Life Series Integration Setup' }).catch(err => console.log(err));
        const green_role = await roleManager.create({ name: 'Green', color: '#00F605', hoist: true, mentionable: false, permissions: [], reason: 'Life Series Integration Setup' }).catch(err => console.log(err));
        const yellow_role = await roleManager.create({ name: 'Yellow', color: '#F6F900', hoist: true, mentionable: false, permissions: [], reason: 'Life Series Integration Setup' }).catch(err => console.log(err));
        const red_role = await roleManager.create({ name: 'Red', color: '#F10000', hoist: true, mentionable: false, permissions: [], reason: 'Life Series Integration Setup' }).catch(err => console.log(err));
        const gray_role = await roleManager.create({ name: 'Gray', color: '#8C8C8C', hoist: true, mentionable: false, permissions: [], reason: 'Life Series Integration Setup' }).catch(err => console.log(err));

        const change_nickname_role = await roleManager.create({ name: 'Change Nickname', hoist: false, mentionable: false, permissions: PermissionsBitField.Flags.ChangeNickname, reason: 'Life Series Integration Setup' }).catch(err => console.log(err));
        const everyone_role = roleManager.everyone;

        console.log(`Adding guild ${guild.id} to the database!`);
        await db.set(guild.id,

            {
                "auth": null, // WILL BE SET AFTER THE FIRST API INTERACTION
                "members": [
                    // PLAYERS WHO'VE LINKED THEIR ACCOUNT
                ],
                "roles": {
                    "dark_green": dark_green_role.id,
                    "green": green_role.id,
                    "yellow": yellow_role.id,
                    "red": red_role.id,
                    "gray": gray_role.id,
                    "change_nickname": change_nickname_role.id,
                    "everyone": everyone_role.id
                },
                "config": {
                    "set_nickname": false
                }
            }

        );

        console.log(`A new guild has successfully been added to the database!\nName: ${guild.name}\nID: ${guild.id}`);

    }
}