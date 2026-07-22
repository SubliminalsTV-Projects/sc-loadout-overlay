import assert from "node:assert/strict";
import { parseMissionEvent } from "./missions-parser.js";
import type { LogEvent } from "./parser.js";

function event(message: string): LogEvent {
  return { eventTag: "SHUDEvent_OnNotification", timestamp: "2026-07-22T00:00:00.000Z", message } as LogEvent;
}

const acceptMessage = 'Added notification "Contract Accepted: <EM4>[N Rep] [BP]*</EM4>Jorrit Dossier: Updated Security Data: " [9] to queue. MissionId: [11111111-2222-3333-4444-555555555555]';
const completeMessage = 'Added notification "Contract Complete: <EM4>[BP]*</EM4>Rescue Run: Final Checkpoint: " [9] to queue. MissionId: [11111111-2222-3333-4444-555555555555]';

const accept = parseMissionEvent(event(acceptMessage));
assert(accept?.kind === "accept", "accept event should parse");
assert.equal(accept?.title, "Jorrit Dossier: Updated Security Data", "accept title should strip markup and badges");

const complete = parseMissionEvent(event(completeMessage));
assert(complete?.kind === "contractComplete", "complete event should parse");
assert.equal(complete?.title, "Rescue Run: Final Checkpoint", "complete title should strip markup and badges");

console.log("missions-parser tests passed");
