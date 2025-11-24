import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { NavigationTabs } from "./components/NavigationTabs";
import { LoadingScreen } from "./components/LoadingScreen";
import { Notification } from "./components/Notification";
import { SearchPage } from "./pages/SearchPage";
import { UploadPage } from "./pages/UploadPage";
import { MatchesPage } from "./pages/MatchesPage";
import { fetchJobs, refreshJobs } from "./utils/api";
import { sortJobs } from "./utils/jobSorter";

const NaviCVApp = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("search");
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setLoading(false);
    fetchJobs().then(setJobs).catch((err) => {
      setError("Failed to fetch jobs. Please try again.");
      console.error("Error fetching jobs:", err);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortMenu && !event.target.closest(".relative")) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortMenu]);

  const sortedJobs = useMemo(() => sortJobs(jobs, sortBy), [jobs, sortBy]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLoading(true);
      setError("");
      try {
        const data = await fetchJobs(searchQuery);
        setJobs(data);
      } catch (err) {
        setError("Failed to fetch jobs. Please try again.");
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshJobs();
      const data = await fetchJobs();
      setJobs(data);
      setSuccess("Jobs data refreshed successfully!");
    } catch (err) {
      setError("Failed to refresh jobs data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && jobs.length === 0 && !resumeAnalysis) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header onRefresh={handleRefresh} loading={loading} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          matchCount={matchedJobs.length}
        />
      </div>

      <Notification
        error={error}
        success={success}
        onClose={() => {
          setError("");
          setSuccess("");
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === "search" && (
          <SearchPage
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            jobs={jobs}
            sortedJobs={sortedJobs}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showSortMenu={showSortMenu}
            onToggleSortMenu={() => setShowSortMenu(!showSortMenu)}
            loading={loading}
          />
        )}

        {activeTab === "upload" && (
          <UploadPage
            resumeAnalysis={resumeAnalysis}
            onResumeAnalysis={setResumeAnalysis}
            onMatchedJobs={setMatchedJobs}
            onTabChange={setActiveTab}
            matchedJobsCount={matchedJobs.length}
          />
        )}

        {activeTab === "matches" && (
          <MatchesPage matchedJobs={matchedJobs} onTabChange={setActiveTab} />
        )}
      </main>

      <Footer onTabChange={setActiveTab} hasMatches={matchedJobs.length > 0} />
    </div>
  );
};

export default NaviCVApp;
