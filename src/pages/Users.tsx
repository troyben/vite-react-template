import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { ScreenLoader } from '@/components/ScreenLoader';
import BaseDataTable from '@/components/BaseDataTable';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { Button } from '@/components/ui/button';

import '@/styles/Users.css';

const Users = () => {
  const { user: currentUser, loading: authLoading } = useAuth();

  // Ensure nothing runs before context is ready
  if (authLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  // Restrict access to admins only
  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ color: '#EC5757', textAlign: 'center', marginTop: 40 }}>
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
    openAddForm,
    closeForm,
    handleFormSubmit,
  } = useUsers(currentUserId);

  return (
    <div className="users-page">
      <ScreenLoader isLoading={loading} />
      <div className="page-header">
        <h1>Users Management</h1>
        <Button onClick={openAddForm}>Add New User</Button>
      </div>
      {error && <div style={{ color: '#EC5757', marginBottom: 16 }}>{error}</div>}
      {!loading && (
        <BaseDataTable columns={columns} data={users} globalFilterPlaceholder="Search users..." />
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
