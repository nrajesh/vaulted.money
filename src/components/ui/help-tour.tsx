import React from "react";
import { Joyride, type EventData, STATUS } from "react-joyride";
import { useTour } from "@/contexts/TourContext";
import { useTheme as useNextTheme } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";

const HelpTour: React.FC = () => {
  const { isActive, currentSteps, stopTour } = useTour();
  const { resolvedTheme } = useNextTheme();
  const { t } = useTranslation();
  const isDarkMode = resolvedTheme === "dark";

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      stopTour();
    }
  };

  // Skip rendering if no steps or not active
  if (!currentSteps.length || !isActive) {
    return null;
  }

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={isActive}
      scrollToFirstStep
      steps={currentSteps}
      options={{
        zIndex: 10000,
        primaryColor: isDarkMode ? "#3b82f6" : "#2563eb", // Tailwind blue-500 / blue-600
        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff", // gray-800 / white
        textColor: isDarkMode ? "#f3f4f6" : "#111827", // gray-100 / gray-900
        arrowColor: isDarkMode ? "#1f2937" : "#ffffff",
        buttons: ["back", "primary", "skip"],
        scrollOffset: 100,
        skipScroll: false,
        scrollDuration: 400,
        showProgress: true,
      }}
      locale={{
        back: t("helpTour.back"),
        close: t("helpTour.last"),
        last: t("helpTour.last"),
        next: t("helpTour.next"),
        open: t("helpTour.start"),
        skip: t("helpTour.skip"),
      }}
      styles={{
        tooltip: {
          fontFamily: "inherit",
          borderRadius: "12px",
          padding: "14px",
          fontSize: "0.9rem",
          lineHeight: "1.4",
        },
        buttonClose: {
          display: "none",
        },
        buttonPrimary: {
          backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
          borderRadius: "6px",
          color: "#ffffff",
          padding: "6px 12px",
          fontSize: "0.85rem",
          fontWeight: 600,
          outline: "none",
        },
        buttonBack: {
          color: isDarkMode ? "#9ca3af" : "#6b7280", // gray-400 / gray-500
          marginRight: "8px",
          fontSize: "0.85rem",
        },
        buttonSkip: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          fontSize: "0.85rem",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipContent: {
          padding: "10px 0",
        },
        tooltipTitle: {
          fontSize: "0.95rem",
          fontWeight: 600,
          marginBottom: "5px",
        },
      }}
    />
  );
};

export default HelpTour;
