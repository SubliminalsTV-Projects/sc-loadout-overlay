/**
 * Pushes the player's collected blueprints + currently-tracked mission to their
 * subliminal.gg account (the /blueprints collection tracker). Bearer-authed with a
 * device token the player mints on the site ("Connect the desktop tracker").
 *
 * The log only ever yields blueprint NAMES; the caller resolves those to dataset
 * item UUIDs (MissionTracker.itemUuidsForName) before queueing — the site keys the
 * collection by item UUID. Offline-safe: batches, debounces, retries on the next
 * tick, disables itself on a rejected token, and never throws into the caller.
 */
const SYNC_PATH = "/api/sc/sync";
const DEBOUNCE_MS = 1500;

export class SiteSync {
  private readonly baseUrl: string;
  private token = "";
  private enabled = false;

  private pendingGot = new Set<string>();
  private mission: { debugName: string; patch: string } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /** Set/replace credentials. Returns whether sync is now active. */
  configure(token: string, enabled: boolean): boolean {
    this.token = (token ?? "").trim();
    this.enabled = enabled;
    return this.active;
  }

  get active(): boolean {
    return this.enabled && this.token.length > 0;
  }

  /** Queue received blueprints (item UUIDs) for the next flush. */
  addGot(uuids: string[]): void {
    if (!this.active || uuids.length === 0) return;
    for (const u of uuids) this.pendingGot.add(u);
    this.schedule();
  }

  /** Set the currently-tracked mission (dataset debug_name + build changelist). */
  setMission(debugName: string, patch: string): void {
    if (!this.active || !debugName) return;
    this.mission = { debugName, patch };
    this.schedule();
  }

  private schedule(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    if (!this.active || this.flushing) return;
    if (this.pendingGot.size === 0 && !this.mission) return;
    this.flushing = true;
    const got = [...this.pendingGot];
    const mission = this.mission;
    try {
      const res = await fetch(`${this.baseUrl}${SYNC_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          got,
          currentMission: mission?.debugName ?? "",
          patch: mission?.patch ?? "",
        }),
      });
      if (res.ok) {
        // Clear only what we actually sent; anything queued meanwhile survives.
        for (const u of got) this.pendingGot.delete(u);
        if (this.mission === mission) this.mission = null;
      } else if (res.status === 401) {
        console.error("[sync] subliminal.gg rejected the token (401) — re-paste it in config.");
        this.enabled = false; // stop hammering with a bad token until reconfigured
      } else {
        console.error(`[sync] subliminal.gg returned ${res.status}`);
      }
    } catch {
      /* offline / unreachable — keep pending, retry on the next schedule */
    } finally {
      this.flushing = false;
      if (this.active && (this.pendingGot.size || this.mission)) this.schedule();
    }
  }
}
