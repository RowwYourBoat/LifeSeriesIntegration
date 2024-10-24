import { GuildAccessor, MemberAccessor, RoleColours } from '../db';
import { Client, GuildMember } from "discord.js";

import express, { Response, Request } from 'express';

const app = express();
app.use( express.json() );

export default class Listener {

    client: Client
    requestsInLastSecondMap: Map<string, number> = new Map();
    rateLimited: string[] = [];

    constructor(client: Client) {
        this.client = client;
        app.post('/life_series_integration/:guildId', this.handleRequest);
        app.get('/', this.redirect)
        app.listen(4444);
        console.log('Express started listening.')
    }

    async redirect(req: Request, res: Response) {
        res.redirect("https://rowfolio.dev")
    }

    async handleRequest(req: Request, res: Response) {

        const usedAuthKey: string | undefined = req.header('authorization');
        const guildId: string | undefined = req.params.guildId;

        const guildAccessor = new GuildAccessor(guildId);
        await guildAccessor.isReady

        // Verify whether guild exists within database
        if (!guildAccessor.exists) {
            res.status(404).send('NOT FOUND — This most likely means that you haven\'t added the integration bot to your Discord server. FOLLOW THE GUIDE!');
            return;
        }

        // Verify authorization
        if (!usedAuthKey || !await this.isAuthorized(guildAccessor, usedAuthKey)) {
            res.status(401).send('UNAUTHORIZED — Run the command \'/purge reform:true\' to reset your access key.');
            return;
        }

        // Rate limiting (max 1 request per second per auth key)
        if (this.isRateLimited(usedAuthKey)) {
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
        this.updateRole(res, body.uuid, body.colour, guildAccessor);

    }

    async updateRole(res: Response, uuid: string, newColourName: RoleColours, guildAccessor: GuildAccessor) {

        // Verify whether matching member exists within database
        const member: MemberAccessor | void = await guildAccessor.getMemberAccessorByUUID(uuid);
        if (!member) {
            res.status(404).send(`NOT FOUND — Couldn\'t find Discord member with uuid matching ${uuid}.`);
            return;
        }

        await member.isReady

        // Verify whether member can be fetched
        const memberToUpdate: GuildMember | void = member.guild_member;
        if (!memberToUpdate) {
            res.status(502).send(`BAD GATEWAY — Couldn\'t fetch member of id ${member.id}.`);
            return;
        }

        // Verify whether matching role colour exists within database
        if (guildAccessor[newColourName]) {
            res.status(400).send(`BAD REQUEST — Invalid role colour (${newColourName}).`);
            return;
        }

        const roleToAssign = await member.guild_accessor.discord_guild.roles.fetch(guildAccessor[newColourName]).catch(err => console.log(err));
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

    isRateLimited(authKey: string) {

        let currentCount = this.requestsInLastSecondMap.get(authKey);
        if (currentCount && currentCount >= 1) {
            // Block all requests for 5 seconds
            this.rateLimited.push(authKey);
            this.requestsInLastSecondMap.set(authKey, 0);
            setTimeout(() => this.rateLimited.splice(this.rateLimited.indexOf(authKey), 1), 5000);
            return true;
        } else if (this.rateLimited.includes(authKey))
            return true;
        else if (!currentCount)
            currentCount = 0;

        // Keep count of amount of requests in the last second
        const newCount = currentCount + 1;
        this.requestsInLastSecondMap.set(authKey, newCount);
        setTimeout(() => this.requestsInLastSecondMap.set(authKey, newCount - 1), 1000);

    }

    async isAuthorized(guildAccessor: GuildAccessor, requestAuthKey: string) {

        if (!requestAuthKey)
            return false;

        if (!guildAccessor.auth) {
            await guildAccessor.updateAuthKey(requestAuthKey) // Store auth key on first interaction
            return true;
        } else return guildAccessor.auth === requestAuthKey; // Unauthorize interaction if keys don't match

    }

}