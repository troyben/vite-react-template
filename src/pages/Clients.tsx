import BaseDataTable from '@/components/BaseDataTable';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { useClients } from '@/hooks/useClients';
import { ScreenLoader } from '@/components/ScreenLoader';
import { Button } from '@/components/ui/button';
import '@/styles/Clients.css';

const Clients = () => {
  const {
    clients,
    loading,
    error,
    currentPage,
    totalPages,
    columns,
    isFormOpen,
    editingClient,
    handlePageChange,
    openAddForm,
    closeForm,
    handleFormSubmit,
  } = useClients();

  return (
    <div className="clients-container">
      <ScreenLoader isLoading={loading} />
      <div className="page-header">
        <h1>Clients</h1>
        <Button onClick={openAddForm}>
          Add New Client
        </Button>
      </div>

      {error ? (
        <div className="error">{error}</div>
      ) : (
        <BaseDataTable
          columns={columns}
          data={clients}
          globalFilterPlaceholder='Search by name, email, or phone'
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) closeForm(); }}
        editingClient={editingClient}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
      />
    </div>
  );
};

export default Clients;
