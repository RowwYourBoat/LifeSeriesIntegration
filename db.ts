import mariadb from 'mariadb';
import { database } from './config.json'
import { Guild, GuildMember } from "discord.js";
import { ClientConstructor } from "./ClientConstructor";

const pool = mariadb.createPool({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.use
})

const doQuery = async (query: string, options?: [...any]): Promise<any[] | void> => {
    try {
        const rows = await pool.query(query, options);
        console.log(rows); // for debugging
        return rows;
    } catch (e) {
        console.error(e)
        return;
    }
}

export type RoleColours = "dark_green" | "green" | "yellow" | "red" | "gray";

export type GuildData = {
    id: string,
    auth: string,
    dark_green: string,
    green: string,
    yellow: string,
    red: string,
    gray: string,
    allow_nickname_changes: number,
    required_role: string
}[]

export type MemberData = {
    member_id: string,
    guild_id: string,
    minecraft_uuid: string,
    colour: string
}[]

export class GuildAccessor {

    isReady: Promise<boolean>
    exists!: boolean

    id: string
    auth!: string | null

    dark_green!: string
    green!: string
    yellow!: string
    red!: string
    gray!: string

    allow_nickname_changes!: number // boolean (0-1)
    required_role!: string

    members!: { member_id: string, guild_id: string, minecraft_uuid: string, colour: string }[]

    discord_guild!: Guild

    constructor(id: string) {

        this.id = id;
        this.isReady = new Promise(async (resolve, reject) => {

            try {

                const guild_rows: GuildData | void
                    = await doQuery("SELECT * FROM guilds WHERE id = (?)", [this.id])

                if (!guild_rows || !guild_rows.length) {
                    this.exists = false;
                    return;
                } else
                    this.exists = true;

                this.auth = guild_rows[0].auth
                this.dark_green = guild_rows[0].dark_green
                this.green = guild_rows[0].green
                this.yellow = guild_rows[0].yellow
                this.red = guild_rows[0].red
                this.gray = guild_rows[0].gray
                this.allow_nickname_changes = guild_rows[0].allow_nickname_changes
                this.required_role = guild_rows[0].required_role

                const member_rows: MemberData | void
                    = await doQuery("SELECT * FROM members WHERE guild_id = (?)", [this.id])

                if (!member_rows) return false;

                for (const member of member_rows) {
                    this.members.push(member)
                }

                this.discord_guild = await ClientConstructor.client.guilds.fetch(this.id)

            } catch (e) {
                console.error(e)
                reject("An error occured.")
            }

            resolve(true);

        })

    }

    async updateAuthKey(auth: string): Promise<string|void> {

        const rows: {auth: string}[] | void =
            await doQuery(`UPDATE guilds SET auth = (?) WHERE id = (?)`, [auth, this.id]);
        if (!rows) return;
        return rows[0].auth;

    }

    async add(role_ids: Map<string, string>): Promise<void> {

        await doQuery("INSERT INTO guilds (id STRING AS UUID, dark_green, green, yellow, red, gray) VALUES (?, ?, ?, ?, ?, ?)", [
            this.id,
            role_ids.get("dark_green"),
            role_ids.get("green"),
            role_ids.get("yellow"),
            role_ids.get("red"),
            role_ids.get("gray")
        ]);

    }

    getMemberAccessorById(member_id: string): MemberAccessor | void {

        const member = this.members.find(m => {
            return m.guild_id == this.id && m.member_id == member_id
        })
        if (!member) return;
        return new MemberAccessor(member, this)

    }

    getMemberAccessorByUUID(minecraft_uuid: string): MemberAccessor | void {

        const member = this.members.find(m => {
            return m.guild_id == this.id && m.minecraft_uuid == minecraft_uuid
        })

        if (!member) return;
        return new MemberAccessor(member, this)

    }

}

export class MemberAccessor {

    isReady: Promise<boolean>

    id: string
    minecraft_uuid: string
    colour: string

    guild_accessor: GuildAccessor
    guild_member!: GuildMember

    constructor(member: { member_id: string, guild_id: string, minecraft_uuid: string, colour: string }, guildAccessor: GuildAccessor) {

        this.id = member.member_id;
        this.minecraft_uuid = member.minecraft_uuid;
        this.colour = member.colour;

        this.guild_accessor = guildAccessor;
        this.isReady = new Promise(async (resolve) => {

            this.guild_member = await guildAccessor.discord_guild.members.fetch(this.id);
            resolve(true);

        })

    }

    async setColour(newColour: RoleColours) {

        await this.guild_member.roles.remove(this.colour);
        await this.guild_member.roles.add(this.guild_accessor[newColour])

        doQuery("UPDATE members SET colour = (?) WHERE guild_id = (?) AND member_id = (?)", [newColour, this.guild_accessor.id, this.id])

    }

    async add(): Promise<void> {

        await doQuery("INSERT INTO members VALUES (?, ?, ?, ?)", [
            this.id,
            this.guild_accessor.id,
            this.minecraft_uuid,
            this.colour
        ]);

    }

    async remove() {

        doQuery("DELETE FROM members WHERE member_id = (?) AND guild_id = (?)", [this.id, this.guild_accessor.id])

    }

}