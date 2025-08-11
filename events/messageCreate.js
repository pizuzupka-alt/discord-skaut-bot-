// events/messageCreate.js
module.exports = {
    name: 'messageCreate',
    once: false,
    execute(message, client) {
        // nech prázdné, nebo jen logování
        // console.log(`Nová zpráva od ${message.author.tag}: ${message.content}`);
    }
};

