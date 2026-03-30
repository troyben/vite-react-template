import { Link } from 'react-router-dom';
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M8 1V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create New Quotation
          </Link>
        </div>
      </div>

      <SearchBar searchTerm={searchTerm} onSearch={handleSearch} onClear={clearSearch} />

      {filteredQuotations.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 7L11.8845 4.76892C11.5634 4.1268 10.9344 3.71429 10.2309 3.71429H4.76923C3.79149 3.71429 3 4.50578 3 5.48352V18.5165C3 19.4942 3.79149 20.2857 4.76923 20.2857H19.2308C20.2085 20.2857 21 19.4942 21 18.5165V9.28571C21 8.30797 20.2085 7.51649 19.2308 7.51649L13 7Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 7H13L21 7" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
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
