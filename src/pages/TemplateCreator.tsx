import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductEditor, { type ProductEditorHandle } from '@/components/product-editor/ProductEditor';
import { MaterialBreakdownView } from '@/components/CostBreakdown';
import { calculateProductCost } from '@/utils/costCalculator';
import { getAllMaterials } from '@/services/materialService';
import {
  createTemplate,
  getTemplateById,
  updateTemplate,
} from '@/services/templateService';
import { notify } from '@/utils/notifications';
import type { CostBreakdown } from '@/utils/costCalculator';
import type { ProductData } from '@/components/product-editor/types';

const TemplateCreator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<ProductEditorHandle>(null);

  // Template metadata (page-owned)
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [templateDescription, setTemplateDescription] = useState('');
  const [initialData, setInitialData] = useState<ProductData | undefined>(undefined);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Cost dialog
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [costError, setCostError] = useState<string | null>(null);

  // Load template if editing
  useEffect(() => {
    if (!id) return;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return;
    setLoadingTemplate(true);
    getTemplateById(numericId)
      .then((response) => {
        if (response.data.success) {
          const tpl = response.data.data;
          setTemplateId(tpl.id);
          setTemplateName(tpl.name);
          setTemplateDescription(tpl.description || '');
          setInitialData(tpl.sketchData);
        }
      })
      .catch(() => notify.error('Failed to load template'))
      .finally(() => setLoadingTemplate(false));
  }, [id]);

  const handleCalculateCost = useCallback(async () => {
    setCostDialogOpen(true);
    setCostLoading(true);
    setCostBreakdown(null);
    setCostError(null);
    try {
      const response = await getAllMaterials({ limit: 1000 });
      if (response.data.success) {
        const materials = response.data.data.items;
        if (materials.length === 0) {
          setCostError('No materials found. Add materials in the Materials management page to calculate costs.');
          return;
        }
        const productData = editorRef.current?.buildProductData();
        if (!productData) {
          setCostError('Editor is not ready.');
          return;
        }
        setCostBreakdown(calculateProductCost(productData, materials));
      } else {
        setCostError('Failed to load materials.');
      }
    } catch {
      setCostError('Failed to fetch materials. Please try again.');
    } finally {
      setCostLoading(false);
    }
  }, []);

  const handleSaveClick = () => {
    setSaveName(templateName);
    setSaveDescription(templateDescription);
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async () => {
    if (!saveName.trim()) return;
    const sketchData = editorRef.current?.buildProductData();
    if (!sketchData) {
      notify.error('Editor is not ready.');
      return;
    }
    setSaving(true);
    try {
      if (templateId) {
        const response = await updateTemplate(templateId, {
          name: saveName.trim(),
          description: saveDescription.trim(),
          sketchData,
        });
        if (response.data.success) {
          setTemplateName(saveName.trim());
          setTemplateDescription(saveDescription.trim());
          notify.success('Template updated');
          setSaveDialogOpen(false);
        }
      } else {
        const response = await createTemplate({
          name: saveName.trim(),
          description: saveDescription.trim(),
          sketchData,
        });
        if (response.data.success) {
          setTemplateId(response.data.data.id);
          setTemplateName(saveName.trim());
          setTemplateDescription(saveDescription.trim());
          notify.success('Template saved');
          setSaveDialogOpen(false);
        }
      }
    } catch {
      notify.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // ProductEditor is uncontrolled — page-mode onSave/onCancel are unused for now.
  const noopSave = useCallback(() => {}, []);
  const noopCancel = useCallback(() => {}, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="max-w-xs font-semibold"
          placeholder="Template name"
        />
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleCalculateCost}>
          <Package className="h-4 w-4 mr-1" />
          Materials
        </Button>
        <Button size="sm" onClick={handleSaveClick}>
          <Save className="h-4 w-4 mr-1" />
          Save Template
        </Button>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        {loadingTemplate ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ProductEditor
            ref={editorRef}
            mode="page"
            initialData={initialData}
            onSave={noopSave}
            onCancel={noopCancel}
            templateName={templateName}
            onNameChange={setTemplateName}
          />
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Template Name</label>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter template name"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Brief description of this template"
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveConfirm} disabled={saving || !saveName.trim()}>
              {saving ? 'Saving...' : (templateId ? 'Update' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cost Calculation Dialog */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
            {costLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading materials...</p>
              </div>
            )}
            {costError && !costLoading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">{costError}</p>
              </div>
            )}
            {costBreakdown && !costLoading && (
              <MaterialBreakdownView breakdown={costBreakdown} />
            )}
          </div>
          <DialogFooter className="px-6 py-3 border-t shrink-0">
            <Button variant="outline" size="sm" onClick={() => setCostDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateCreator;
