import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { useAuthTransitionStore } from "@/store/auth-transition-store";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** A brief progress overlay shown while Clerk signs the user out. */
export function LogoutModal({ visible, onClose }: LogoutModalProps) {
  const { signOut } = useAuth();
  const setSigningOut = useAuthTransitionStore((state) => state.setSigningOut);
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (!visible) {
      logoutStarted.current = false;
      return;
    }
    if (logoutStarted.current) return;

    logoutStarted.current = true;
    const startedAt = Date.now();
    setSigningOut(true);

    void (async () => {
      try {
        await signOut();

        // Keep the progress feedback visible long enough to register on fast connections.
        const remainingFeedbackTime = 650 - (Date.now() - startedAt);
        if (remainingFeedbackTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingFeedbackTime));
        }

        router.replace("/welcome");
        // Keep the root-level logo visible until the public screen has mounted.
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSigningOut(false);
        onClose();
      } catch {
        logoutStarted.current = false;
        setSigningOut(false);
        onClose();
        showLocalizedAlert("Erreur", "Une erreur est survenue. Réessaie.");
      }
    })();
  }, [onClose, setSigningOut, signOut, visible]);

  return null;
}
