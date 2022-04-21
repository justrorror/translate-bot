const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');

// replace the value below with the Telegram token you receive from @BotFather
const TOKEN = process.env.TELEGRAM_TOKEN;

const url = process.env.APP_URL || 'https://translaterisukr.herokuapp.com:443';
const options = {
  webHook: {
    // Port to which you should bind is assigned to $PORT variable
    // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
    port: process.env.PORT
    // you do NOT need to set up certificates since Heroku provides
    // the SSL certs already (https://<app-name>.herokuapp.com)
    // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
  }
};

const langList = ['ru', 'en', 'uk'];
let lang = 'uk';
const stateList = ['on', 'off'];
const state = {};
const commands = [{
  name: 'state',
  descr: 'Choice state',
  variants: ['on', 'of'],
  reg: /\/state/,
}, {
  name: 'lang',
  descr: 'Choice lang',
  variants: ['en', 'uk', 'ru'],
  reg: /\/lang/,
}, {
  name: 'help',
  descr: 'Help',
  variants: [],
  reg: /\/help/,
}];

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, options);

bot.setWebHook(`${url}/bot${TOKEN}`);

// Matches "/help [whatever]"
bot.onText(/\/help/, (msg) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const text = commands.map((command) => `${command.name} - ${command.descr}: ${command.variants.join(' - ')}\n`).join('');
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, text);
});

// Matches "/state [whatever]"
bot.onText(/\/state/, (msg) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const respCheck = msg.text.match(/\/state (.+)/g);
  const resp = msg.text.replace(/\/state\s/, '');

  if (!respCheck) {
    bot.sendMessage(chatId, `State - ${state[chatId] ? 'on' : 'off'}`);
  }

  if (resp && stateList.includes(resp)) {
    state[chatId] = resp === 'off';
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, `State - ${state[chatId]}`);
  }
});

// Matches "/lang [whatever]"
bot.onText(/\/lang/, (msg) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const respCheck = msg.text.match(/\/lang (.+)/g);
  const resp = msg.text.replace(/\/lang\s/, '');


  if (!respCheck) {
    bot.sendMessage(chatId, `Lang - ${lang}`);
  }
  if (resp && langList.includes(resp)) {
    lang = resp;
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, `Lang - ${lang}`);
  }
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (state[chatId] || !msg.text || commands.some(c => msg.text.match(c.reg))) {
    return;
  }

  if (msg.text) {
    try {
      const answer = await translate(msg?.text, { to: lang });

      await bot.sendMessage(chatId, answer.text);
    } catch (e) {
      console.error(e);
    }
  } else {
    console.error(msg);
  }
});
