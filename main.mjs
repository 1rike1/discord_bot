import fs from "fs";
import path from "path";
import express from "express";
import { Client, Collection, Events, GatewayIntentBits, ActivityType, EmbedBuilder } from "discord.js";
import CommandsRegister from "./regist-commands.mjs";
import Notification from "./models/notification.mjs";
import YoutubeFeeds from "./models/youtubeFeeds.mjs";
import YoutubeNotifications from "./models/youtubeNotifications.mjs";

import Sequelize from "sequelize";
import Parser from 'rss-parser';
const parser = new Parser();

import { Client as Youtubei, MusicClient } from "youtubei";

const youtubei = new Youtubei();

import { draw } from "./commands/samples/draw.mjs";

let postCount = 0;
const app = express();
app.listen(3000);
app.post('/', function(req, res) {
  console.log(`${postCount}: Received POST request.`);

  postCount++;
  if (postCount == 10) {
    trigger();
    postCount = 0;
  }

  res.send('POST response by glitch');
})
app.get('/', function(req, res) {
  res.send(`
    <html>
      <head>
        <title>Botの受信エンドポイント</title>
      </head>
      <body>
        <h2>✅ このBotはPOSTリクエストを受信できます！</h2>
        <p>Google Apps Scriptなどから以下のURLに送信してください：</p>
        <code>${req.protocol}://${req.get("host")}/</code>
        <br/><br/>
        <a href="https://note.com/exteoi/n/n0ea64e258797" target="_blank">📘 詳しい解説はこちら</a>
      </body>
    </html>
  `);

})

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

const categoryFoldersPath = path.join(process.cwd(), "commands");
const commandFolders = fs.readdirSync(categoryFoldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(categoryFoldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".mjs"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then((module) => {
      client.commands.set(module.data.name, module);
    });
  }
}

const handlers = new Map();

const handlersPath = path.join(process.cwd(), "handlers");
const handlerFiles = fs.readdirSync(handlersPath).filter((file) => file.endsWith(".mjs"));

for (const file of handlerFiles) {
  const filePath = path.join(handlersPath, file);
  import(filePath).then((module) => {
    handlers.set(file.slice(0, -4), module);
  });
}

//現在時刻をJSTで取得する関数
function getJSTTime() {
  return new Date().toLocaleTimeString("ja-JP", { hour12: false, timeZone: "Asia/Tokyo" });
}

//メッセージを送信する関数
function sendMessage(messageText) {
  const channel = client.channels.cache.get(process.env.CHANNEL_ID);
  if (channel) {
    channel.send(messageText);
  }
  else {
    console.log("⚠️チャンネルが見つかりませんでした");
  }
}

//drawメッセージを送信する関数
function sendDrawMessage() {
  const channel = client.channels.cache.get(process.env.CHANNEL_ID);
  if (channel) {
    const messageText = draw();  //キャラクター生成
    channel.send(messageText);
    console.log("✅20:00 - draw.mjsのキャラクター生成を実行しました");
  }
  else {
    console.log("⚠️チャンネルが見つかりませんでした");
  }
}

//毎分チェックする関数
function checkTime() {
  if (getJSTTime().startsWith("18:15")) {
    sendMessage("てすとです");
  }
  if (getJSTTime().startsWith("20:50")) {
    sendMessage("ドローイング開始10分前です！");
  }
  if (getJSTTime().startsWith("21:00")) {
    sendDrawMessage();
  }
  if (getJSTTime().startsWith("21:15")) {
    sendMessage("半分経過！");
  }
  if (getJSTTime().startsWith("21:30")) {
    sendMessage("終了！");
  }

}

client.on("interactionCreate", async (interaction) => {
  await handlers.get("interactionCreate").default(interaction);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  await handlers.get("voiceStateUpdate").default(oldState, newState);
});

client.on("messageCreate", async (message) => {
  if (message.author.id == client.user.id || message.author.bot) return;
  await handlers.get("messageCreate").default(message);
});

client.on("ready", async () => {
  await client.user.setActivity('🎲', { type: ActivityType.Custom, state: "🎲ワンドロ" });
  console.log(`🔥🔥🔥${client.user.tag} がログインしました！🔥🔥🔥`);
  setInterval(() => {
    const now = new Date();
    const seconds = now.getSeconds();
    const jstTime = now.toLocaleTimeString("ja-JP", { hour12: false, timeZone: "Asia/Tokyo" });
    if (seconds == 0) {
      console.log(`⌚0秒検出 → checkTime() 実行 {${jstTime}}`);
      checkTime();
    }
  }, 1000);  //毎秒チェック
});

Notification.sync({ alter: true });
YoutubeFeeds.sync({ alter: true });
YoutubeNotifications.sync({ alter: true });

CommandsRegister();
client.login(process.env.TOKEN);


async function trigger() {
  const youtubeNofications = await YoutubeNotifications.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('channelFeedUrl')), 'channelFeedUrl'],
    ]
  });
  await Promise.all(
    youtubeNofications.map(async n => {
      checkFeed(n.channelFeedUrl);
    })
  );
}

async function checkFeed(channelFeedUrl) {

  const youtubeFeed = await YoutubeFeeds.findOne({
    where: {
      channelFeedUrl: channelFeedUrl,
    },
  });

  const checkedDate = new Date(youtubeFeed.channelLatestUpdateDate);
  let latestDate = new Date(youtubeFeed.channelLatestUpdateDate);

  const feed = await parser.parseURL(channelFeedUrl);
  const videos = feed.items.map(i => {
    const now = new Date(i.isoDate);

    if (now > checkedDate) {
      if (now > latestDate) {
        latestDate = now
      }
      return i;
    }
  });

  const notifications = await YoutubeNotifications.findAll({
    where: {
      channelFeedUrl: channelFeedUrl,
    },
  });
  const youtubeChannelId = channelFeedUrl.split('=').at(1);
  //const youtubeChannel = await youtubei.getChannel(youtubeChannelId);

  videos.forEach(async v => {
    if (!v) return;
    const youtubeVideolId = v.link.split('=').at(1);
    const youtubeVideo = await youtubei.getVideo(youtubeVideolId);

    const embed = new EmbedBuilder()
      .setColor(0xcd201f)
      .setAuthor({ name: v.author, url: `https://www.youtube.com/channel/${youtubeChannelId}` })
      .setTitle(v.title)
      .setURL(v.link)
      .setDescription(youtubeVideo.description)
      .setImage(youtubeVideo.thumbnails.best)
      .setTimestamp(new Date(v.isoDate));

    //.setThumbnail(youtubeChannel.thumbnails.best)

    notifications.forEach(n => {
      const channel = client.channels.cache.get(n.textChannelId);
      channel.send({ embeds: [embed] });
    });
  });

  YoutubeFeeds.update(
    { channelLatestUpdateDate: latestDate.toISOString() },
    {
      where: {
        channelFeedUrl: channelFeedUrl,
      },
    },
  );
}
