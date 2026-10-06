import * as React from "react";
import { renameCategory } from "@/api/entityOps";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { Category } from "@/data/finance-data";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/utils/toast";
import CategoryDeduplicationDialog from "@/components/management/CategoryDeduplicationDialog";
import AddCategoryDialog from "@/components/dialogs/AddCategoryDialog";

import CleanupEntitiesDialog from "@/components/management/CleanupEntitiesDialog";

import ManageSubCategoriesDialog from "@/components/categories/ManageSubCategoriesDialog";

const CategoriesPage = () => {
  const { invalidateAllData, transactions } = useTransactions();
  const managementProps = useCategoryManagement();

  const [editingCategoryId, setEditingCategoryId] = React.useState<
    string | null
  >(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const [managingSubCategory, setManagingSubCategory] =
    React.useState<Category | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateCategoryNameMutation = useMutation({
    mutationFn: async ({
      categoryId,
      newName,
    }: {
      categoryId: string;
      newName: string;
    }) => {
      // Shared with the local API: renames the category and every transaction,
      // scheduled transaction and budget that references it by name.
      const { db } = await import("@/lib/dexieDB");
      const category = await db.categories.get(categoryId);
      if (!category) throw new Error("Category not found");
      await renameCategory(category.user_id, category, newName.trim());
    },
    onSuccess: async () => {
      showSuccess("Category name updated successfully!");
      await invalidateAllData();
      setEditingCategoryId(null);
    },
    onError: (error: unknown) =>
      showError(`Failed to update category name: ${(error as Error).message}`),
  });

  const startEditing = (category: { id: string; name: string }) => {
    setEditingCategoryId(category.id);
    setEditedName(category.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveName = (categoryId: string, originalName: string) => {
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingCategoryId(null);
      return;
    }
    updateCategoryNameMutation.mutate({
      categoryId,
      newName: editedName.trim(),
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    else if (event.key === "Escape") setEditingCategoryId(null);
  };

  // Pre-calculate sub-category counts to avoid running this per row render if it becomes expensive,
  // though for decent list sizes useMemo in cellRenderer or here is fine.
  // Actually, let's just do it in the cellRenderer for simplicity as long as N is small.
  // Better: create a map.
  const { counts, subCategoriesMap } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const subCategoriesMap: Record<string, Set<string>> = {};

    transactions.forEach((t) => {
      if (t.sub_category && t.category) {
        if (!subCategoriesMap[t.category])
          subCategoriesMap[t.category] = new Set();
        subCategoriesMap[t.category].add(t.sub_category);
      }
    });

    Object.keys(subCategoriesMap).forEach((cat) => {
      counts[cat] = subCategoriesMap[cat].size;
    });
    return { counts, subCategoriesMap };
  }, [transactions]);

  const customFilter = (data: Category[], searchTerm: string) => {
    if (!searchTerm) return data;
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter((category) => {
      const nameMatch = category.name.toLowerCase().includes(lowerTerm);
      const subMatch =
        subCategoriesMap[category.name] &&
        Array.from(subCategoriesMap[category.name]).some((sub) =>
          sub.toLowerCase().includes(lowerTerm),
        );
      return nameMatch || subMatch;
    });
  };

  const columns: ColumnDefinition<Category>[] = [
    {
      header: "Name",
      accessor: "name",
      cellRenderer: (item) =>
        editingCategoryId === item.id ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => handleSaveName(item.id, item.name)}
            onKeyDown={(e) => handleKeyDown(e)}
            disabled={updateCategoryNameMutation.isPending}
            className="h-8"
          />
        ) : (
          <div
            onClick={() => managementProps.handleCategoryNameClick(item.name)}
            className="cursor-pointer hover:text-primary hover:underline text-slate-700 dark:text-slate-200 font-medium"
          >
            {item.name}
          </div>
        ),
    },
    {
      header: "Sub-categories",
      accessor: (item) => counts[item.name] || 0,
      cellRenderer: (item) => {
        const count = counts[item.name] || 0;
        const searchTerm = managementProps.searchTerm;
        let matchedSubs: string[] = [];

        if (searchTerm && subCategoriesMap[item.name]) {
          matchedSubs = Array.from(subCategoriesMap[item.name]).filter((sub) =>
            sub.toLowerCase().includes(searchTerm.toLowerCase()),
          );
        }

        return (
          <div
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer flex flex-col gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setManagingSubCategory(item);
            }}
          >
            <div>
              {count} {count === 1 ? "sub-category" : "sub-categories"}
            </div>
            {matchedSubs.length > 0 && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Matches: {matchedSubs.slice(0, 3).join(", ")}
                {matchedSubs.length > 3
                  ? ` +${matchedSubs.length - 3} more`
                  : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Transactions",
      accessor: "totalTransactions",
      cellRenderer: (item) => (
        <span
          className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:text-primary hover:underline"
          onClick={() => managementProps.handleCategoryNameClick(item.name)}
        >
          {item.totalTransactions || 0}
        </span>
      ),
    },
  ];

  return (
    <div className="tour-categories-list">
      <EntityManagementPage
        title="Categories"
        subtitle="Organize transactions with categories and sub-categories"
        entityName="Category"
        entityNamePlural="categories"
        data={managementProps.categories}
        isLoading={managementProps.isLoadingCategories}
        columns={columns}
        AddEditDialogComponent={(props) => (
          <AddCategoryDialog
            isOpen={props.isOpen}
            onOpenChange={props.onOpenChange}
            onSubmit={(name) =>
              managementProps.addCategoryMutation.mutate(name)
            }
            isSubmitting={managementProps.addCategoryMutation.isPending}
          />
        )}
        isDeletable={(item) => item.name !== "Others"}
        customEditHandler={startEditing}
        isEditing={(id) => editingCategoryId === id}
        isUpdating={updateCategoryNameMutation.isPending}
        {...managementProps}
        selectedEntity={managementProps.selectedEntity}
        refetch={managementProps.refetchCategories}
        DeduplicationDialogComponent={CategoryDeduplicationDialog}
        CleanupDialogComponent={(props) => (
          <CleanupEntitiesDialog {...props} entityType="category" />
        )}
        customFilter={customFilter}
      />
      <ManageSubCategoriesDialog
        isOpen={!!managingSubCategory}
        onOpenChange={(open) => !open && setManagingSubCategory(null)}
        category={managingSubCategory}
      />
    </div>
  );
};

export default CategoriesPage;
