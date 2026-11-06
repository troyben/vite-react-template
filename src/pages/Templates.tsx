import { PageHeader } from '@/components/PageHeader';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllTemplates, deleteTemplate, type SketchTemplate } from '../services/templateService';
import { useAuth } from '@/contexts/AuthContext';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateDetailModal from '@/components/templates/TemplateDetailModal';
import { ScreenLoader } from '@/components/ScreenLoader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types/pagination';


const Templates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SketchTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SketchTemplate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0,
  });
  const isMountedFetch = useRef(false);

  const fetchTemplates = useCallback(async (page = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 12 };
      if (activeTab !== 'all') params.type = activeTab;
      if (search) params.search = search;
      const response = await getAllTemplates(params);
      if (response.data.success) {
        setTemplates(response.data.data.items);
        setPagination(response.data.data.pagination);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch on tab change
  useEffect(() => {
    fetchTemplates(1, searchTerm);
  }, [fetchTemplates]);

  // Debounced search -- skips the initial render to avoid a double fetch on mount
  // (the [fetchTemplates] effect above already fetches on mount).
  useEffect(() => {
    if (!isMountedFetch.current) {
      isMountedFetch.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      fetchTemplates(1, searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;

    setDeletingId(id);
    try {
      await deleteTemplate(id);
      fetchTemplates(pagination.page, searchTerm);
    } catch (err) {
      setError('Failed to delete template.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardClick = (template: SketchTemplate) => {
    setSelectedTemplate(template);
    setDetailOpen(true);
  };

  const canDelete = (template: SketchTemplate): boolean => {
    if (!user) return false;
    return user.role === 'admin' || template.createdBy === user.id;
  };

  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-[140px] w-full mb-3 rounded" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'master', label: 'Master' },
    { key: 'mine', label: 'My Templates' },
  ];

  return (
    <div className="flex min-w-0 flex-col p-4 md:p-6">
      <ScreenLoader isLoading={loading && templates.length === 0} />

      {/* Header -- compact row with title, pills, and search */}
      <PageHeader className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Templates</h1>
          <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Search templates"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mb-3">{error}</div>
      )}

      {/* Template grid -- fills remaining space */}
      <div className="min-w-0 p-px">
        {loading && templates.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Try a different search term.' : 'Templates will appear here once created.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                canDelete={canDelete(template)}
                deleting={deletingId === template.id}
                onOpen={() => handleCardClick(template)}
                onDelete={(event) => handleDelete(template.id, event)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous page"
              disabled={pagination.page <= 1}
              onClick={() => fetchTemplates(pagination.page - 1, searchTerm)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next page"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTemplates(pagination.page + 1, searchTerm)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <TemplateDetailModal
        template={selectedTemplate}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default Templates;
