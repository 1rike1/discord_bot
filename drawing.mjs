import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("drawing")
  .setDescription("ドローイング通知のオンオフを切り替えます")
  .addStringOption(option =>
    option.setName("mode")
      .setDescription("オンまたはオフを選択してください")
      .setRequired(true)
      .addChoices(
        { name: "オン", value: "on" },
        { name: "オフ", value: "off" }
      )
  );

export async function execute(interaction) {
  const mode = interaction.options.getString("mode");

  if (mode === "on") {
    global.drawingNotificationEnabled = true;
    await interaction.reply("✅ ドローイング通知をオンにしました");
  } else {
    global.drawingNotificationEnabled = false;
    await interaction.reply("🛑 ドローイング通知をオフにしました");
  }
}
