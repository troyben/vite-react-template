import { Link } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { useQuotationList } from '@/hooks/useQuotationList';
import { ScreenLoader } from '@/components/ScreenLoader';
import { SearchBar } from '@/components/quotations/SearchBar';
import { QuotationCard } from '@/components/quotations/QuotationCard';
import { Pagination } from '@/components/quotations/Pagination';
import '@/styles/QuotationList.css';

const QuotationList = () => {
  const {
    loading,
    clients,
    searchTerm,
    currentPage,
    totalPages,
    currentQuotations,
    filteredQuotations,
    handleDelete,
    handleSearch,
    clearSearch,
    setCurrentPage,
  } = useQuotationList();

  return (
    <div className="quotations-page">
      <ScreenLoader isLoading={loading} />
      <div className="header">
        <div className="header-left">
          <h1>Quotations</h1>
        </div>
        <div className="header-actions">
          <Link to="/quotations/new" className="btn btn-primary">
            <Plus className="w-4 h-4" style={{ marginRight: '8px' }} />
            Create New Quotation
          </Link>
        </div>
      </div>

      <SearchBar searchTerm={searchTerm} onSearch={handleSearch} onClear={clearSearch} />

      {filteredQuotations.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="w-12 h-12" />
          {searchTerm ? (
            <p>No quotations found matching "<strong>{searchTerm}</strong>"</p>
          ) : (
            <>
              <p>No quotations found</p>
              <p>Create your first quotation to get started</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="quotation-list-container">
            <div className="quotation-list">
              {currentQuotations.map(quotation => (
                <QuotationCard
                  key={quotation.id}
                  quotation={quotation}
                  client={clients[quotation.clientId]}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default QuotationList;
