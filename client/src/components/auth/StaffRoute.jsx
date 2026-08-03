import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StaffRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    const isStaff = user && (['Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator'].includes(user.role));
    return isStaff ? <Outlet /> : <Navigate to="/login" />;
};

export default StaffRoute;
