import React from 'react';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/Header';
import { InventoryBatchesModule } from './components/inventory/InventoryBatchesModule';
import { InvoicesModule } from './components/invoices/InvoicesModule';
import { StoreMapModule } from './components/map/StoreMapModule';
import { PosModule } from './components/pos/PosModule';
import { ProductsModule } from './components/products/ProductsModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { UsersModule } from './components/users/UsersModule';
import { AppProvider, useApp } from './context/AppContext';

const MainContent: React.FC = () => {
  const { currentUser, activeTab, currentBranch } = useApp();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="grow">
        {activeTab === 'pos' && <PosModule />}
        {activeTab === 'products' && <ProductsModule />}
        {activeTab === 'batches' && <InventoryBatchesModule />}
        {activeTab === 'map_shelves' && <StoreMapModule />}
        {activeTab === 'invoices' && <InvoicesModule />}
        {activeTab === 'reports' && <ReportsModule />}
        {activeTab === 'users' && <UsersModule />}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <strong>FreshMart Retail Management System (RMS)</strong> · Hệ thống bán lẻ chuỗi thực phẩm sạch
          </div>
          <div className="flex items-center gap-3">
            <span>Chi nhánh hiện tại: <strong>{currentBranch.name}</strong></span>
            <span>·</span>
            <span>Người dùng: <strong>{currentUser.fullName}</strong></span>
            <span>·</span>
            <span>Hỗ trợ bán hàng ngoại tuyến (Offline-First)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
