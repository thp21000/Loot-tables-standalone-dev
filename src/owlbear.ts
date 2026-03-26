import OBR from "@owlbear-rodeo/sdk";
import type {
  OwlbearPlayerRole,
  OwlbearRoomState,
  ValidatedRollBroadcast,
  ValidatedRollSummary,
} from "./types";

const ROOM_STATE_KEY = "io.github.quentin.loot-tables/state";
const VALIDATED_ROLL_CHANNEL = "io.github.quentin.loot-tables/validated-roll";
const VALIDATED_ROLL_MODAL_ID = "io.github.quentin.loot-tables/validated-roll-modal";

export function waitForOwlbearReady(): Promise<void> {
  return new Promise((resolve) => {
    if (OBR.isReady) {
      resolve();
      return;
    }

    OBR.onReady(() => {
      resolve();
    });
  });
}

export async function configureOwlbearAction(): Promise<void> {
  await OBR.action.setWidth(1150);
  await OBR.action.setHeight(950);
  await OBR.action.setTitle("Loot Tables");
}

export async function setOwlbearPopoverWidth(width: number): Promise<void> {
  try {
    await OBR.action.setWidth(width);
  } catch (error) {
    console.error("Impossible de redimensionner le popover Owlbear :", error);
  }
}

export async function getOwlbearRoomId(): Promise<string | null> {
  try {
    return OBR.room.id ?? null;
  } catch (error) {
    console.error("Impossible de lire l'identifiant de room Owlbear :", error);
    return null;
  }
}

export async function getOwlbearPlayerName(): Promise<string | null> {
  try {
    const name = await OBR.player.getName();
    return typeof name === "string" ? name : null;
  } catch (error) {
    console.error("Impossible de lire le nom du joueur Owlbear :", error);
    return null;
  }
}

export async function getOwlbearPlayerRole(): Promise<OwlbearPlayerRole> {
  try {
    const role = await OBR.player.getRole();

    if (role === "GM" || role === "PLAYER") {
      return role;
    }

    return "UNKNOWN";
  } catch (error) {
    console.error("Impossible de lire le rôle Owlbear :", error);
    return "UNKNOWN";
  }
}

export async function getRoomState(): Promise<OwlbearRoomState> {
  try {
    const metadata = await OBR.room.getMetadata();
    const state = metadata[ROOM_STATE_KEY];

    if (!state || typeof state !== "object") {
      return {};
    }

    return state as OwlbearRoomState;
  } catch (error) {
    console.error("Impossible de lire les metadata de room Owlbear :", error);
    return {};
  }
}

export async function setRoomState(
  partialState: Partial<OwlbearRoomState>
): Promise<void> {
  try {
    const currentState = await getRoomState();

    await OBR.room.setMetadata({
      [ROOM_STATE_KEY]: {
        ...currentState,
        ...partialState,
      },
    });
  } catch (error) {
    console.error("Impossible d'écrire les metadata de room Owlbear :", error);
  }
}

export function subscribeToRoomState(
  callback: (state: OwlbearRoomState) => void
): () => void {
  return OBR.room.onMetadataChange((metadata) => {
    const state = metadata[ROOM_STATE_KEY];

    if (!state || typeof state !== "object") {
      callback({});
      return;
    }

    callback(state as OwlbearRoomState);
  });
}

export async function notifyInfo(message: string): Promise<void> {
  try {
    await OBR.notification.show(message, "INFO");
  } catch (error) {
    console.error("Impossible d'afficher une notification Owlbear :", error);
  }
}

export async function notifySuccess(message: string): Promise<void> {
  try {
    await OBR.notification.show(message, "SUCCESS");
  } catch (error) {
    console.error("Impossible d'afficher une notification Owlbear :", error);
  }
}

export async function publishValidatedRoll(
  summary: ValidatedRollSummary
): Promise<void> {
  try {
    await setRoomState({
      lastValidatedRoll: summary,
    });

    const message: ValidatedRollBroadcast = {
      type: "validated-roll",
      payload: summary,
    };

    await OBR.broadcast.sendMessage(VALIDATED_ROLL_CHANNEL, message, {
      destination: "ALL",
    });
  } catch (error) {
    console.error("Impossible d'envoyer le tirage validé :", error);
  }
}

export function subscribeToValidatedRolls(
  callback: (summary: ValidatedRollSummary) => void
): () => void {
  return OBR.broadcast.onMessage(VALIDATED_ROLL_CHANNEL, (event) => {
    const data = event.data as ValidatedRollBroadcast | undefined;

    if (!data || data.type !== "validated-roll") {
      return;
    }

    callback(data.payload);
  });
}

export async function openValidatedRollModal(
  summary: ValidatedRollSummary
): Promise<void> {
  try {
    try {
      await OBR.modal.close(VALIDATED_ROLL_MODAL_ID);
    } catch {
      // ignore
    }

    const viewportMax =
      typeof window !== "undefined"
        ? Math.max(320, window.innerHeight - 32)
        : 980;

    const headerFooterSpace = 170;
    const perItemHeight = 84;

    const computedHeight = Math.min(
      Math.max(320, headerFooterSpace + summary.items.length * perItemHeight),
      viewportMax
    );

const modalUrl = "https://thp21000.github.io/loot-tables-for-OBR/?view=gain-modal";

await OBR.modal.open({
  id: VALIDATED_ROLL_MODAL_ID,
  url: modalUrl,
  width: 760,
  height: computedHeight,
});

  } catch (error) {
    console.error("Impossible d'ouvrir la modale de gain Owlbear :", error);
  }
}

export async function closeValidatedRollModal(): Promise<void> {
  try {
    await OBR.modal.close(VALIDATED_ROLL_MODAL_ID);
  } catch (error) {
    console.error("Impossible de fermer la modale de gain Owlbear :", error);
  }
}