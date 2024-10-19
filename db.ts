import mariadb from 'mariadb';
import {database} from './config.json'
import {Client, Guild, GuildMember} from "discord.js";

const pool = mariadb.createPool({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.use
})

const doQuery = async (query: string, options?: [...any]) => {
    try {
        const rows = await pool.query(query, options);
        console.log(rows); // for debugging
        return rows;
    } catch (e) {
        console.error(e)
        return null;
    }
}

export type RoleColours = "dark_green" | "green" | "yellow" | "red" | "gray";

export class GuildAccessor {

    guild_id: string
    auth!: string | null
    dark_green!: string
    green!: string
    yellow!: string
    red!: string
    gray!: string
    members!: { member_id: string, guild_id: string, minecraft_uuid: string, colour: string }[]

    constructor(id: string) {
        this.guild_id = id;
    }

    async init(): Promise<boolean> {

        try {

            const guild_rows: { id: string, auth: string, dark_green: string, green: string, yellow: string, red: string, gray: string }[]
                = await doQuery("SELECT * FROM guilds WHERE id = (?)", [this.guild_id])

            if (guild_rows.length == 0) return false;

            this.auth = guild_rows[0].auth
            this.dark_green = guild_rows[0].dark_green
            this.green = guild_rows[0].green
            this.yellow = guild_rows[0].yellow
            this.red = guild_rows[0].red
            this.gray = guild_rows[0].gray

            const member_rows: { member_id: string, guild_id: string, minecraft_uuid: string, colour: string }[]
                = await doQuery("SELECT * FROM members WHERE guild_id = (?)", [this.guild_id])

            for (const member of member_rows) {
                this.members.push(member)
            }

        } catch (e) {
            console.error(e)
        }

        return false;

    }

    async updateAuthKey(auth: string): Promise<string|void> {

        let rows: [{'auth': string}] =
            await doQuery(`UPDATE guilds SET auth = (?) WHERE id = (?)`, [auth, this.guild_id]);
        if (!rows) return;
        return rows[0].auth;

    }

    async add(role_ids: Map<string, string>): Promise<void> {

        const rows =
            await doQuery("INSERT INTO guilds (id STRING AS UUID, dark_green, green, yellow, red, gray) VALUES (?, ?, ?, ?, ?, ?)", [
                this.guild_id,
                role_ids.get("dark_green"),
                role_ids.get("green"),
                role_ids.get("yellow"),
                role_ids.get("red"),
                role_ids.get("gray")
            ]);
        if (!rows) return;

    }

    async getMember(member_id: string): Promise<MemberAccessor | void> {

        const member = this.members.find(m => {
            return m.guild_id == this.guild_id && m.member_id == member_id
        })
        if (!member) return;
        return new MemberAccessor(this, member)

    }

    async getMemberByUUID(minecraft_uuid: string): Promise<MemberAccessor | void> {

        const member = this.members.find(m => {
            return m.guild_id == this.guild_id && m.minecraft_uuid == minecraft_uuid
        })

        if (!member) return;
        return new MemberAccessor(this, member)

    }

}

export class MemberAccessor {

    id: string
    guild_id: string
    minecraft_uuid: string
    colour: string

    guild_accessor: GuildAccessor
    guild_member?: GuildMember
    guild?: Guild

    constructor(guildAccessor: GuildAccessor, member: { member_id: string, guild_id: string, minecraft_uuid: string, colour: string }) {

        this.guild_accessor = guildAccessor;
        this.id = member.member_id;
        this.guild_id = member.guild_id;
        this.minecraft_uuid = member.minecraft_uuid;
        this.colour = member.colour;

    }

    async getGuildMember(client: Client): Promise<GuildMember | void> {

        const guild: Guild = await client.guilds.fetch(this.guild_id);
        if (!guild) return;
        this.guild = guild;

        this.guild_member = await guild.members.fetch(this.id);
        return this.guild_member;

    }

    async setColour(newColour: RoleColours) {

        if (!this.guild_member) return;

        await this.guild_member.roles.remove(this.colour);
        await this.guild_member.roles.add(this.guild_accessor[newColour])

        doQuery("UPDATE members SET colour = (?) WHERE guild_id = (?) AND member_id = (?)", [newColour, this.guild_id, this.id])

    }

}