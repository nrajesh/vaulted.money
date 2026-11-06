import ScheduledBackups from "@/components/backup/ScheduledBackups";
import { useTranslation } from "react-i18next";

const BackupPage = () => {
  const { t } = useTranslation();
  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("backup.page.title", { defaultValue: "Backup" })}
          </h1>
          <p className="app-page-subtitle">
            {t("backup.page.subtitle", {
              defaultValue:
                "Configure automated backups for your peace of mind.",
            })}
          </p>
        </div>
      </div>
      <div className="tour-backup-settings">
        <ScheduledBackups />
      </div>
    </div>
  );
};

export default BackupPage;
