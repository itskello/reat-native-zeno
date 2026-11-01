import { ZenoLoading, type ZenoLoadingVariant } from "@/components/ui/ZenoLoading";
import { Modal, View } from "react-native";

const MIN_PIN_LOADING_DURATION_MS = 2000;

export function waitForPinLoading(startedAt: number) {
  const remaining = MIN_PIN_LOADING_DURATION_MS - (Date.now() - startedAt);
  return remaining > 0
    ? new Promise<void>((resolve) => setTimeout(resolve, remaining))
    : Promise.resolve();
}

type PinProcessingOverlayProps = {
  visible: boolean;
  variant?: ZenoLoadingVariant;
};

/** Keeps the PIN screen visible under a dim layer while authentication runs. */
export function PinProcessingOverlay({
  visible,
  variant = "blue",
}: PinProcessingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/55">
        <ZenoLoading variant={variant} />
      </View>
    </Modal>
  );
}
