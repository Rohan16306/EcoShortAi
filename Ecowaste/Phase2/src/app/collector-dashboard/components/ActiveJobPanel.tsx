'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { CheckCircle, MapPin, Clock, Phone, Navigation, Camera, Loader2, ChevronRight, AlertCircle,  } from 'lucide-react';
import type { PickupRequest, RequestStatus } from './CollectorDashboardScreen';

const STATUS_STEPS: { id: RequestStatus; label: string; desc: string }[] = [
  { id: 'accepted', label: 'Accepted', desc: 'You accepted this request' },
  { id: 'on-the-way', label: 'On the Way', desc: 'Traveling to pickup location' },
  { id: 'arrived', label: 'Arrived', desc: 'Reached the customer location' },
  { id: 'collected', label: 'Collected', desc: 'Plastic waste collected' },
  { id: 'completed', label: 'Completed', desc: 'Job marked as done' },
];

const STATUS_ORDER = ['accepted', 'on-the-way', 'arrived', 'collected', 'completed'];

interface Props {
  job: PickupRequest;
  onStatusUpdate: (s: RequestStatus) => void;
  locationSharing: boolean;
  setLocationSharing: (v: boolean) => void;
}

export default function ActiveJobPanel({ job, onStatusUpdate, locationSharing, setLocationSharing }: Props) {
  const [uploading, setUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentIndex = STATUS_ORDER.indexOf(job.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1] as RequestStatus | undefined;

  const nextLabel: Record<string, string> = {
    accepted: 'Start Journey',
    'on-the-way': 'Mark as Arrived',
    arrived: 'Mark as Collected',
    collected: 'Complete Job',
  };

  const handleNextStatus = async () => {
    if (!nextStatus) return;
    if (nextStatus === 'completed') {
      if (!proofUploaded) {
        toast.error('Please upload a proof photo before completing the job');
        return;
      }
      setCompleting(true);
      // BACKEND INTEGRATION: PATCH /api/requests/:id/status + notify user via WebSocket
      await new Promise((r) => setTimeout(r, 1000));
      setCompleting(false);
      toast.success('Job completed! Great work.');
    }
    onStatusUpdate(nextStatus);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // BACKEND INTEGRATION: POST /api/pickups/:id/proof — multipart upload to S3 or Supabase Storage
    await new Promise((r) => setTimeout(r, 1500));
    setUploading(false);
    setProofUploaded(true);
    setProofFileName(file.name);
    toast.success('Proof photo uploaded successfully');
  };

  const handleToggleLocation = () => {
    const next = !locationSharing;
    setLocationSharing(next);
    // BACKEND INTEGRATION: WebSocket emit — start/stop live GPS broadcast every 10s to user
    if (next) {
      toast.success('Live location sharing enabled');
    } else {
      toast.info('Live location sharing paused');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0 bg-primary/5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Active Job</span>
          <span className="text-xs text-muted-foreground">#{job.id}</span>
        </div>
        <h3 className="text-sm font-bold text-foreground">{job.userName}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin size={11} />
          <span className="line-clamp-2">{job.address}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{job.area}</div>
        {job.lat && job.lng && job.lat !== 0 && job.lng !== 0 && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Navigation size={11} />
            Open in Google Maps →
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Job details */}
        <div className="px-4 py-3 border-b border-border">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Waste Type</p>
              <p className="text-sm font-bold text-foreground">{job.wasteType}</p>
            </div>
            <div className="bg-muted rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Est. Quantity</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{job.estimatedKg} kg</p>
            </div>
            <div className="bg-muted rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Pickup Time</p>
              <div className="flex items-center gap-1">
                <Clock size={11} className="text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">{job.preferredTime}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Distance</p>
              <p className="text-sm font-bold text-accent tabular-nums">{job.distance}</p>
            </div>
          </div>
          {job.notes && (
            <div className="mt-2 flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg p-2.5">
              <AlertCircle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Status stepper */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Status Progress</p>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const stepIndex = STATUS_ORDER.indexOf(step.id);
              const isDone = stepIndex < currentIndex;
              const isCurrent = stepIndex === currentIndex;
              const isPending = stepIndex > currentIndex;
              return (
                <div key={`step-${step.id}`} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isDone
                          ? 'bg-primary text-primary-foreground'
                          : isCurrent
                          ? 'bg-accent text-white ring-2 ring-accent/30' :'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle size={13} />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-6 mt-0.5 transition-colors ${
                          isDone ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-2 pt-0.5">
                    <p
                      className={`text-xs font-bold transition-colors ${
                        isCurrent ? 'text-accent' : isDone ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location sharing */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={16} className={locationSharing ? 'text-primary' : 'text-muted-foreground'} />
              <div>
                <p className="text-xs font-semibold text-foreground">Live Location Sharing</p>
                <p className="text-xs text-muted-foreground">Updates every 10 seconds</p>
              </div>
            </div>
            <button
              onClick={handleToggleLocation}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                locationSharing ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              aria-label="Toggle live location sharing"
              role="switch"
              aria-checked={locationSharing}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                  locationSharing ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Proof photo upload — only show when collected or later */}
        {(job.status === 'collected' || job.status === 'arrived') && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Proof Photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {proofUploaded ? (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg p-2.5">
                <CheckCircle size={16} className="text-primary" />
                <div>
                  <p className="text-xs font-semibold text-primary">Photo uploaded</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">{proofFileName}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-all"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {uploading ? 'Uploading...' : 'Upload proof photo'}
              </button>
            )}
          </div>
        )}

        {/* Contact & Navigate */}
        <div className="px-4 py-3">
          {job.lat && job.lng && job.lat !== 0 && job.lng !== 0 && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all mb-2"
            >
              <Navigation size={15} />
              Navigate to Pickup Location
            </a>
          )}
          <a
            href={`tel:${job.phone}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all mb-2"
          >
            <Phone size={15} />
            Call {job.userName}
          </a>
          <p className="text-xs text-center text-muted-foreground">
            Tap Navigate to open Google Maps with exact directions. Call the customer for any issues.
          </p>
        </div>
      </div>

      {/* Action button */}
      {nextStatus && (
        <div className="px-4 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={handleNextStatus}
            disabled={completing || (nextStatus === 'completed' && !proofUploaded)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {completing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {nextLabel[job.status] ?? 'Next Step'}
                <ChevronRight size={16} />
              </>
            )}
          </button>
          {nextStatus === 'completed' && !proofUploaded && (
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              Upload a proof photo to complete this job
            </p>
          )}
        </div>
      )}
    </div>
  );
}