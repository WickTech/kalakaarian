import { useState } from 'react';
import { Upload, Play, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Video {
  _id: string;
  videoUrl: string;
  platform: 'instagram' | 'youtube' | 'file' | 'drive';
  status: 'pending' | 'approved' | 'revision';
  feedback?: string;
  campaignId?: { title: string };
  uploadedAt: string;
}

interface VideoGridProps {
  videos: Video[];
  isOwnProfile: boolean;
  onUpload: (videoUrl: string, platform: string, campaignId?: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500 bg-yellow-500/10', label: 'Pending Review' },
  approved: { icon: CheckCircle, color: 'text-green-500 bg-green-500/10', label: 'Approved' },
  revision: { icon: XCircle, color: 'text-red-500 bg-red-500/10', label: 'Needs Revision' },
};

export function VideoGrid({ videos, isOwnProfile, onUpload }: VideoGridProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'file' | 'drive'>('file');

  const handleUpload = () => {
    if (videoUrl) {
      onUpload(videoUrl, platform);
      setVideoUrl('');
      setUploadOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Uploaded Videos</h2>
        {isOwnProfile && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Campaign Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Video URL / Link</label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <div className="flex gap-2">
                    {(['instagram', 'youtube', 'file', 'drive'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          platform === p
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleUpload} className="w-full">
                  Upload
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No videos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => {
            const status = statusConfig[video.status];
            const StatusIcon = status.icon;
            
            return (
              <div key={video._id} className="relative group">
                <div className="aspect-video bg-card rounded-lg border border-border overflow-hidden">
                  {video.platform === 'file' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={video.videoUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </a>
                  </div>
                </div>
                
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </div>

                {video.feedback && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{video.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
