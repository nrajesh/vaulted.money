import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Category } from "@/data/finance-data";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { Edit, Trash2, Save, X, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

interface ManageSubCategoriesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  category: Category | null;
}

const ManageSubCategoriesDialog: React.FC<ManageSubCategoriesDialogProps> = ({
  isOpen,
  onOpenChange,
  category,
}) => {
  const { transactions, subCategories: dbSubCategories } = useTransactions();
  const {
    addSubCategoryMutation,
    renameSubCategoryMutation,
    deleteSubCategoryMutation,
  } = useCategoryManagement();
  const navigate = useNavigate();

  const [editingSubCategory, setEditingSubCategory] = React.useState<
    string | null
  >(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const [deletingSubCategory, setDeletingSubCategory] = React.useState<
    string | null
  >(null);

  // State for adding new sub-category
  const [newSubCategoryName, setNewSubCategoryName] = React.useState("");

  // Derive sub-categories for this category from transactions and DB
  const subCategories = React.useMemo(() => {
    if (!category) return [];
    const subs = new Set<string>();

    // Add DB sub-categories for this category
    dbSubCategories
      .filter((s) => s.category_id === category.id)
      .forEach((s) => subs.add(s.name));

    // Add used sub-categories from transactions (for backward compatibility/legacy)
    transactions.forEach((t) => {
      if (t.category === category.name && t.sub_category) {
        subs.add(t.sub_category);
      }
    });
    return Array.from(subs).sort();
  }, [category, transactions, dbSubCategories]);

  const subCategoryCounts = React.useMemo(() => {
    if (!category) return {};
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.category === category.name && t.sub_category) {
        counts[t.sub_category] = (counts[t.sub_category] || 0) + 1;
      }
    });
    return counts;
  }, [category, transactions]);

  const handleAddSubCategory = () => {
    if (!category || !newSubCategoryName.trim()) return;
    addSubCategoryMutation.mutate(
      {
        categoryId: category.id,
        name: newSubCategoryName.trim(),
      },
      {
        onSuccess: () => {
          setNewSubCategoryName("");
        },
      },
    );
  };

  const handleStartEdit = (subCategory: string) => {
    setEditingSubCategory(subCategory);
    setEditedName(subCategory);
  };

  const handleCancelEdit = () => {
    setEditingSubCategory(null);
    setEditedName("");
  };

  const handleSaveEdit = (oldName: string) => {
    if (editedName.trim() === "" || editedName === oldName || !category) {
      handleCancelEdit();
      return;
    }
    renameSubCategoryMutation.mutate(
      {
        categoryId: category.id,
        categoryName: category.name,
        oldSubCategoryName: oldName,
        newSubCategoryName: editedName.trim(),
      },
      {
        onSuccess: () => {
          setEditingSubCategory(null);
        },
      },
    );
  };

  const handleDeleteClick = (subCategory: string) => {
    setDeletingSubCategory(subCategory);
  };

  const confirmDelete = () => {
    if (!category || !deletingSubCategory) return;
    deleteSubCategoryMutation.mutate(
      {
        categoryId: category.id,
        categoryName: category.name,
        subCategoryName: deletingSubCategory,
      },
      {
        onSuccess: () => {
          setDeletingSubCategory(null);
        },
      },
    );
  };

  const isLoading =
    addSubCategoryMutation.isPending ||
    renameSubCategoryMutation.isPending ||
    deleteSubCategoryMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Sub-categories</DialogTitle>
            <DialogDescription>
              Manage sub-categories for{" "}
              <span className="font-semibold text-primary">
                {category?.name}
              </span>
              . Changes will update all related transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 my-2">
            <Input
              placeholder="New sub-category name..."
              value={newSubCategoryName}
              onChange={(e) => setNewSubCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSubCategory();
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleAddSubCategory}
              disabled={!newSubCategoryName.trim() || isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right w-[80px]">Txns</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No sub-categories found for this category. Use the input
                      above to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  subCategories.map((sub) => (
                    <TableRow key={sub}>
                      <TableCell>
                        {editingSubCategory === sub ? (
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(sub);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-primary hover:underline"
                            onClick={() => {
                              onOpenChange(false); // Close dialog
                              navigate("/transactions", {
                                state: {
                                  filterCategory: category?.name,
                                  filterSubCategory: sub,
                                },
                              });
                            }}
                          >
                            {sub}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                          onClick={() => {
                            onOpenChange(false); // Close dialog
                            navigate("/transactions", {
                              state: {
                                filterCategory: category?.name,
                                filterSubCategory: sub,
                              },
                            });
                          }}
                        >
                          {subCategoryCounts[sub] || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingSubCategory === sub ? (
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-700 dark:text-green-400"
                                  onClick={() => handleSaveEdit(sub)}
                                  disabled={isLoading}
                                  aria-label="Save"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Save</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={handleCancelEdit}
                                  disabled={isLoading}
                                  aria-label="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cancel</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleStartEdit(sub)}
                                  disabled={isLoading}
                                  aria-label="Edit sub-category"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteClick(sub)}
                                  disabled={isLoading}
                                  aria-label="Delete sub-category"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={!!deletingSubCategory}
        onOpenChange={(open) => !open && setDeletingSubCategory(null)}
        onConfirm={confirmDelete}
        title="Delete Sub-category?"
        description={`This will verify remove the sub-category "${deletingSubCategory}" from all transactions in "${category?.name}" and delete it from the list. This action cannot be undone.`}
        confirmText="Delete"
      />
    </>
  );
};

export default ManageSubCategoriesDialog;
