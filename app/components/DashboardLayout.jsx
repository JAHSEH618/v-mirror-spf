import { useLocation } from "react-router";

export const DashboardLayout = ({ children, merchantName = "Merchant" }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
};
