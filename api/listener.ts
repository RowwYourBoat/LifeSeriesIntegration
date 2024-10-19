import { GuildAccessor, MemberAccessor, RoleColours } from '../db';
import { Client, GuildMember } from "discord.js";

import express, { Response, Request } from 'express';

let client: Client;

const app = express();
app.use( express.json() );

app.post('/api/life_series_integration/:guildId', async (req: Request, res: Response) => {

    const usedAuthKey: string | undefined = req.header('authorization');
    const guildId: string | undefined = req.params.guildId;

    const guildAccessor = new GuildAccessor(guildId);
    const exists = await guildAccessor.init();

    // Verify whether guild exists within database
    if (!exists) {
        res.status(404).send('NOT FOUND — This most likely means that you haven\'t added the integration bot to your Discord server. FOLLOW THE GUIDE!');
        return;
    }

    // Verify authorization
    if (!usedAuthKey || !await isAuthorized(guildAccessor, usedAuthKey)) {
        res.status(401).send('UNAUTHORIZED — Run the command \'/purge reform:true\' to reset your access key.');
        return;
    }

    // Rate limiting (max 1 request per second per auth key)
    if (isRateLimited(usedAuthKey)) {
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
    updateRole(res, body.uuid, body.colour, guildAccessor);

});

async function updateRole(res: Response, uuid: string, newColourName: RoleColours, guildAccessor: GuildAccessor) {

    // Verify whether matching member exists within database
    const member: MemberAccessor | void = await guildAccessor.getMemberByUUID(uuid);
    if (!member) {
        res.status(404).send(`NOT FOUND — Couldn\'t find Discord member with uuid matching ${uuid}.`);
        return;
    }

    // Verify whether member can be fetched
    const memberToUpdate: GuildMember | void = await member.getGuildMember(client);
    if (!memberToUpdate) {
        res.status(502).send(`BAD GATEWAY — Couldn\'t fetch member of id ${member.id}.`);
        return;
    }

    // Verify whether matching role colour exists within database
    if (guildAccessor[newColourName]) {
        res.status(400).send(`BAD REQUEST — Invalid role colour (${newColourName}).`);
        return;
    }

    // Verify whether role can be fetched
    if (!member.guild) return;
    const roleToAssign = await member.guild.roles.fetch(guildAccessor[newColourName]).catch(err => console.log(err));
    if (!roleToAssign) {
        res.status(502).send(`BAD GATEWAY — Couldn\'t fetch ${newColourName} role.`);
        return;
    }

    try {

        // Replace role
        await member.setColour(newColourName)
        res.status(201).send(`Successfully updated discord user ${memberToUpdate.displayName}'s role!`);

    } catch (err: any) {

        if (err.rawError.code === 50013) {
            res.status(500).send(`INTERNAL SERVER ERROR — Unable to update ${memberToUpdate.displayName}'s role due to insufficient permissions.
                Please move the bot's role (named Life Series Integration) to where it's ABOVE the coloured roles.`);
        } else {
            res.status(500).send(`INTERNAL SERVER ERROR — An unexpected error occured while attempting to update ${memberToUpdate.displayName}'s role!`);
        }

    }

}

const requestsInLastSecondMap: Map<string, number> = new Map();
const rateLimited: string[] = [];
function isRateLimited(authKey: string) {

    let currentCount = requestsInLastSecondMap.get(authKey);
    if (currentCount && currentCount >= 1) {
        // Block all requests for 5 seconds
        rateLimited.push(authKey);
        requestsInLastSecondMap.set(authKey, 0);
        setTimeout(() => rateLimited.splice(rateLimited.indexOf(authKey), 1), 5000);
        return true;
    } else if (rateLimited.includes(authKey))
        return true;
    else if (!currentCount)
        currentCount = 0;

    // Keep count of amount of requests in the last second
    const newCount = currentCount + 1;
    requestsInLastSecondMap.set(authKey, newCount);
    setTimeout(() => requestsInLastSecondMap.set(authKey, newCount - 1), 1000);

}

async function isAuthorized(guildAccessor: GuildAccessor, requestAuthKey: string) {

    if (!requestAuthKey)
        return false;

    if (!guildAccessor.auth) {
        await guildAccessor.updateAuthKey(requestAuthKey) // Store auth key on first interaction
        return true;
    } else return guildAccessor.auth === requestAuthKey; // Unauthorize interaction if keys don't match

}

export default {

    start(cl: Client) {
        client = cl;
        app.listen(80);
        console.log('Express started listening.')
    }

}