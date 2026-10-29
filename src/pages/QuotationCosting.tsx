import { useParams } from 'react-router-dom';
import { CostingWorkspace } from '@/components/costing/CostingWorkspace';
export default function QuotationCosting() {
  const { id } = useParams<{ id: string }>();
  return id ? <CostingWorkspace key={id} id={id} /> : null;
}
