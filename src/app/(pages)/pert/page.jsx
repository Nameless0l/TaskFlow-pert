import { Suspense } from 'react';
import PERTContent from './PERTContent';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function PERTPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PERTContent />
    </Suspense>
  );
}
