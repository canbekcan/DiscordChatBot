
require('dotenv/config');
require('dotenv').config();
console.log('API Key:', process.env.OPENAI_API_KEY);

const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Function to split a message into chunks of 2000 characters or less
function splitMessage(message) {
    const messages = [];
    while (message.length > 0) {
      // Take the first 2000 characters
      messages.push(message.slice(0, 2000));
      // Remove the part that was taken
      message = message.slice(2000);
    }
    return messages;
  }


client.on('ready', () => {
  console.log('The bot is online!');
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: 'To assist users in understanding academic subjects and provide actionable strategies to improve their knowledge while continuously updating from diverse sources.' },
  ];

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    
    prevMessages.forEach((msg) => {
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai.createChatCompletion({
        model: 'gpt-4o-mini-2024-07-18',  // Updated to a valid model name
        messages: conversationLog,
      });
  
      const replyMessage = result.data.choices[0].message.content;
  
      // Split the reply message if it exceeds 2000 characters
      const messagesToSend = splitMessage(replyMessage);
      for (const msg of messagesToSend) {
        await message.reply(msg);
      }
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  });
  
  client.login(process.env.TOKEN);

