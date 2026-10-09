import { create } from "zustand";

/**
 * Recent recipients shown on the Send Money surface.
 *
 * PLACEHOLDER data so the surface can be built and reviewed — the backend owns
 * the real saved-recipient list (AGENTS.md — Financial Data Rules).
 * `loadRecentRecipients` is where the real fetch is wired later.
 */

export type Recipient = {
  id: string;
  name: string;
  /** ZENO handle used to resolve the account in the transfer flow. */
  zenoId: string;
  avatarUrl: string;
};

const PLACEHOLDER_RECIPIENTS: Recipient[] = [
  {
    id: "rcp-1",
    name: "Onela",
    zenoId: "@onela",
    avatarUrl: "https://i.pravatar.cc/200?img=45",
  },
  {
    id: "rcp-2",
    name: "Frestus",
    zenoId: "@frestus",
    avatarUrl: "https://i.pravatar.cc/200?img=33",
  },
  {
    id: "rcp-3",
    name: "Nela",
    zenoId: "@nela",
    avatarUrl: "https://i.pravatar.cc/200?img=26",
  },
  {
    id: "rcp-4",
    name: "Jelell",
    zenoId: "@jelell",
    avatarUrl: "https://i.pravatar.cc/200?img=15",
  },
];

type RecipientState = {
  recent: Recipient[];
  isLoading: boolean;
  loadRecentRecipients: () => Promise<void>;
};

export const useRecipientStore = create<RecipientState>((set) => ({
  recent: PLACEHOLDER_RECIPIENTS,
  isLoading: false,
  loadRecentRecipients: async () => {
    set({ isLoading: true });
    // TODO: fetch the user's recent recipients from the backend.
    set({ recent: PLACEHOLDER_RECIPIENTS, isLoading: false });
  },
}));
