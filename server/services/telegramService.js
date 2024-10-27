const { Telegraf } = require('telegraf');
const dbService = require('./dbService');

if (!global.bot) {
    global.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    console.log('Created bot');
}

var user = '';
var chatId = '';

function validate(ctx) {
    return ctx.from.username == 'KetanRyan';
}

// Register middleware and launch bot
global.bot.start(async (ctx) => {
    if(!validate(ctx)) return;

    user = ctx.from.username;
    chatId = ctx.chat.id;

    const users = await dbService.getTgUserExists(user);
    if (users == 0) {
        await dbService.createTgUser(user, chatId);
    } else {
        await dbService.updateTgUser(user, chatId);
    }

    ctx.reply('Connection established.');
});

global.bot.launch();

function sendMessage(chatId, message) {
    global.bot.telegram.sendMessage(chatId, message);
}

function createPoll(chatId, songs) {
    global.bot.telegram.sendPoll(
        chatId,
        'Best randomly selected song?',
        songs,
        { is_anonymous: false }
    );
}

module.exports = {
    sendMessage,
    createPoll
}