import { useLanguageStore } from "@/store/language-store";
import { translateText } from "@/lib/localization";
import { Alert, Text as NativeText, TextInput as NativeTextInput, type AlertButton, type AlertOptions, type TextInputProps, type TextProps } from "react-native";
import type { ReactNode } from "react";

function localizeChildren(children: ReactNode, language: "en" | "fr"): ReactNode {
  if (typeof children === "string") return translateText(children, language);
  if (typeof children === "number" || children == null || typeof children === "boolean") return children;
  if (Array.isArray(children)) return children.map((child) => localizeChildren(child, language));
  return children;
}

/** Text wrapper that localizes known UI copy and leaves user-entered content untouched. */
export function LocalizedText({ children, ...props }: TextProps) {
  const language = useLanguageStore((state) => state.language);
  return <NativeText {...props}>{localizeChildren(children, language)}</NativeText>;
}

/** Localizes native input hints without changing the value the user enters. */
export function LocalizedTextInput(props: TextInputProps) {
  const language = useLanguageStore((state) => state.language);
  return (
    <NativeTextInput
      {...props}
      placeholder={props.placeholder ? translateText(props.placeholder, language) : undefined}
      accessibilityLabel={props.accessibilityLabel ? translateText(props.accessibilityLabel, language) : undefined}
    />
  );
}

/** Applies the selected language to native alert copy and action labels. */
export function showLocalizedAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) {
  const language = useLanguageStore.getState().language;
  Alert.alert(
    translateText(title, language),
    message ? translateText(message, language) : undefined,
    buttons?.map((button) => ({
      ...button,
      text: button.text ? translateText(button.text, language) : undefined,
    })),
    options,
  );
}
