import { create } from "zustand";

/**
 * An in-app notification.
 *
 * `read` is client-side only for now — in production this would be synced
 * with the backend so the badge persists across sessions and devices.
 */
export type AppNotification = {
  id: string;
  /** Short category label used to determine the icon/colour. */
  type: "transaction" | "security" | "promotion" | "system";
  message: string;
  /** Formatted display timestamp shown under the message. */
  timeLabel: string;
  /** ISO 8601 string for sorting. */
  createdAt: string;
  read: boolean;
};

type NotificationState = {
  notifications: AppNotification[];
  /** Number of unread notifications — drives the badge on the bell icon. */
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

// ---------------------------------------------------------------------------
// Placeholder data
// In production: fetched from the backend via loadNotifications()
// ---------------------------------------------------------------------------
const PLACEHOLDER_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_001",
    type: "transaction",
    message:
      "Ton paiement par carte a échoué car le solde de ta carte est insuffisant. Merci de transférer des fonds depuis ton compte principal vers le solde de ta carte.",
    timeLabel: "Oct 28, 2026 at 11:30 AM",
    createdAt: "2026-10-28T11:30:00Z",
    read: false,
  },
  {
    id: "notif_002",
    type: "transaction",
    message:
      "Ton paiement par carte a échoué car le solde de ta carte est insuffisant. Merci de transférer des fonds depuis ton compte principal vers le solde de ta carte.",
    timeLabel: "Oct 28, 2026 at 11:30 AM",
    createdAt: "2026-10-28T11:28:00Z",
    read: false,
  },
  {
    id: "notif_003",
    type: "transaction",
    message:
      "Ton paiement par carte a échoué car le solde de ta carte est insuffisant. Merci de transférer des fonds depuis ton compte principal vers le solde de ta carte.",
    timeLabel: "Oct 26, 2026 at 7:09 PM",
    createdAt: "2026-10-26T19:09:00Z",
    read: false,
  },
  {
    id: "notif_004",
    type: "transaction",
    message:
      "Ton paiement par carte a échoué car le solde de ta carte est insuffisant. Merci de transférer des fonds depuis ton compte principal vers le solde de ta carte.",
    timeLabel: "Oct 26, 2026 at 1:49 PM",
    createdAt: "2026-10-26T13:49:00Z",
    read: true,
  },
  {
    id: "notif_005",
    type: "security",
    message:
      "Une connexion depuis un nouvel appareil a été détectée sur ton compte. Si ce n'est pas toi, modifie ton mot de passe immédiatement.",
    timeLabel: "Oct 24, 2026 at 9:00 AM",
    createdAt: "2026-10-24T09:00:00Z",
    read: true,
  },
  {
    id: "notif_006",
    type: "transaction",
    message: "Tu as reçu 27.50 USD de MONDAY ISRAEL M. sur ton compte ZENO.",
    timeLabel: "Sep 15, 2026 at 2:30 PM",
    createdAt: "2026-09-15T14:30:00Z",
    read: true,
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: PLACEHOLDER_NOTIFICATIONS,
  unreadCount: PLACEHOLDER_NOTIFICATIONS.filter((n) => !n.read).length,

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  markRead: (id: string) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),
}));
