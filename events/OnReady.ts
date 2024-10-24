import { Events } from "discord.js";

export default {

    once: true,
    name: Events.ClientReady,

    async execute(): Promise<void> {
        console.log('Bot has started!')
    }

}