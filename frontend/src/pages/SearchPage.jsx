import { SearchBar } from "../components/SearchBar";
import { JobList } from "../components/JobList";

export const SearchPage = ({
  searchQuery,
  onSearchChange,
  onSearch,
  jobs,
  sortedJobs,
  sortBy,
  onSortChange,
  showSortMenu,
  onToggleSortMenu,
  loading,
}) => {
  return (
    <div>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearch={onSearch}
        loading={loading}
      />
      <JobList
        jobs={jobs}
        sortedJobs={sortedJobs}
        sortBy={sortBy}
        onSortChange={onSortChange}
        showSortMenu={showSortMenu}
        onToggleSortMenu={onToggleSortMenu}
        loading={loading}
      />
    </div>
  );
};


