import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { ZenoLoading } from "@/components/ui/ZenoLoading";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DOCUMENTS = {
  terms: {
    title: "Terms of Use",
    url: "https://app.notion.com/p/409e1855a18981f087b4dcfa099cc2d3",
  },
  privacy: {
    title: "Privacy Policy",
    url: "https://app.notion.com/p/409e1855a1898132ba48fcc591e60429",
  },
  fees: {
    title: "Fees and Limits",
    url: "https://app.notion.com/p/409e1855a189818ea5eae18a4622e7f5",
  },
} as const;

export default function LegalDocumentScreen() {
  const insets = useSafeAreaInsets();
  const { document } = useLocalSearchParams<{ document?: string }>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const selected = document && document in DOCUMENTS
    ? DOCUMENTS[document as keyof typeof DOCUMENTS]
    : null;
  const documentUrl = selected?.url ?? null;
  const webViewSource = useMemo(
    () => documentUrl ? { uri: documentUrl } : undefined,
    [documentUrl]
  );

  useEffect(() => {
    setLoading(Boolean(documentUrl));
    setFailed(false);
  }, [documentUrl]);

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>
        <Text allowFontScaling={false} className="ml-4 flex-1 font-bold text-[20px] text-zeno-text-primary" numberOfLines={1}>
          {selected?.title ?? "Legal document"}
        </Text>
      </View>

      {selected ? (
        <View className="relative flex-1 overflow-hidden rounded-t-[24px] bg-white">
          <WebView
            source={webViewSource}
            className="flex-1 bg-white"
            onLoadStart={() => setFailed(false)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 400) {
                setLoading(false);
                setFailed(true);
              }
            }}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            setSupportMultipleWindows={false}
            startInLoadingState={false}
          />
          {loading ? (
            <View className="absolute inset-0 items-center justify-center bg-white">
              <ZenoLoading variant="blue" size={24} />
            </View>
          ) : null}
          {failed ? (
            <View className="absolute inset-0 items-center justify-center bg-white px-8">
              <Text allowFontScaling={false} className="text-center text-[16px] text-zeno-text-secondary">
                Unable to load this document. Check your connection and try again.
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text allowFontScaling={false} className="text-center text-[16px] text-zeno-text-secondary">
            Document not found.
          </Text>
        </View>
      )}
    </View>
  );
}
