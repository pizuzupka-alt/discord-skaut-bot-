// v commands/balance.js
module.exports = {
    data: {
        name: 'balance',
        description: 'Zobrazí tvůj zůstatek',
    },
    async execute(message, args, client) {
        console.log("Spouštím balance příkaz");
        try {
            await message.reply("Tvůj zůstatek je 0 💰");
        } catch (error) {
            console.error("Chyba při odesílání odpovědi:", error);
        }
    }
};
