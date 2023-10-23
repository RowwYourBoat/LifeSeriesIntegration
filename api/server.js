const { QuickDB } = require("quick.db");
const db = new QuickDB();

const express = require('express');
const {Collection} = require("discord.js");
const app = express();

let client;

app.use( express.json() );

app.post('/api/:guildId', async (req, res) => {

    const authKey = req.header('authorization');
    const guildId = req.params.guildId;
    console.log(` \n### NEW REQUEST ###\nGuild ID: ${guildId}`)

    // Verify whether guild exists within database
    if (!await db.has(`${guildId}`)) {
        res.status(404).send('NOT FOUND — This most likely means that you haven\'t added the integration bot to your Discord server. FOLLOW THE GUIDE!');
        return;
    }

    // Verify authorization
    if (!await isAuthorized(guildId, authKey)) {
        res.status(401).send('UNAUTHORIZED — Run the command \'/purge reform:true\' to reset your access key.');

        return;
    }

    // Rate limiting (max 1 request per second per auth key)
    if (isRateLimited(authKey)) {
        res.status(429).send('TOO MANY REQUESTS — You\'re being rate limited. Try again in 5 seconds.');
        return;
    }

    // Verify whether body is sufficient
    const body = req.body;
    if (!Object.keys(body).includes('uuid')) {
        res.status(400).send('BAD REQUEST — Missing \'uuid\' property.');
        return;
    } else if (!Object.keys(body).includes('colour')) {
        res.status(400).send('BAD REQUEST — Missing \'colour\' property.');
        return;
    }

    // Update role
    updateRole(res, guildId, body.uuid, body.colour);

});

async function updateRole(res, guildId, uuid, newColour) {

    const guild = await client.guilds.fetch(guildId);
    const members = await db.get(`${guildId}.members`);
    const roles = await db.get(`${guildId}.roles`);
    console.log(`Guild Name: ${guild.name}`)
    console.log(`Player UUID: ${uuid}`)
    console.log(`New Role Colour: ${newColour}`)
    console.log(`Timestamp: ${new Date()}`)
    console.log(`### END OF REQUEST ###\n `)

    // Verify whether matching member exists within database
    const memberData = members.filter(member => member.uuid === uuid);
    if (Object.entries(memberData).length === 0) {
        res.status(404).send(`NOT FOUND — Couldn\'t find Discord member with uuid matching ${uuid}.`);
        return;
    }

    // Verify whether member can be fetched
    const memberToUpdate = await guild.members.fetch(memberData[0].id).catch(err => console.log(err));
    if (!memberToUpdate) {
        res.status(502).send(`BAD GATEWAY — Couldn\'t fetch member of id ${memberData[0]}.`);
        return;
    }

    // Verify whether matching role colour exists within database
    if (!Object.keys(roles).includes(newColour)) {
        res.status(400).send(`BAD REQUEST — Invalid role colour (${newColour}).`);
        return;
    }

    // Verify whether role can be fetched
    const roleToAssign = await guild.roles.fetch(roles[newColour]).catch(err => console.log(err));
    if (!roleToAssign) {
        res.status(502).send(`BAD GATEWAY — Couldn\'t fetch ${newColour} role.`);
        return;
    }

    try {

        // Replace role
        await memberToUpdate.roles.remove(roles[memberData[0].colour]);
        await memberToUpdate.roles.add(roles[newColour]);

        // Update colour in database
        memberData[0].colour = newColour;
        await db.set(`${guildId}.members`, members.filter(member => member.id !== memberData[0].id));
        await db.push(`${guildId}.members`, memberData[0]);

        await res.status(201).send(`Successfully updated discord user ${memberToUpdate.displayName}'s role!`);

    } catch (err) {
        if (err.rawError.code === 50013) {
            await res.status(500).send(`INTERNAL SERVER ERROR — Unable to update ${memberToUpdate.displayName}'s role due to insufficient permissions.
                Please move the bot's role (named Life Series Integration) to where it's ABOVE the coloured roles.`);
        } else {
            await res.status(500).send(`INTERNAL SERVER ERROR — An unexpected error occured while attempting to update ${memberToUpdate.displayName}'s role!`);
        }
    }

}

const requestsInLastSecond = new Collection();
const rateLimited = [];
function isRateLimited(authKey) {

    let currentCount = requestsInLastSecond.get(authKey);
    if (currentCount >= 1) {
        // Block all requests for 5 seconds
        rateLimited.push(authKey);
        requestsInLastSecond.set(authKey, 0);
        setTimeout(() => rateLimited.splice(rateLimited.indexOf(authKey), 1), 5000);
        return true;
    } else if (rateLimited.includes(authKey))
        return true;
    else if (!currentCount)
        currentCount = 0;

    // Keep count of amount of requests in the last second
    const newCount = currentCount + 1;
    requestsInLastSecond.set(authKey, newCount);
    setTimeout(() => requestsInLastSecond.set(authKey, newCount - 1), 1000);

}

async function isAuthorized(guildId, requestAuthKey) {
    if (!requestAuthKey)
        return false;

    const storedAuthKey = await db.get(`${guildId}.auth`);
    if (!storedAuthKey) {
        await db.set(`${guildId}.auth`, requestAuthKey); // Store auth key on first interaction
        return true;
    } else return storedAuthKey === requestAuthKey; // Unauthorize interaction if keys don't match
}

module.exports = {
    start(cl) {
        client = cl;
        app.listen(30336);
        console.log('Express started listening.')
    }
}