export const sortJobs = (jobs, sortBy) => {
  const jobsCopy = [...jobs];
  
  switch (sortBy) {
    case "latest":
      return jobsCopy.sort((a, b) => {
        const dateA = a.posted_date ? new Date(a.posted_date) : new Date(0);
        const dateB = b.posted_date ? new Date(b.posted_date) : new Date(0);
        return dateB - dateA;
      });
    case "relevance":
      return jobsCopy.sort((a, b) => {
        const scoreA = a.match_score || 0;
        const scoreB = b.match_score || 0;
        return scoreB - scoreA;
      });
    case "salary":
      return jobsCopy.sort((a, b) => {
        const salaryA = a.salary_min || a.salary_max || 0;
        const salaryB = b.salary_min || b.salary_max || 0;
        return salaryB - salaryA;
      });
    default:
      return jobsCopy;
  }
};


