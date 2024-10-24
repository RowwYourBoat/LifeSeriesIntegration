import {Client, GatewayIntentBits, Partials} from "discord.js";

export class ClientConstructor {

    static client: Client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers ], partials: [ Partials.GuildMember ] });

}