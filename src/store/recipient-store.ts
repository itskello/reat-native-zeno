import { create } from "zustand";

/** Contacts saved on the server and shown on the Send Money surface. */

export type Recipient = {
  id: string;
  name: string;
  /** ZENO handle used to resolve the account in the transfer flow. */
  zenoId?: string;
  avatarUrl: string;
};

type RecipientState = {
  recent: Recipient[];
  isLoading: boolean;
  setRecipients: (recipients: Recipient[]) => void;
  addRecentRecipient: (recipient: Recipient) => void;
  removeRecipient: (id: string) => void;
};

export const useRecipientStore = create<RecipientState>((set) => ({
  recent: [],
  isLoading: false,
  setRecipients: (recent) => set({ recent, isLoading: false }),
  addRecentRecipient: (recipient) =>
    set((state) => ({
      recent: [
        recipient,
        ...state.recent.filter((item) => item.id !== recipient.id),
      ].slice(0, 100),
    })),
  removeRecipient: (id) => set((state) => ({ recent: state.recent.filter((item) => item.id !== id) })),
}));
