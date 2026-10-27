import * as React from "react";
import { useEntityManagement } from "./useEntityManagement";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Category } from "@/data/finance-data";
import Papa from "papaparse";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { slugify } from "@/lib/utils";
import { saveFile } from "@/utils/backupUtils";

export const useCategoryManagement = () => {
  const { activeLedger } = useLedger();
  const {
    categories,
    subCategories,
    isLoadingCategories,
    refetchCategories,
    invalidateAllData,
    deleteEntity,
  } = useTransactions();
  const navigate = useNavigate();
  const dataProvider = useDataProvider();

  // The sub-category dialog works with names, the provider with ids. Names
  // are unique within a category.
  const findSubCategoryId = async (
    categoryId: string,
    categoryName: string,
    subCategoryName: string,
  ): Promise<string> => {
    if (!activeLedger?.id) throw new Error("No active ledger.");
    const match = (await dataProvider.getSubCategories(activeLedger.id)).find(
      (sub) => sub.category_id === categoryId && sub.name === subCategoryName,
    );
    if (!match) {
      throw new Error(
        `Sub-category "${subCategoryName}" was not found in "${categoryName}"`,
      );
    }
    return match.id;
  };

  const managementProps = useEntityManagement<Category>({
    entityName: "Category",
    entityNamePlural: "categories",
    queryKey: ["categories", activeLedger?.id || ""],
    deleteRpcFn: "delete_categories_batch", // Ignored in local version as generic hook likely needs update too
    isDeletable: (item) => item.name !== "Others",
    onSuccess: invalidateAllData,
    customDeleteHandler: (ids) => deleteEntity("category", ids),
  });

  // Specific mutations for categories that don't fit the generic RPC model
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategoryName: string) => {
      if (!activeLedger?.id) throw new Error("No active ledger.");
      await dataProvider.ensureCategoryExists(
        newCategoryName.trim(),
        activeLedger.id,
      );
    },
    onSuccess: async () => {
      showSuccess("Category added successfully!");
      managementProps.setIsDialogOpen(false);
      await refetchCategories();
    },
    onError: (error: unknown) =>
      showError(`Failed to add category: ${(error as Error).message}`),
  });

  const batchUpsertCategoriesMutation = useMutation({
    mutationFn: async (categoryNames: string[]) => {
      if (!activeLedger?.id) throw new Error("No active ledger.");
      await Promise.all(
        categoryNames.map((name) =>
          dataProvider.ensureCategoryExists(name.trim(), activeLedger.id),
        ),
      );
    },
    onSuccess: async (_data, variables) => {
      showSuccess(`${variables.length} categories imported successfully!`);
      await refetchCategories();
      if (managementProps.fileInputRef.current)
        managementProps.fileInputRef.current.value = "";
    },
    onError: (error: unknown) =>
      showError(`Import failed: ${(error as Error).message}`),
    onSettled: () => managementProps.setIsImporting(false),
  });

  const addSubCategoryMutation = useMutation({
    mutationFn: async ({
      categoryId,
      name,
    }: {
      categoryId: string;
      name: string;
    }) => {
      if (!activeLedger?.id) throw new Error("No active ledger.");
      await dataProvider.ensureSubCategoryExists(
        name.trim(),
        categoryId,
        activeLedger.id,
      );
    },
    onSuccess: async () => {
      showSuccess("Sub-category added successfully!");
      await invalidateAllData();
    },
    onError: (error: unknown) =>
      showError(`Failed to add sub-category: ${(error as Error).message}`),
  });

  const renameSubCategoryMutation = useMutation({
    mutationFn: async ({
      categoryId,
      categoryName,
      oldSubCategoryName,
      newSubCategoryName,
    }: {
      categoryId: string;
      categoryName: string;
      oldSubCategoryName: string;
      newSubCategoryName: string;
    }) => {
      const subCategoryId = await findSubCategoryId(
        categoryId,
        categoryName,
        oldSubCategoryName,
      );
      // Same rename as the Local API: updates the ledger's transactions,
      // recurring transactions and budgets.
      await dataProvider.renameSubCategory(
        subCategoryId,
        newSubCategoryName.trim(),
      );
    },
    onSuccess: async () => {
      showSuccess("Sub-category renamed successfully!");
      await invalidateAllData();
    },
    onError: (error: unknown) =>
      showError(`Failed to rename sub-category: ${(error as Error).message}`),
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: async ({
      categoryId,
      categoryName,
      subCategoryName,
    }: {
      categoryId: string;
      categoryName: string;
      subCategoryName: string;
    }) => {
      const subCategoryId = await findSubCategoryId(
        categoryId,
        categoryName,
        subCategoryName,
      );
      await dataProvider.deleteSubCategory(subCategoryId);
    },
    onSuccess: async () => {
      showSuccess("Sub-category deleted successfully!");
      await invalidateAllData();
    },
    onError: (error: unknown) =>
      showError(`Failed to delete sub-category: ${(error as Error).message}`),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeLedger) return;
    managementProps.setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const hasHeader = results.meta.fields?.includes("Category Name");
        if (!hasHeader) {
          showError(`CSV is missing required header: "Category Name"`);
          managementProps.setIsImporting(false);
          return;
        }

        const categoryNames = new Set<string>();
        const subCategoryMap = new Map<string, string[]>(); // Category -> SubCategories[]

        const parsedData = results.data as Record<string, string | undefined>[];
        parsedData.forEach((row) => {
          const catName = row["Category Name"]?.trim();
          if (catName) {
            categoryNames.add(catName);
            const subName = row["Sub Category Name"]?.trim();
            if (subName) {
              const current = subCategoryMap.get(catName) || [];
              current.push(subName);
              subCategoryMap.set(catName, current);
            }
          }
        });

        if (categoryNames.size === 0) {
          showError("No valid category names found in the CSV file.");
          managementProps.setIsImporting(false);
          return;
        }

        try {
          // 1. Create Categories
          await batchUpsertCategoriesMutation.mutateAsync(
            Array.from(categoryNames),
          );

          // 2. Create Sub-Categories
          // We need IDs of created categories.
          // Since dataProvider.ensureCategoryExists returns ID, we can do it one by one or fetch all categories again.
          // Fetching all categories is safer/easier since we just refreshed in batchUpsert.
          // But batchUpsert is async. We should wait.
          // batchUpsertCategoriesMutation.mutateAsync ALREADY waits for refetchCategories() in onSuccess.
          // Wait, query invalidation might be async.
          // Let's rely on dataProvider.ensureCategoryExists within a loop here to get IDs properly.

          // Actually, let's just use dataProvider directly here for sub-cats to be sure.
          // batchUpsertCategoriesMutation already called ensuredCategoryExists.
          // So now we just need to get the IDs.

          const allCats = await dataProvider.getUserCategories(activeLedger.id);
          const catMap = new Map<string, string>();
          allCats.forEach((c) => catMap.set(c.name, c.id));

          let subCatCount = 0;
          for (const [catName, subNames] of subCategoryMap.entries()) {
            const catId = catMap.get(catName);
            if (catId) {
              for (const subName of subNames) {
                await dataProvider.ensureSubCategoryExists(
                  subName,
                  catId,
                  activeLedger.id,
                );
                subCatCount++;
              }
            }
          }

          if (subCatCount > 0) {
            showSuccess(`Imported ${subCatCount} sub-categories.`);
            await invalidateAllData(); // Refresh everything
          }
        } catch (e: unknown) {
          showError(`Partial import error: ${(e as Error).message}`);
        } finally {
          managementProps.setIsImporting(false);
        }
      },
      error: (error: unknown) => {
        showError(`CSV parsing error: ${(error as Error).message}`);
        managementProps.setIsImporting(false);
      },
    });
  };

  const handleExportClick = () => {
    if (categories.length === 0) {
      showError("No categories to export.");
      return;
    }

    const headers = ["Category Name", "Sub Category Name"];
    const csvContent = [
      headers.join(","),
      ...categories.flatMap((cat) => {
        // If category has sub-categories, create a row for each
        const catSubs = subCategories.filter((s) => s.category_id === cat.id);
        if (catSubs.length > 0) {
          return catSubs.map((sub) =>
            [
              `"${cat.name.replace(/"/g, '""')}"`,
              `"${sub.name.replace(/"/g, '""')}"`,
            ].join(","),
          );
        }
        // If no sub-categories, just export category
        return [[`"${cat.name.replace(/"/g, '""')}"`, ""].join(",")];
      }),
    ].join("\n");

    const BOM = "\uFEFF";
    const csvString = BOM + csvContent;
    const fileName = activeLedger
      ? `${slugify(activeLedger.name)}_categories_export.csv`
      : "categories_export.csv";

    saveFile(fileName, csvString, "Categories Export");
  };

  const handleCategoryNameClick = (categoryName: string) => {
    navigate("/transactions", { state: { filterCategory: categoryName } });
  };

  return {
    ...managementProps,
    categories,
    isLoadingCategories,
    refetchCategories,
    addCategoryMutation,
    handleFileChange,
    handleExportClick,
    handleCategoryNameClick,
    addSubCategoryMutation,
    renameSubCategoryMutation,
    deleteSubCategoryMutation,
    isLoadingMutation:
      addCategoryMutation.isPending ||
      batchUpsertCategoriesMutation.isPending ||
      renameSubCategoryMutation.isPending ||
      deleteSubCategoryMutation.isPending ||
      addSubCategoryMutation.isPending,
  };
};
