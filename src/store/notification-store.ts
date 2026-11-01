import { useLanguageStore } from "@/store/language-store";
import { create } from "zustand";
import { isFinancialSandboxEnabled } from "@/features/wallet/financial-mode";
import type { AppLanguage } from "@/store/language-store";

export type AppNotification = {
  id: string;
  type: "transaction" | "security" | "promotion" | "system";
  message: string;
  /** Keep notification copy language-neutral in storage; render in the app's current language. */
  messageByLanguage?: Partial<Record<AppLanguage, string>>;
  timeLabel: string;
  createdAt: string;
  read: boolean;
};

type NotificationState = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: AppNotification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

function makeDemoOpeningNotification(): AppNotification[] {
  if (!isFinancialSandboxEnabled) return [];

  const now = new Date();
  const timeLabel = new Intl.DateTimeFormat(
    "en-US",
    { dateStyle: "medium", timeStyle: "short" }
  ).format(now);

  return [{
    id: "demo-opening-wallet",
    type: "transaction",
    message: "A demo balance of 100.00 USD was added to your Wallet. No real money was moved.",
    messageByLanguage: {
      en: "A demo balance of 100.00 USD was added to your Wallet. No real money was moved.",
      fr: "Solde de démonstration de 100,00 USD crédité sur le Wallet. Aucun argent réel n’a été déplacé.",
    },
    timeLabel,
    createdAt: now.toISOString(),
    read: false,
  }];
}

const INITIAL_NOTIFICATIONS = makeDemoOpeningNotification();

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter((notification) => !notification.read).length,

  addNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((item) => item.id === notification.id)) {
        return state;
      }
      const notifications = [notification, ...state.notifications];
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.read).length,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
      unreadCount: 0,
    })),

  markRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      return {
        notifications,
        unreadCount: notifications.filter((notification) => !notification.read).length,
      };
    }),
}));
