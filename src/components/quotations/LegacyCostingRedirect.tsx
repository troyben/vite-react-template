import { Navigate, useParams } from 'react-router-dom';

export const LegacyCostingRedirect: React.FC = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/quotations/${id}` : '/quotations'} replace />;
};
