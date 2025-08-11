// Jediný messageCreate handler
client.on('messageCreate', (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(`Prefix příkaz detekován: ${commandName}`);

    const command = client.commands.get(commandName);
    if (!command) {
        console.log(`[WARNING] Prefix příkaz '${commandName}' nebyl nalezen`);
        return;
    }

    // Spustíme jen příkazy označené jako "prefix"
    if (!command.prefix) return;

    try {
        command.execute(message, args, client);
    } catch (err) {
        console.error(`[ERROR] Chyba při spouštění prefix příkazu ${commandName}:`, err);
        message.reply('Nastala chyba při vykonávání příkazu.');
    }
});
