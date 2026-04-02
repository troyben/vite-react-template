import { Plus, Package } from 'lucide-react';
import BaseDataTable from '@/components/BaseDataTable';
import { MaterialFormDialog } from '@/components/materials/MaterialFormDialog';
import { useMaterials } from '@/hooks/useMaterials';
import { ScreenLoader } from '@/components/ScreenLoader';
import { Button } from '@/components/ui/button';
import type { MaterialCategory } from '@/services/materialService';

const CATEGORY_FILTERS: { value: MaterialCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'frame_profile', label: 'Frame Profiles' },
  { value: 'glass', label: 'Glass' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'accessory', label: 'Accessories' },
];

const Materials = () => {
  const {
    materials,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    columns,
    isFormOpen,
    editingMaterial,
    searchTerm,
    categoryFilter,
    handlePageChange,
    handleSearch,
    handleCategoryFilter,
    openAddForm,
    closeForm,
    handleFormSubmit,
    submitting,
  } = useMaterials();

  return (
    <div className="p-6 space-y-6">
      <ScreenLoader isLoading={loading} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Materials</h1>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORY_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={categoryFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryFilter(filter.value as MaterialCategory | '')}
            className="rounded-full"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="text-destructive mb-4">{error}</div>
      ) : materials.length === 0 && !loading && !searchTerm && !categoryFilter ? (
        <EmptyState onAdd={openAddForm} />
      ) : (
        <BaseDataTable
          columns={columns}
          data={materials}
          searchPlaceholder="Search by material name..."
          searchValue={searchTerm}
          onSearch={handleSearch}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}

      <MaterialFormDialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) closeForm(); }}
        editingMaterial={editingMaterial}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
        submitting={submitting}
      />
    </div>
  );
};

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-1">No materials yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add raw materials like frame profiles, glass, hardware, and accessories to calculate product costs.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add First Material
      </Button>
    </div>
  );
}

export default Materials;
