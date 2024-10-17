import mariadb = require('mariadb');
import { database } from './config.json'

const pool = mariadb.createPool({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.use
})

const doQuery = async (query: string, options?: [...any]) => {
    try {
        return await pool.query(query, options);
    } catch (e) {
        console.error(e)
        return null;
    }
}

export default {

    getGuildAuthKey: async function(id: number): Promise<string|void> {

        let rows: [{'auth': string}] =
            await doQuery(`SELECT auth FROM guilds WHERE id = (?)`, [id]);
        if (!rows) return;
        return rows[0].auth;

    },

    getGuildRoleIds: async function(id: number): Promise<{ dark_green: number, green: number, yellow: number, red: number, gray: number } | void> {

        let rows: [{'dark_green': number, 'green': number, 'yellow': number, 'red': number, 'gray': number, }] =
            await doQuery("SELECT dark_green, green, yellow, red, gray FROM guilds WHERE id = (?)", [id]);
        if (!rows) return;
        return rows[0];

    },

    addGuild: async function(id: string, role_ids: Map<string, string>): Promise<void> {

        const rows =
            await doQuery("INSERT INTO guilds (id, dark_green, green, yellow, red, gray) VALUES (?, ?, ?, ?, ?, ?)", [
                id,
                role_ids.get("dark_green"),
                role_ids.get("green"),
                role_ids.get("yellow"),
                role_ids.get("red"),
                role_ids.get("gray")
            ]);
        if (!rows) return;

    },

}