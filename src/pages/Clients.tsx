import { Plus } from 'lucide-react';
import BaseDataTable from '@/components/BaseDataTable';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { useClients } from '@/hooks/useClients';
import { ScreenLoader } from '@/components/ScreenLoader';
import { Button } from '@/components/ui/button';

const Clients = () => {
  const {
    clients,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    columns,
    isFormOpen,
    editingClient,
    searchTerm,
    handlePageChange,
    handleSearch,
    openAddForm,
    closeForm,
    handleFormSubmit,
    submitting,
  } = useClients();

  return (
    <div className="p-6 space-y-6">
      <ScreenLoader isLoading={loading} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4" />
          New Client
        </Button>
      </div>

      {error ? (
        <div className="text-destructive mb-4">{error}</div>
      ) : (
        <BaseDataTable
          columns={columns}
          data={clients}
          searchPlaceholder="Search by name, email, or phone"
          searchValue={searchTerm}
          onSearch={handleSearch}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) closeForm(); }}
        editingClient={editingClient}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
        submitting={submitting}
      />
    </div>
  );
};

export default Clients;
