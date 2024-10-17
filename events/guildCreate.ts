import {Events, Guild, HexColorString, Role, RoleManager} from 'discord.js';
import db from '../db';

const createRoles = async (guild: Guild): Promise<Map<string, string> | void> => {

    const rolesToCreate: { name: string, color: HexColorString, under_scored_name: string }[] = [
        { name: 'Dark Green', color: '#009703', under_scored_name: 'dark_green' },
        { name: 'Green', color: '#00F605', under_scored_name: 'green' },
        { name: 'Yellow', color: '#F6F900', under_scored_name: 'yellow' },
        { name: 'Red', color: '#F10000', under_scored_name: 'red' },
        { name: 'Gray', color: '#8C8C8C', under_scored_name: 'gray' }
    ];

    const map: Map<string, string> = new Map();

    const roleManager: RoleManager = guild.roles;
    try {
        for (const role of rolesToCreate) {
            const createdRole: Role = await roleManager.create({ name: role.name, color: role.color, hoist: true, mentionable: false, permissions: [], reason: 'Life Series Integration' });
            map.set(role.under_scored_name, createdRole.id);
        }
    } catch (e) {
        console.log(e);
        return;
    }

    return map;

}

export default {
    once: false,
    name: Events.GuildCreate,
    async execute(guild: Guild) {

        if (!guild.available) {
            console.warn('A guild was returned as unavailable.');
            return;
        }

        console.log(`Creating roles for guild ${guild.id}!`);
        const roles = await createRoles(guild);
        if (!roles) return;

        await db.addGuild(guild.id, roles)
        console.log(`A new guild has successfully been added to the database!\nName: ${guild.name}\nID: ${guild.id}`);

    }
}