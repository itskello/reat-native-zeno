import { ZenoLoading } from "@/components/ui/ZenoLoading";
import { useAuthTransitionStore } from "@/store/auth-transition-store";
import { Modal, View } from "react-native";

/** Stays mounted at the app root so the logo remains visible across auth redirects. */
export function SignOutLoadingOverlay() {
  const isSigningOut = useAuthTransitionStore((state) => state.isSigningOut);

  return (
    <Modal
      visible={isSigningOut}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <ZenoLoading variant="blue" />
      </View>
    </Modal>
  );
}
