import { useState } from 'react';
import { Upload, File, Link as LinkIcon, X, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CampaignFile {
  _id: string;
  fileUrl: string;
  fileType: 'brief' | 'contract' | 'other';
  fileName: string;
  uploadedAt: string;
}

interface CampaignFileUploadProps {
  campaignId: string;
  files: CampaignFile[];
  onUpload: (fileUrl: string, fileName: string, fileType: string) => void;
  onDelete: (fileId: string) => void;
  onNotifyCreators?: () => void;
}

export function CampaignFileUpload({ 
  campaignId, 
  files, 
  onUpload, 
  onDelete,
  onNotifyCreators 
}: CampaignFileUploadProps) {
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'brief' | 'contract' | 'other'>('brief');

  const handleUpload = () => {
    if (fileUrl && fileName) {
      onUpload(fileUrl, fileName, fileType);
      setFileUrl('');
      setFileName('');
      setOpen(false);
    }
  };

  const getFileIcon = (type: string) => {
    return <File className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Campaign Files</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Campaign File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">File Name</label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., Campaign Brief Q1 2026"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">File URL</label>
                <Input
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">File Type</label>
                <div className="flex gap-2">
                  {(['brief', 'contract', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFileType(type)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                        fileType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {type}
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
      </div>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file._id}
              className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.fileType)}
                <div>
                  <p className="text-sm font-medium">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{file.fileType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onDelete(file._id)}
                  className="p-2 hover:bg-secondary rounded-md transition-colors text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {onNotifyCreators && (
            <Button onClick={onNotifyCreators} variant="outline" size="sm" className="w-full mt-2">
              <Send className="w-4 h-4 mr-2" />
              Send to Selected Creators
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
      )}
    </div>
  );
}
