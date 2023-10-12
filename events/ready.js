const { Events } = require('discord.js');

module.exports = {
    once: true,
    name: Events.ClientReady,
    async execute() {
        console.log('Ready!')
    }
}