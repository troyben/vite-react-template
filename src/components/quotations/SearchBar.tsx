interface SearchBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  onClear: () => void;
}

export function SearchBar({ searchTerm, onSearch, onClear }: SearchBarProps) {
  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.2939 12.5786H13.3905L13.0703 12.2699C14.2297 10.9251 14.8669 9.20834 14.8669 7.43342C14.8669 3.32878 11.5381 0 7.43342 0C3.32878 0 0 3.32878 0 7.43342C0 11.5381 3.32878 14.8669 7.43342 14.8669C9.20834 14.8669 10.9251 14.2297 12.2699 13.0703L12.5786 13.3905V14.2939L18.2962 20L20 18.2962L14.2939 12.5786ZM7.43342 12.5786C4.58878 12.5786 2.28818 10.2781 2.28818 7.43342C2.28818 4.58878 4.58878 2.28818 7.43342 2.28818C10.2781 2.28818 12.5786 4.58878 12.5786 7.43342C12.5786 10.2781 10.2781 12.5786 7.43342 12.5786Z"
            fill="#7E88C3"
          />
        </svg>
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
