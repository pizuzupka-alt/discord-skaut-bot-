const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`[INFO] Připraven! Přihlášen jako ${client.user.tag}`);
        console.log(`[INFO] Bot je na ${client.guilds.cache.size} serverech`);
        
        // Spočítání uživatelů
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        console.log(`[INFO] Slouží ${totalUsers} uživatelům`);

        // Nastavení presence (status)
        try {
            if (client.config && client.config.presence) {
                const { presence } = client.config;
                await client.user.setPresence(presence);
                console.log(`[INFO] Nastavena presence: ${presence.activities[0]?.name || 'žádná'}`);
            } else {
                // Fallback pokud config neexistuje
                await client.user.setPresence({
                    activities: [{
                        name: 'tvůj server',
                        type: 'WATCHING'
                    }],
                    status: 'online'
                });
                console.log(`[INFO] Nastavena výchozí presence`);
            }
        } catch (error) {
            console.error('[ERROR] Chyba při nastavování presence:', error);
        }
    },
};
