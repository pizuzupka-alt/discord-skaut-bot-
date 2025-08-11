const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logger.info(`Připraven! Přihlášen jako ${client.user.tag}`);
        logger.info(`Bot je na ${client.guilds.cache.size} serverech`);
        logger.info(`Slouží ${client.users.cache.size} uživatelům`);
        
        // Set bot presence
        const { presence } = client.config;
        try {
            await client.user.setPresence({
                status: presence.status,
                activities: presence.activities.map(activity => ({
                    name: activity.name,
                    type: ActivityType[Object.keys(ActivityType)[activity.type]] || ActivityType.Playing
                }))
            });
            logger.info('Přítomnost bota nastavená úspěšně');
        } catch (error) {
            logger.error('Chyba při nastavení přítomnosti bota:', error);
        }
        
        // Log some basic stats every hour
        setInterval(() => {
            logger.info(`Statistiky bota - Servery: ${client.guilds.cache.size}, Uživatelé: ${client.users.cache.size}, Čas běhu: ${Math.floor(client.uptime / 1000 / 60)} minut`);
        }, 60 * 60 * 1000);
    }
};
