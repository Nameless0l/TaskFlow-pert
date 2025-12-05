import { Suspense } from 'react';
import VisualizationPage from './VisualizationContent';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    }>
      <VisualizationPage />
    </Suspense>
  );
}