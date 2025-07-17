import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('draw')
  .setDescription('ワンドロのお題を出題するよ（結果が2000文字を超えるとエラーになります）')

export const hairStyles = ["ロングストレート", "ツインテール", "ショートボブ", "ポニーテール", "サイドテール", "お団子ヘア", "ウェーブ", "三つ編み"];
export const hairColors = ["黒", "茶色", "金髪", "銀髪", "赤", "青", "紫", "ピンク", "緑", "白"];
export const eyeShapes = ["丸い瞳", "つり目", "たれ目", "猫目", "細めの瞳", "ぱっちり二重", "一重"];
export const eyeColors = ["青", "緑", "赤", "紫", "金", "銀", "灰色", "ピンク", "茶色"];
export const outfits = ["制服", "ドレス", "カジュアル", "和服", "スポーツウェア", "ファンタジー衣装", "サイバー風", "パンクスタイル"];
export const features = ["メガネ", "そばかす", "アホ毛", "リボン付き", "ヘッドフォン", "泣きぼくろ", "獣耳", "眼帯"];
export const personalities = ["元気いっぱい", "クール", "優しい", "ツンデレ", "天然", "知的", "恥ずかしがり屋", "大胆", "ミステリアス"];

function getRandomHexColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    let integer = r * 256 * 256 + g * 256 + b;
    let hex = ('000000'+ integer.toString(16).toUpperCase() ).slice(-6);
    return '#' + hex;
}

export function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function generateCharacter() {
    return {
        髪型: getRandomElement(hairStyles),
        髪色: getRandomElement(hairColors),
        目: getRandomElement(eyeShapes),
        目の色: getRandomElement(eyeColors),
        服装: getRandomElement(outfits),
        特徴: getRandomElement(features),
        性格: getRandomElement(personalities)
    };
}

export function draw(){
  const chara = generateCharacter();
  const description = `  **キャラクター生成結果** \n髪型: ${chara.髪型} \n髪色: ${getRandomHexColor()} \n目: ${chara.目} \n目の色: ${getRandomHexColor()} \n服装: ${chara.服装} \n特徴: ${chara.特徴} \n性格: ${chara.性格}`;
  return description;
}

export async function execute(interaction){
  const text = draw();
    try{
      if(!interaction.replied && !interaction.deferred){
	await interaction.reply(text);
      }
      else{
        await interaction.followUp({content: text});
      }
    }
    catch (error){
      console.error('[draw.mjs error]', error);
    }
}
