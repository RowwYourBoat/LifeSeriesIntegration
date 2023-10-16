![Discord Integration](https://cdn.discordapp.com/attachments/1131903425123196968/1162355139248672860/discord-banner.png?ex=653ba294&is=65292d94&hm=e7b4f6680e7e12cf239c7acffbd3b14696faff12a43d7e7fe350d7220047ceda&)
<br>
<br>
# Discord Integration Guide
Can't get it to work? Feel free to ask for help in my [Discord Support Server](https://www.discord.gg/phJHjvrdE5)!

1. **Invite the bot to your Discord Server** <br>
    [Click here](https://discord.com/api/oauth2/authorize?client_id=1160212770382430328&permissions=268435456&scope=bot%20applications.commands) to be prompted to do so, and
    select the server to which you want to add the bot. <br>
    Follow the rest of the invitation process until the bot has joined your Discord Server. <br> <br>

2. **Customize the newly added roles** <br>
   Upon joining your server, the bot will immediately create 5 coloured roles. You may change these to your heart's content (name, position, permissions, etc.) – just don't delete them. <br> <br>

3. **Set the Server ID in the plugin's configuration file to your own** <br>
    To get this ID, you will first need to enable Developer Mode in your Discord settings. <br>
    Open your Discord Settings, and navigate to the Advanced page which may be found under the App Settings tab. <br>
    Enable Developer Mode, exit out of your settings, and right-click your Discord Server's icon on the left. <br>
    A new button should've appeared, appropriately named "Copy Server ID". Click that to copy your Server ID. <br>
    
    Now that you've retrieved your Server ID, navigate to the plugin's config.yml file. (server\plugins\LimitedLife\config.yml) <br>
    Scroll down until you stumble across the `discord-integration` section. Here, you must set the `server-id` value to the Server ID you copied earlier.
    Also make sure to set the `enabled` value to `true`. <br> <br>

4. **Link your Discord profile to your Minecraft account** <br>
   Run the command `/link username:YOUR_MINECRAFT_USERNAME` in your Discord server. This will give you the green coloured role,
   which will be updated (if necessary) next time you start the timer within your Minecraft Server. <br> <br>

5. **Test whether it's working** <br>
   Start your Minecraft Server as well as the plugin's timer. Now you may simply use the `/lf modifytime` command until the colour of your name changes (Example: `/lf modifytime PLAYER -10h`).
   If your role doesn't get updated, please check the server's console for any error messages. Can't get it to work? Join my [Discord Support Server](https://www.discord.gg/phJHjvrdE5)! <br> <br>

## Command Documentation
The bot features a total of eight commands, two of which only accessible to members with the `Time out members` permission and one to members with the `Administrator` permission. <br>

- **/link *username*** <br>
  Links the executor's Discord ID to the specified Minecraft Account's UUID.

- **/unlink** <br>
  Unlinks the executor from their linked Minecraft Account's UUID.

- **/ping** <br>
  The bot will respond with "Pong!".

- **/get_member *username*** <br>
  Returns the Discord account with which the specified Minecraft username is currently linked.

- **/get_username *member*** <br>
  Returns the Minecraft account with which the specified Server Member is currently linked.

- **/admin link *member* *username*** *(Moderate Members Permission Required)* <br>
  Links the specified Server Member with the specified Minecraft Account's UUID.

- **/admin unlink *member*** *(Moderate Members Permission Required)* <br>
  Unlinks the specified member from their linked Minecraft Account's UUID.

- **/purge *reform?*** *(Administrator Permission Required)* <br>
  Completely wipes all data related to your Discord Server from the bot's database, and deletes all roles created by the bot. <br>
  Want the bot to set itself up from scratch again? Pass in `true` for the reform argument. Pass in `false` if you don't want this. <br> <br>

## Troubleshooting

**UNAUTHORIZED** <br>
Run the `/purge reform:true` command within your Discord Server and try again. <br> <br>

**BAD GATEWAY** <br>
This is an error outside of my and your control, as it's related to Discord's API. You'll simply have to wait for it to be resolved on their end. <br> <br>

**NOT FOUND** <br>
If you get an error stating that you most likely haven't added the integration bot to your server, run the `/purge reform:true` command. The bot most likely failed to setup properly upon joining your server.
Another option is the bot being unable to find the requested UUID within its database. This means that the player to which that UUID belongs didn't `/link` their account. <br> <br>

**Something went wrong while trying to communicate with the integration bot** <br>
Make sure that you haven't edited the `endpoint` configuration value inside of your config.yml file.
If restoring that didn't fix the issue, it most likely means that the bot is currently offline. Please let me know via Discord so that I can fix the issue. <br> <br>

**Discord Integration is set to enabled, but has not been set up correctly** <br>
This means that you haven't set the Guild ID to your own within the config.yml file.
