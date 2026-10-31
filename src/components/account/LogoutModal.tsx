import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Modal, View } from "react-native";

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** A brief progress overlay shown while Clerk signs the user out. */
export function LogoutModal({ visible, onClose }: LogoutModalProps) {
  const { signOut } = useAuth();
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (!visible) {
      logoutStarted.current = false;
      return;
    }
    if (logoutStarted.current) return;

    logoutStarted.current = true;
    const startedAt = Date.now();

    void (async () => {
      try {
        await signOut();

        // Keep the progress feedback visible long enough to register on fast connections.
        const remainingFeedbackTime = 650 - (Date.now() - startedAt);
        if (remainingFeedbackTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingFeedbackTime));
        }

        onClose();
        router.replace("/welcome");
      } catch {
        logoutStarted.current = false;
        onClose();
        showLocalizedAlert("Erreur", "Une erreur est survenue. Réessaie.");
      }
    })();
  }, [onClose, signOut, visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="items-center rounded-[24px] bg-white px-8 py-7 shadow-2xl">
          <ActivityIndicator size="large" color="#0057FF" />
          <Text className="mt-4 text-[16px] font-semibold text-zeno-text-primary">
            Logging out…
          </Text>
        </View>
      </View>
    </Modal>
  );
}
