import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const existingPlugins = config.plugins ?? [];
  const hasDiditPlugin = existingPlugins.some((plugin) => {
    const pluginName = typeof plugin === "string"
      ? plugin
      : Array.isArray(plugin)
        ? plugin[0]
        : null;
    return pluginName === "@didit-protocol/sdk-react-native";
  });
  const diditPlugin: NonNullable<ExpoConfig["plugins"]> = [
    ["@didit-protocol/sdk-react-native", { iosVariant: "autodetection", androidVariant: "autodetection" }],
  ];

  return {
    ...config,
    name: config.name ?? "ZENO",
    slug: config.slug ?? "zeno",
    scheme: config.scheme ?? "zeno",
    icon: "./assets/Frame 573.png",
    android: {
      ...config.android,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: "./assets/Frame 573.png",
        backgroundColor: "#C4EC5C",
      },
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSCameraUsageDescription:
          "ZENO uses your camera to capture your identity document and verify your identity.",
        NSMicrophoneUsageDescription:
          "ZENO uses your microphone to record the liveness check required to verify your identity.",
        NSPhotoLibraryUsageDescription:
          "ZENO accesses selected photos only if you choose to upload an identity document.",
      },
    },
    plugins: [
      ...existingPlugins,
      ...(!existingPlugins.includes("@clerk/expo") ? ["@clerk/expo"] : []),
      ...(!existingPlugins.includes("@clerk/expo-google-signin") ? ["@clerk/expo-google-signin"] : []),
      ...(hasDiditPlugin ? [] : diditPlugin),
    ],
    extra: {
      ...config.extra,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      EXPO_PUBLIC_FINANCIAL_SANDBOX:
        process.env.EXPO_PUBLIC_FINANCIAL_SANDBOX ??
        (process.env.NODE_ENV === "production" ? "false" : "true"),
      EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID:
        process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID:
        process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID:
        process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME:
        process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME,
    },
  };
};
