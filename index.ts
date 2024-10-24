import Listener from "./api/listener";
import config from './config.json';
import { Commands } from "./Util";
import { ClientConstructor } from "./ClientConstructor";

import fs from "node:fs";
import path from "node:path";
import {CommandInteraction, SlashCommandBuilder} from "discord.js";

const client = ClientConstructor.client;

type Event = {
    default: {
        once: boolean,
        name: string,
        execute(...args: any): Promise<void>
    }
}

type Command = {
    default: {
        data: SlashCommandBuilder,
        execute(interaction: CommandInteraction): Promise<void>
    }
}

const eventsDir = path.join(__dirname, 'events');
const eventsFolder = fs.readdirSync(eventsDir).filter(file => file.endsWith('ts'));

const commandsDir = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(commandsDir).filter(file => file.endsWith('ts'));

const init = async ()=> {


    // --------------------------- Event Initialization -------------------------- \\

    for (let file of eventsFolder) {

        const eventPath = path.join(eventsDir, file);
        const event: Event = await import(eventPath)

        if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args))
        } else {
            client.on(event.default.name, (...args) => event.default.execute(...args))
        }

    }

    // --------------------------- Command Initialization ------------------------ \\

    // for (let file of commandFolder) {
    //
    //     const commandPath = path.join(commandsDir, file);
    //     const command: Command = await import(commandPath);
    //
    //     if ('data' in command.default && 'execute' in command.default) {
    //         Commands.list.set(command.default.data.name, command);
    //     } else {
    //         console.warn(`The command at ${commandPath} is incomplete!`);
    //     }
    //
    // }

}

init().then(() => {
    new Listener(client);
    client.login(config.production_env.token)
})