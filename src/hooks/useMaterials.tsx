import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import * as materialApi from '@/services/materialService';
import type { Material, MaterialCategory } from '@/services/materialService';
import { notify } from '@/utils/notifications';
import { confirm } from '@/utils/notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  frame_profile: 'Frame Profile',
  glass: 'Glass',
  hardware: 'Hardware',
  accessory: 'Accessory',
};

const UNIT_LABELS: Record<string, string> = {
  per_meter: '/m',
  per_sqm: '/m\u00B2',
  per_piece: '/pc',
  per_kg: '/kg',
};

const CATEGORY_COLORS: Record<MaterialCategory, string> = {
  frame_profile: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  glass: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  hardware: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  accessory: 'bg-violet-100 text-violet-800 hover:bg-violet-100',
};

import { formatCurrency } from '@/config/currency';
export { formatCurrency };

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ZAR: 'R',
  EUR: '\u20AC',
  GBP: '\u00A3',
  INR: '\u20B9',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '\u00A5',
};

export { CATEGORY_LABELS, UNIT_LABELS, CATEGORY_COLORS, CURRENCY_SYMBOLS };

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | ''>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchMaterials = useCallback(async (page: number, search?: string, category?: MaterialCategory | '') => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 10, search };
      if (category) params.category = category;
      const response = await materialApi.getAllMaterials(params);
      if (response.data.success) {
        setMaterials(response.data.data.items);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
        setCurrentPage(response.data.data.pagination.page);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch materials');
      notify.error(err.message || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials(1, '', '');
  }, [fetchMaterials]);

  const handlePageChange = useCallback((page: number) => {
    fetchMaterials(page, searchTerm, categoryFilter);
  }, [fetchMaterials, searchTerm, categoryFilter]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMaterials(1, term, categoryFilter);
    }, 300);
  }, [fetchMaterials, categoryFilter]);

  const handleCategoryFilter = useCallback((category: MaterialCategory | '') => {
    setCategoryFilter(category);
    fetchMaterials(1, searchTerm, category);
  }, [fetchMaterials, searchTerm]);

  const openAddForm = useCallback(() => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((material: Material) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingMaterial(null);
  }, []);

  const handleFormSubmit = useCallback(async (data: materialApi.CreateMaterialData) => {
    try {
      if (editingMaterial) {
        const response = await materialApi.updateMaterial(editingMaterial.id, data);
        if (response.data.success) {
          notify.success('Material updated successfully');
        }
      } else {
        const response = await materialApi.createMaterial(data);
        if (response.data.success) {
          notify.success('Material created successfully');
        }
      }
      closeForm();
      fetchMaterials(currentPage, searchTerm, categoryFilter);
    } catch (err: any) {
      notify.error(err.message || 'Failed to save material');
    }
  }, [editingMaterial, closeForm, fetchMaterials, currentPage, searchTerm, categoryFilter]);

  const handleDelete = useCallback(async (materialId: number) => {
    const confirmed = await confirm({
      title: 'Delete Material',
      text: 'Are you sure you want to delete this material? This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await materialApi.deleteMaterial(materialId);
      if (response.data.success) {
        notify.success('Material deleted successfully');
        fetchMaterials(currentPage, searchTerm, categoryFilter);
      }
    } catch (err: any) {
      notify.error(err.message || 'Failed to delete material');
    }
  }, [fetchMaterials, currentPage, searchTerm, categoryFilter]);

  const handleToggleDefault = useCallback(async (material: Material) => {
    const newValue = !material.isDefault;
    // Optimistic update
    setMaterials(prev => prev.map(m =>
      m.id === material.id ? { ...m, isDefault: newValue } : m
    ));
    try {
      const response = await materialApi.updateMaterial(material.id, { isDefault: newValue });
      if (response.data.success) {
        notify.success(newValue ? 'Set as default material' : 'Removed default status');
      } else {
        // Revert on failure
        setMaterials(prev => prev.map(m =>
          m.id === material.id ? { ...m, isDefault: material.isDefault } : m
        ));
        notify.error('Failed to update default status');
      }
    } catch {
      // Revert on error
      setMaterials(prev => prev.map(m =>
        m.id === material.id ? { ...m, isDefault: material.isDefault } : m
      ));
      notify.error('Failed to update default status');
    }
  }, []);

  const columns = useMemo<ColumnDef<Material, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: info => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          {info.row.original.description && (
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {info.row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: info => {
        const cat = info.getValue() as MaterialCategory;
        return (
          <Badge variant="secondary" className={CATEGORY_COLORS[cat]}>
            {CATEGORY_LABELS[cat]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: info => UNIT_LABELS[info.getValue() as string] || info.getValue(),
    },
    {
      accessorKey: 'costPrice',
      header: 'Cost Price',
      cell: info => {
        const material = info.row.original;
        const code = material.currency || 'USD';
        const symbol = CURRENCY_SYMBOLS[code] || code;
        const num = Number(info.getValue());
        const formatted = isNaN(num) ? '0.00' : num.toFixed(2);
        return `${symbol} ${formatted}`;
      },
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
      cell: info => (info.getValue() as string) || 'USD',
    },
    {
      id: 'isDefault',
      header: 'Default',
      enableSorting: false,
      cell: info => {
        const material = info.row.original;
        const isDefault = !!material.isDefault;
        return (
          <button
            type="button"
            onClick={() => handleToggleDefault(material)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors hover:bg-muted"
            title={isDefault ? 'Remove default' : 'Set as default'}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                isDefault
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: info => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openEditForm(info.row.original)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">Edit</div>
                  <div className="text-xs text-muted-foreground">Modify material details</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(info.row.original.id)} className="cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">Delete</div>
                  <div className="text-xs text-muted-foreground">Remove this material</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [openEditForm, handleDelete, handleToggleDefault]);

  return {
    materials,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    columns,
    isFormOpen,
    editingMaterial,
    searchTerm,
    categoryFilter,
    handlePageChange,
    handleSearch,
    handleCategoryFilter,
    openAddForm,
    closeForm,
    handleFormSubmit,
  };
}
