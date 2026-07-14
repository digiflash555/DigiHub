import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ReportRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    const isAuthorized = user && (['Admin', 'Association Member', 'Faculty'].includes(user.role));
    return isAuthorized ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default ReportRoute;
