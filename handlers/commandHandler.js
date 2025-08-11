const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class CommandHandler {
    async loadCommands(client) {
        const commandsPath = path.join(__dirname, '../commands');
        
        try {
            const commandFiles = await fs.readdir(commandsPath);
            const jsFiles = commandFiles.filter(file => file.endsWith('.js'));
            
            for (const file of jsFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    logger.info(`Načten příkaz: ${command.data.name}`);
                } else {
                    logger.warn(`Příkazu v ${filePath} chybí povinná vlastnost "data" nebo "execute"`);
                }
            }
            
            logger.info(`Úspěšně načteno ${client.commands.size} příkazů`);
        } catch (error) {
            logger.error('Chyba při načítání příkazů:', error);
            throw error;
        }
    }

    async handlePrefixCommand(message, client) {
        const { prefix } = client.config;
        
        // Check if message starts with prefix and is not from a bot
        if (!message.content.startsWith(prefix) || message.author.bot) return;
        
        // Parse command and arguments
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Get command from collection
        const command = client.commands.get(commandName) || 
                       client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));
        
        if (!command) return;
        
        try {
            // Check permissions if command has permission requirements
            if (command.data.permissions) {
                const hasPermission = await this.checkPermissions(message, command.data.permissions);
                if (!hasPermission) {
                    return message.reply('❌ Nemáš oprávnění použít tento příkaz!');
                }
            }
            
            // Execute command
            await command.execute(message, args, client);
            logger.info(`Příkaz ${commandName} proveden uživatelem ${message.author.tag} v ${message.guild ? message.guild.name : 'soukromé zprávě'}`);
            
        } catch (error) {
            logger.error(`Chyba při provádění příkazu ${commandName}:`, error);
            
            try {
                await message.reply('❌ Došlo k chybě při provádění tohoto příkazu!');
            } catch (replyError) {
                logger.error('Nepodařilo se odeslat chybovou zprávu:', replyError);
            }
        }
    }

    async checkPermissions(message, requiredPermissions) {
        const { permissions } = message.client.config;
        
        // Owner bypass
        if (permissions.ownerIds.includes(message.author.id)) return true;
        
        // Check if user has required Discord permissions
        if (message.guild && requiredPermissions.discord) {
            const memberPermissions = message.member.permissions;
            for (const permission of requiredPermissions.discord) {
                if (!memberPermissions.has(permission)) return false;
            }
        }
        
        // Check if user has required roles
        if (message.guild && requiredPermissions.roles) {
            const memberRoles = message.member.roles.cache.map(role => role.name);
            const hasRole = requiredPermissions.roles.some(role => memberRoles.includes(role));
            if (!hasRole) return false;
        }
        
        return true;
    }
}

module.exports = new CommandHandler();
