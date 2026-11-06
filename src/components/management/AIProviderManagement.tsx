import { Link } from "react-router-dom";
import EntityManagementPage from "./EntityManagementPage";
import { ColumnDefinition } from "./EntityTable";
import { AIProvider } from "@/types/dataProvider";
import AddEditAIProviderDialog from "./AddEditAIProviderDialog";
import { useAIProviderManagement } from "@/hooks/useAIProviderManagement";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const AIProviderManagement = () => {
  const { t } = useTranslation();
  const managementProps = useAIProviderManagement();

  const columns: ColumnDefinition<AIProvider>[] = [
    {
      header: t("aiProviders.columns.name", { defaultValue: "Name" }),
      accessor: "name",
      cellRenderer: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {item.name}
          </span>
          {item.isDefault && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-none"
            >
              {t("aiProviders.columns.default", { defaultValue: "Default" })}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: t("aiProviders.columns.type", { defaultValue: "Type" }),
      accessor: "type",
      cellRenderer: (item) => (
        <Badge
          variant="outline"
          className="font-normal border-slate-200 dark:border-slate-800"
        >
          {item.type}
        </Badge>
      ),
    },
    {
      header: t("aiProviders.columns.model", { defaultValue: "Model" }),
      accessor: "model",
      cellRenderer: (item) => (
        <span className={!item.model ? "text-muted-foreground italic" : ""}>
          {item.model ||
            t("aiProviders.columns.noModel", { defaultValue: "(None)" })}
        </span>
      ),
    },
    {
      header: t("aiProviders.columns.endpoint", { defaultValue: "Endpoint" }),
      accessor: "baseUrl",
      cellRenderer: (item) => (
        <code className="text-xs text-muted-foreground break-all bg-slate-100 dark:bg-slate-800/50 px-1 py-0.5 rounded">
          {item.baseUrl}
        </code>
      ),
    },
  ];

  return (
    <div className="tour-ai-list">
      <EntityManagementPage<AIProvider>
        title={t("aiProviders.page.title", { defaultValue: "AI Providers" })}
        subtitle={
          <div className="flex flex-col gap-1">
            <span className="tour-ai-byok">
              {t("aiProviders.page.subtitle", {
                defaultValue:
                  "Bring Your Own Key (BYOK) for AI analysis. Manage your endpoints and configurations here.",
              })}
            </span>
            <Link
              to="/settings"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
            >
              {t("aiProviders.page.settingsLink", {
                defaultValue: "Go to Settings to manage API keys →",
              })}
            </Link>
          </div>
        }
        entityName={t("aiProviders.page.singular", {
          defaultValue: "AI Provider",
        })}
        entityNamePlural={t("aiProviders.page.plural", {
          defaultValue: "AI providers",
        })}
        data={managementProps.providers}
        columns={columns}
        AddEditDialogComponent={(props) => (
          <AddEditAIProviderDialog
            {...props}
            provider={managementProps.selectedProvider}
            onSuccess={managementProps.refetch}
          />
        )}
        {...managementProps}
      />
    </div>
  );
};

export default AIProviderManagement;
