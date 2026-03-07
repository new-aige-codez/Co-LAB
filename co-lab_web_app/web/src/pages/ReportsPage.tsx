import { useEffect } from 'react';
import { useReportsStore, type SavedReport } from '../store/reportsStore';
import { ResearchSidebar } from '../components/research/ResearchSidebar';
import { ReportsListView } from '../components/research/ReportsListView';
import { ReportDetailView } from '../components/research/ReportDetailView';

export default function ReportsPage() {
  const {
    reports,
    selectedReport,
    isLoading,
    fetchReports,
    selectReport,
    toggleStar,
    deleteReport,
    updateReport,
  } = useReportsStore();

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSelectReport = (report: SavedReport) => {
    selectReport(report);
  };

  const handleBack = () => {
    selectReport(null);
  };

  const handleToggleStar = async (id: string) => {
    await toggleStar(id);
  };

  const handleDeleteReport = async (id: string) => {
    await deleteReport(id);
  };

  const handleUpdateTitle = async (id: string, title: string) => {
    await updateReport(id, { title });
  };

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Left sidebar with icons */}
      <ResearchSidebar />

      {/* Main content */}
      <div className="flex-1 flex">
        {selectedReport ? (
          <ReportDetailView
            report={selectedReport}
            onBack={handleBack}
            onToggleStar={handleToggleStar}
            onUpdateTitle={handleUpdateTitle}
          />
        ) : (
          <ReportsListView
            reports={reports}
            isLoading={isLoading}
            onSelectReport={handleSelectReport}
            onToggleStar={handleToggleStar}
            onDeleteReport={handleDeleteReport}
          />
        )}
      </div>
    </div>
  );
}
