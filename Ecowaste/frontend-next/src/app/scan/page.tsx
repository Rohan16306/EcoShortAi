import CameraScanner from '@/components/features/CameraScanner';
import { ScannerErrorBoundary } from '@/components/features/ScannerErrorBoundary';
import { Camera, ShieldCheck } from 'lucide-react';

export default function ScanPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Camera className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Scan & Earn</h1>
          <p className="text-gray-600">Point your camera at a recyclable item to earn points.</p>
        </div>
        
        <ScannerErrorBoundary>
          <CameraScanner />
        </ScannerErrorBoundary>
        
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex">
          <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mr-3" />
          <p className="text-sm text-blue-800">
            <strong>Privacy First:</strong> Your camera feed is processed entirely on your device. No images are ever sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
