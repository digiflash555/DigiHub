import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return user && user.role === 'Admin' ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default AdminRoute;
