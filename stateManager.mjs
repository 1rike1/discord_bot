// stateManager.mjs
import fs from "fs";
const stateFile = "drawingState.json";

export function loadState() {
  try {
    const data = fs.readFileSync(stateFile, "utf-8");
    const json = JSON.parse(data);
    global.drawingNotificationEnabled = json.drawingNotificationEnabled ?? true;
  } catch {
    global.drawingNotificationEnabled = true;
  }
}

export function saveState() {
  fs.writeFileSync(
    stateFile,
    JSON.stringify({ drawingNotificationEnabled: global.drawingNotificationEnabled })
  );
}
