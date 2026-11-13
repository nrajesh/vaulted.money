import { useTranslation } from "react-i18next";
import { useDismissedHints } from "@/hooks/useDismissedHints";
import { InlinePreview } from "./InlinePreview";
import { FEATURE_HINTS, type FeatureHintId } from "./featureHints";

export const FeatureHint = ({
  id,
  className,
}: {
  id: FeatureHintId;
  className?: string;
}) => {
  const { t } = useTranslation();
  const { isDismissed, dismiss } = useDismissedHints();
  if (isDismissed(id)) return null;

  const fallback = FEATURE_HINTS[id];
  const title = t(`hints.${id}.title`, { defaultValue: fallback.title });
  return (
    <InlinePreview
      className={className}
      title={title}
      body={t(`hints.${id}.body`, { defaultValue: fallback.body })}
      triggerLabel={t("help.aboutTip", {
        title,
        defaultValue: "Tip: {{title}}",
      })}
      onDismiss={() => dismiss(id)}
    />
  );
};
