import { LocalizedText as Text, showLocalizedAlert } from "@/components/ui/LocalizedText";
import { images } from "@/constants/images";
import { getDeviceSessions, revokeDeviceSession } from "@/features/security/session-service";
import type { DeviceSession } from "@/features/security/session-service";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/clerk-expo";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TrashIcon() {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3" stroke="#071706" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="5.5" width="18" height="2" rx="1" fill="#071706" />
    </Svg>
  );
}

function formatLastActive(timestamp: number, language: "en" | "fr") {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function getDeviceDescription(session: DeviceSession) {
  if (session.deviceName) return session.osName ? `${session.deviceName} · ${session.osName}` : session.deviceName;
  if (session.browserName) return session.browserName;
  if (session.isMobile || session.deviceType?.toLowerCase().includes("mobile")) return "Appareil mobile";
  return "Navigateur Web";
}

function getPlatformName(session: DeviceSession | undefined, fallback: string) {
  if (session?.osName) return session.osName;
  if (session?.platform === "ios") return "iOS";
  if (session?.platform === "android") return "Android";
  if (session?.platform === "web") return "Web";
  return fallback;
}

function parseCachedSessions(raw: string | null): DeviceSession[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item): item is DeviceSession =>
      Boolean(item && typeof item.id === "string" && typeof item.isCurrent === "boolean" && typeof item.lastActiveAt === "number"),
    );
  } catch {
    return null;
  }
}

async function readSessionCache(key: string) {
  try {
    const raw = Platform.OS === "web" ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
    return parseCachedSessions(raw);
  } catch {
    return null;
  }
}

async function writeSessionCache(key: string, sessions: DeviceSession[]) {
  const value = JSON.stringify(sessions);
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const language = useLanguageStore((state) => state.language);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const localDeviceName = Device.modelName || Device.deviceName || (language === "fr" ? "Cet appareil" : "This device");
  const cacheKey = userId ? `zeno_device_sessions_${userId}` : null;

  const loadSessions = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (cacheKey) {
        const cached = await readSessionCache(cacheKey);
        if (!signal?.aborted && cached) {
          setSessions(cached);
          setIsLoading(false);
        }
      }
      const token = await getTokenRef.current();
      if (!token) {
        setLoadError("Session Clerk indisponible. Reconnecte-toi puis réessaie.");
        return;
      }
      const result = await getDeviceSessions(token, signal);
      if (signal?.aborted) return;
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setSessions(result.data.sessions);
      if (cacheKey) {
        void writeSessionCache(cacheKey, result.data.sessions.slice(0, 12)).catch(() => {});
      }
    } catch {
      if (!signal?.aborted) setLoadError("Impossible de charger les appareils pour le moment.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const controller = new AbortController();
    void loadSessions(controller.signal);
    return () => controller.abort();
  }, [isLoaded, isSignedIn, loadSessions]);

  const confirmRevoke = (session: DeviceSession) => {
    showLocalizedAlert(
      "Déconnecter cet appareil ?",
      "Cette session sera fermée sur cet appareil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: () => { void revokeSession(session); },
        },
      ],
    );
  };

  const revokeSession = async (session: DeviceSession) => {
    if (revokingId) return;
    setRevokingId(session.id);
    try {
      const token = await getToken();
      const result = token ? await revokeDeviceSession(token, session.id) : null;
      if (!result?.ok) {
        showLocalizedAlert("Erreur", result && !result.ok ? result.error : "Une erreur est survenue. Réessaie.");
        return;
      }
      setSessions((current) => {
        const updated = current.filter((item) => item.id !== session.id);
        if (cacheKey) void writeSessionCache(cacheKey, updated.slice(0, 12)).catch(() => {});
        return updated;
      });
      showLocalizedAlert("Appareil déconnecté", "La session de cet appareil a été fermée.");
    } catch {
      showLocalizedAlert("Erreur", "Impossible de déconnecter cet appareil pour le moment.");
    } finally {
      setRevokingId(null);
    }
  };

  const currentSession = sessions.find((session) => session.isCurrent);
  const otherSessions = sessions.filter((session) => !session.isCurrent);

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 px-5">
        <Pressable
          className="mt-2 h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>

        <Text allowFontScaling={false} className="mb-7 mt-6 font-bold text-[28px] leading-[34px] text-zeno-text-primary">
          Appareils et sessions
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
            {currentSession ? (
              <View className="mb-5 rounded-[22px] bg-white px-5 py-5 shadow-xs">
                <Text className="font-semibold text-[19px] leading-6 text-zeno-text-primary">
                  {currentSession.deviceName || localDeviceName} ({"Appareil actuel"})
                </Text>
                <Text className="mt-1.5 text-[16px] text-[#777777]">Actuellement connecté</Text>
                <Text className="mt-2 text-[15px] text-[#A0A0A0]">
                  {"Connecté via la plateforme"} {getPlatformName(currentSession, currentSession.isMobile ? "Mobile" : "Web")}
                </Text>
              </View>
            ) : (
              <View className="mb-5 rounded-[22px] bg-white px-5 py-5 shadow-xs">
                <Text className="font-semibold text-[19px] leading-6 text-zeno-text-primary">
                  {localDeviceName} ({"Appareil actuel"})
                </Text>
                <Text className="mt-1.5 text-[16px] text-[#777777]">Actuellement connecté</Text>
                <Text className="mt-2 text-[15px] text-[#A0A0A0]">
                  {"Connecté via la plateforme"} {Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web"}
                </Text>
              </View>
            )}

            {otherSessions.map((session) => (
              <View key={session.id} className="mb-5 min-h-[116px] flex-row items-start rounded-[22px] bg-white px-5 py-5 shadow-xs">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-[19px] leading-6 text-zeno-text-primary">
                    {getDeviceDescription(session)}{!session.deviceName && session.deviceType ? ` · ${session.deviceType}` : ""}
                  </Text>
                  <Text className="mt-1.5 text-[16px] leading-5 text-[#777777]">
                    {"Dernière connexion :"} {formatLastActive(session.lastActiveAt, language)}
                  </Text>
                  <Text className="mt-2 text-[15px] text-[#A0A0A0]">
                    {"Connecté via la plateforme"} {getPlatformName(session, session.isMobile ? "Mobile" : "Web")}
                  </Text>
                </View>
                <Pressable
                  className="h-10 w-10 items-center justify-center rounded-full"
                  onPress={() => confirmRevoke(session)}
                  disabled={revokingId === session.id}
                  accessibilityRole="button"
                  accessibilityLabel={language === "fr" ? "Déconnecter cet appareil" : "Sign out this device"}
                >
                  {revokingId === session.id ? <ActivityIndicator size="small" color="#0057FF" /> : <TrashIcon />}
                </Pressable>
              </View>
            ))}

            {isLoading ? <ActivityIndicator className="my-4" color="#0057FF" /> : null}

            {loadError ? (
              <View className="mb-4 rounded-[22px] bg-white p-5">
                <Text className="text-[15px] text-zeno-text-secondary">{loadError}</Text>
                <Pressable className="mt-4 self-start rounded-full bg-[#C7FF4A] px-5 py-3" onPress={() => void loadSessions()}>
                  <Text className="font-semibold text-[15px] text-zeno-text-primary">Retry</Text>
                </Pressable>
              </View>
            ) : null}

            {!isLoading && !loadError && !otherSessions.length ? (
              <View className="rounded-[22px] bg-white px-5 py-6">
                <Text className="font-semibold text-[17px] text-zeno-text-primary">Aucun autre appareil connecté</Text>
                <Text className="mt-2 text-[14px] text-zeno-text-secondary">Les autres sessions actives apparaîtront ici.</Text>
              </View>
            ) : null}
        </ScrollView>
      </View>
    </View>
  );
}
