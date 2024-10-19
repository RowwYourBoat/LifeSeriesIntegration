import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import server from './api/listener';
import config from './config.json';

import fs from "node:fs";
import path from "node:path";

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers ], partials: [ Partials.GuildMember ] });

class Index {

    public commands: Collection<string, any>;

    constructor() {
        this.commands = new Collection();
    }

}

// --------------------------- Event Initialization -------------------------- \\

const eventsDir = path.join(__dirname, 'events');
const eventsFolder = fs.readdirSync(eventsDir).filter(file => file.endsWith('js'));

for (let file of eventsFolder) {
    const eventPath = path.join(eventsDir, file);
    const event = require(eventPath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

// --------------------------- Command Initialization -------------------------- \\

const commandsDir = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(commandsDir).filter(file => file.endsWith('js'));

for (let file of commandFolder) {
    const commandPath = path.join(commandsDir, file);
    const cmd = require(commandPath);
    if ('data' in cmd && 'execute' in cmd) {
        new Index().commands.set(cmd.data.name, cmd);
    } else {
        console.warn(`The command at ${commandPath} is incomplete!`);
    }
}

server.start(client);

client.login(config.production_env.token);