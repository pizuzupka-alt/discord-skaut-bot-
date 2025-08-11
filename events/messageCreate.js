const commandHandler = require('../handlers/commandHandler');
const logger = require('../utils/logger');

// Slovní fotbal - uchovává stav hry pro každý server
const wordFootballGame = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore messages from bots
        if (message.author.bot) return;
        
        try {
            // Handle word football with . prefix
            if (message.content.startsWith('.') && message.content.length > 1) {
                await handleWordFootball(message, client);
                return;
            }
            
            // Handle prefix commands
            await commandHandler.handlePrefixCommand(message, client);
            
            // Handle mentions
            if (message.mentions.has(client.user) && !message.content.startsWith(client.config.prefix)) {
                const embed = {
                    color: 0x0099ff,
                    title: '👋 Ahoj!',
                    description: `Čau ${message.author}! Jsem Discord bot vytvořený s Discord.js.\nPoužij \`${client.config.prefix}help\` pro zobrazení mých příkazů!`,
                    timestamp: new Date(),
                    footer: {
                        text: 'Discord Bot',
                        icon_url: client.user.displayAvatarURL()
                    }
                };
                
                await message.reply({ embeds: [embed] });
            }
            
        } catch (error) {
            logger.error('Error in messageCreate event:', error);
        }
    }
};

async function handleWordFootball(message, client) {
    const guildId = message.guild?.id || 'DM';
    const word = message.content.slice(1).toLowerCase().trim();
    
    // Kontrola, zda je slovo validní (pouze písmena, aspoň 2 znaky)
    if (!/^[a-záčďéěíňóřšťúůýž]{2,}$/i.test(word)) {
        await message.react('❌');
        await message.reply('❌ Slovo musí obsahovat pouze písmena a mít aspoň 2 znaky!');
        return;
    }
    
    // Získání nebo vytvoření stavu hry pro server
    if (!wordFootballGame.has(guildId)) {
        wordFootballGame.set(guildId, {
            lastWord: null,
            streak: 0,
            lastPlayer: null
        });
    }
    
    const gameState = wordFootballGame.get(guildId);
    
    // Pokud je to první slovo v této hře
    if (!gameState.lastWord) {
        gameState.lastWord = word;
        gameState.streak = 1;
        gameState.lastPlayer = message.author.id;
        
        await message.react('✅');
        await message.reply(`🎯 Slovní fotbal začíná! **${word}** - Série: **1**`);
        return;
    }
    
    // Kontrola, zda stejný hráč nehraje dvakrát po sobě
    if (gameState.lastPlayer === message.author.id) {
        await message.react('⚠️');
        await message.reply('⚠️ Nemůžeš hrát dvakrát po sobě! Počkej až bude hrát někdo jiný.');
        return;
    }
    
    const lastLetter = gameState.lastWord.slice(-1);
    const firstLetter = word.charAt(0);
    
    // Kontrola, zda je slovo správné (začíná posledním písmenem předchozího slova)
    if (lastLetter === firstLetter) {
        // Správné!
        gameState.lastWord = word;
        gameState.streak += 1;
        gameState.lastPlayer = message.author.id;
        
        await message.react('✅');
        await message.reply(`✅ **${word}** - Správně! Série: **${gameState.streak}**`);
    } else {
        // Špatné!
        const oldStreak = gameState.streak;
        gameState.lastWord = null;
        gameState.streak = 0;
        gameState.lastPlayer = null;
        
        await message.react('❌');
        await message.reply(`❌ **${word}** - Špatně! Slovo mělo začínat na **"${lastLetter}"**, ale začíná na **"${firstLetter}"**.\n🔥 Série ${oldStreak} byla přerušena! Začni novou hru.`);
    }
}