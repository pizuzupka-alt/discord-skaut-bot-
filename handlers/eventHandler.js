const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class EventHandler {
    async loadEvents(client) {
        const eventsPath = path.join(__dirname, '../events');
        
        try {
            const eventFiles = await fs.readdir(eventsPath);
            const jsFiles = eventFiles.filter(file => file.endsWith('.js'));
            
            for (const file of jsFiles) {
                const filePath = path.join(eventsPath, file);
                const event = require(filePath);
                
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                
                logger.info(`Načtena událost: ${event.name}`);
            }
            
            logger.info(`Úspěšně načteno ${jsFiles.length} událostí`);
        } catch (error) {
            logger.error('Chyba při načítání událostí:', error);
            throw error;
        }
    }
}

module.exports = new EventHandler();
