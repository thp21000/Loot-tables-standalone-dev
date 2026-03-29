import type {
  OwlbearPlayerRole,
  OwlbearRoomState,
  ValidatedRollSummary,
} from "./types";

const ROOM_STATE_KEY = "loot-tables-standalone-room-state";
const ROOM_STATE_EVENT = "loot-tables-standalone-room-state-change";

function readRoomState(): OwlbearRoomState {
  try {
    const raw = localStorage.getItem(ROOM_STATE_KEY);

    if (!raw) {
      return {};
    }

const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as OwlbearRoomState) : {};
  } catch (error) {
    console.error("Impossible de lire l'état local :", error);
    return {};
  }
}

function emitRoomStateChange(nextState: OwlbearRoomState): void {
  window.dispatchEvent(
    new CustomEvent<OwlbearRoomState>(ROOM_STATE_EVENT, {
      detail: nextState,
    })
  );
}

export async function waitForOwlbearReady(): Promise<void> {
  return Promise.resolve();
}

export async function configureOwlbearAction(): Promise<void> {
  return Promise.resolve();
}

export async function setOwlbearPopoverWidth(width: number): Promise<void> {
  void width;
  return Promise.resolve();
}

export async function getOwlbearRoomId(): Promise<string | null> {
  return "standalone";
}

export async function getOwlbearPlayerName(): Promise<string | null> {
  return "Local user";
}

export async function getOwlbearPlayerRole(): Promise<OwlbearPlayerRole> {
  return "GM";
}

export async function getRoomState(): Promise<OwlbearRoomState> {
 return readRoomState();

export async function setRoomState(
  partialState: Partial<OwlbearRoomState>
): Promise<void> {
  try {
     const currentState = readRoomState();
    const nextState = {
      ...currentState,
      ...partialState,
    };

    localStorage.setItem(ROOM_STATE_KEY, JSON.stringify(nextState));
    emitRoomStateChange(nextState);
  } catch (error) {
    console.error("Impossible de sauvegarder l'état local :", error);
  }
}

export function subscribeToRoomState(
  callback: (state: OwlbearRoomState) => void
): () => void {
  const onStateChange = (event: Event) => {
    const customEvent = event as CustomEvent<OwlbearRoomState>;
    callback(customEvent.detail ?? readRoomState());
  };

    const onStorageChange = (event: StorageEvent) => {
    if (event.key !== ROOM_STATE_KEY) {
      return;
    }

    callback(readRoomState());
  };

  window.addEventListener(ROOM_STATE_EVENT, onStateChange as EventListener);
  window.addEventListener("storage", onStorageChange);

  return () => {
    window.removeEventListener(ROOM_STATE_EVENT, onStateChange as EventListener);
    window.removeEventListener("storage", onStorageChange);
  };
}

export async function notifyInfo(message: string): Promise<void> {
  console.info(message);
}

export async function notifySuccess(message: string): Promise<void> {
  console.info(message);
}

export async function publishValidatedRoll(
  summary: ValidatedRollSummary
): Promise<void> {
  await setRoomState({
    lastValidatedRoll: summary,
  });
}

export function subscribeToValidatedRolls(
  callback: (summary: ValidatedRollSummary) => void
): () => void {
  return subscribeToRoomState((state) => {
    if (!state.lastValidatedRoll) {
      return;
    }

    callback(state.lastValidatedRoll);
  });
}

export async function openValidatedRollModal(summary: ValidatedRollSummary): Promise<void> {
  void summary;
  return Promise.resolve();
}

export async function closeValidatedRollModal(): Promise<void> {
  window.close();
}