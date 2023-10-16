const { Client, GatewayIntentBits, Collection } = require('discord.js');
const server = require('./api/server.js')
const config = require('./config.json');

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers ] });

const fs = require('node:fs');
const path = require('node:path');

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

client.commands = new Collection();

for (let file of commandFolder) {
    const commandPath = path.join(commandsDir, file);
    const cmd = require(commandPath);
    if ('data' in cmd && 'execute' in cmd) {
        client.commands.set(cmd.data.name, cmd);
    } else {
        console.warn(`The command at ${commandPath} is incomplete!`);
    }
}

server.start(client);

client.login(config.token);