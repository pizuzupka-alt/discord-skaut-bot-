require('dotenv').config();

module.exports = {
    // Token bota z Discord Developer Portal
    token: process.env.DISCORD_TOKEN || '',
    
    // Konfigurace bota
    prefix: process.env.PREFIX || '!',
    clientId: process.env.CLIENT_ID || '',
    
    // Nastavení přítomnosti bota
    presence: {
        status: 'online', // online (online), idle (nečinný), dnd (nerušit), invisible (neviditelný)
        activities: [{
            name: process.env.BOT_ACTIVITY || 's Discord.js',
            type: 0 // HRAJE = 0, STREAMUJE = 1, POSLOUCHÁ = 2, SLEDUJE = 3, SOUTĚŽÍ = 5
        }]
    },
    
    // Oprávnění
    permissions: {
        ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
        adminRoles: process.env.ADMIN_ROLES ? process.env.ADMIN_ROLES.split(',') : ['Admin', 'Moderátor']
    },
    
    // Nastavení logování
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true' || false
    }
};
