import { useState, useEffect } from 'react';
import { getAllTemplates, type SketchTemplate } from '../services/templateService';
import type { ProductData } from '@/components/product-sketch/types';
import MiniSketchPreview from '@/components/MiniSketchPreview';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';

interface TemplatePickerProps {
  onSelect: (data: ProductData) => void;
  onClose: () => void;
}

type TabValue = 'all' | 'master' | 'mine';

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect, onClose }) => {
  const [templates, setTemplates] = useState<SketchTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (type?: string, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 50 };
      if (type && type !== 'all') params.type = type;
      if (search) params.search = search;
      const response = await getAllTemplates(params);
      setTemplates(response.data.success ? response.data.data.items : []);
    } catch (err) {
      setError('Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(activeTab, searchTerm);
  }, [activeTab]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTemplates(activeTab, searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleSelect = (template: SketchTemplate) => {
    // Deep copy to avoid reference mutations
    const deepCopy: ProductData = JSON.parse(JSON.stringify(template.sketchData));
    onSelect(deepCopy);
    onClose();
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'master', label: 'Master' },
    { value: 'mine', label: 'My Templates' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Select Template</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tab buttons */}
        <div className="mb-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading templates...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-sm text-destructive">
              {error}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No templates found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="cursor-pointer rounded-lg border bg-card p-3 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex justify-center rounded bg-muted/30 p-1">
                    <MiniSketchPreview sketch={template.sketchData} widthPx={140} heightPx={80} />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{template.name}</span>
                      {template.isMaster && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Master</Badge>
                      )}
                    </div>
                    {template.creator && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        by {template.creator.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePicker;
