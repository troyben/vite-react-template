import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  onClear: () => void;
}

export function SearchBar({ searchTerm, onSearch, onClear }: SearchBarProps) {
  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <Search className="search-icon w-5 h-5" color="#7E88C3" />
        <input
          type="text"
          placeholder="Search by client name"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search" onClick={onClear}>
            &#x2715;
          </button>
        )}
      </div>
    </div>
  );
}
