import "stream-chat";

declare module "stream-chat" {
  interface CustomChannelData {
    support_kind?: "customer_support";
    support_status?: "ai" | "waiting" | "human";
    customer_id?: string;
    customer_name?: string;
    assigned_agent_id?: string;
    assistant_last_message_id?: string;
    support_primary?: boolean;
  }
}
