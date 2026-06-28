'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ScannerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CameraScanner:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMsg: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Camera or AI Error</h2>
          <p className="text-gray-600 mb-6">
            We encountered an issue accessing your camera or loading the WebGL AI engine.
            Please ensure you have granted camera permissions.
          </p>
          <div className="text-xs text-red-500 mb-6 bg-red-50 p-2 rounded break-words">
            {this.state.errorMsg}
          </div>
          <button
            onClick={this.handleReset}
            className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 active:scale-95 active:bg-red-800 transition transform flex items-center justify-center"
          >
            <RefreshCcw className="w-5 h-5 mr-2" /> Reset Camera
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
