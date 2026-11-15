import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EntityManagementPage from "./EntityManagementPage";

type Row = { id: string; name: string };

const renderPage = (selectedRows: string[]) =>
  render(
    <MemoryRouter>
      <EntityManagementPage<Row>
        title="Payees"
        entityName="Payee"
        entityNamePlural="Payees"
        data={[{ id: "1", name: "Albert Heijn" }]}
        isLoading={false}
        columns={[]}
        searchTerm=""
        setSearchTerm={vi.fn()}
        currentPage={1}
        setCurrentPage={vi.fn()}
        itemsPerPage={10}
        selectedRows={selectedRows}
        isImporting={false}
        fileInputRef={{ current: null }}
        isLoadingMutation={false}
        handleAddClick={vi.fn()}
        handleEditClick={vi.fn()}
        handleDeleteClick={vi.fn()}
        confirmDelete={vi.fn()}
        handleBulkDeleteClick={vi.fn()}
        handleSelectAll={vi.fn()}
        handleRowSelect={vi.fn()}
        handleImportClick={vi.fn()}
        handleFileChange={vi.fn()}
        handleExportClick={vi.fn()}
        isConfirmOpen={false}
        setIsConfirmOpen={vi.fn()}
        isDialogOpen={false}
        setIsDialogOpen={vi.fn()}
        selectedEntity={null}
        TableComponent={() => <div />}
      />
    </MemoryRouter>,
  );

// The bar is the element that carries the "N selected" text's toolbar class.
const selectionBar = () =>
  screen.getByText(/\d+ selected/).closest(".app-table-toolbar");

describe("EntityManagementPage selection bar", () => {
  it("is hidden at every screen size while nothing is selected", () => {
    renderPage([]);
    const bar = selectionBar();
    expect(bar).toHaveClass("hidden");
    // No breakpoint brings the empty bar back (it showed on tablets).
    expect(bar?.className).not.toMatch(/\b(sm|md|lg|xl):block\b/);
  });

  it("appears once something is selected", () => {
    renderPage(["1"]);
    expect(selectionBar()).not.toHaveClass("hidden");
  });
});
