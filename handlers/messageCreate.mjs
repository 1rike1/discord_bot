import { ndnDice } from "../commands/utils/dice.mjs"
import { draw } from "../commands/samples/draw.mjs"

export default async(message) => {
  
  if (message.content.match(/にゃん|にゃーん|にゃ～ん/)) {
    await message.reply("にゃ～ん");
  }
  
  if (message.content.match(/^\d+d\d+$/)) {
    await message.reply(ndnDice(message.content));
  }
  if(message.content.match(/draw/)){
    await message.reply(draw())
  }
};
