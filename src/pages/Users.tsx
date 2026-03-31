import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { ScreenLoader } from '@/components/ScreenLoader';
import BaseDataTable from '@/components/BaseDataTable';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { Button } from '@/components/ui/button';

const Users = () => {
  const { user: currentUser, loading: authLoading } = useAuth();

  if (authLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-destructive text-center mt-10">
        Access denied. Only admins can manage users.
      </div>
    );
  }

  return <UsersContent currentUserId={currentUser.id} />;
};

function UsersContent({ currentUserId }: { currentUserId: number }) {
  const {
    users,
    columns,
    loading,
    error,
    isFormOpen,
    editingUser,
    formError,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    openAddForm,
    closeForm,
    handleFormSubmit,
    handlePageChange,
    handleSearch,
  } = useUsers(currentUserId);

  return (
    <div className="p-6 space-y-6">
      <ScreenLoader isLoading={loading} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>
      {error && <div className="text-destructive mb-4">{error}</div>}
      {!loading && (
        <BaseDataTable
          columns={columns}
          data={users}
          searchPlaceholder="Search users..."
          searchValue={searchTerm}
          onSearch={handleSearch}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}
      <UserFormDialog
        open={isFormOpen}
        editingUser={editingUser}
        formError={formError}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default Users;
