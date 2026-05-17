import { useState } from 'react';
import { Upload, File, Link as LinkIcon, X, Send, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BRIEF_INSTRUCTIONS = [
  "Keep the brief clear, simple, and easy to understand.",
  "Mention all campaign requirements clearly.",
  "Specify the platform and deliverables (e.g. Instagram – Reel (UGC Video) & Story).",
  "Clearly mention the script, posting format, and instructions.",
  "Mention all mandatory tags, hashtags, and brand mentions.",
  "If a store visit is required, add the location link and full address.",
  "If the brief is unclear, incomplete, or outdated, the platform and creator will not be responsible for any issues.",
];

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
  const [acknowledged, setAcknowledged] = useState(false);

  const handleUpload = () => {
    if (fileUrl && fileName && acknowledged) {
      onUpload(fileUrl, fileName, fileType);
      setFileUrl('');
      setFileName('');
      setAcknowledged(false);
      setOpen(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setAcknowledged(false);
  };

  const getFileIcon = (type: string) => {
    return <File className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Campaign Files</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Campaign File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Brief Instructions */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">Campaign Brief Guidelines</p>
                <ul className="space-y-2">
                  {BRIEF_INSTRUCTIONS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

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

              {/* Acknowledgment */}
              <button
                type="button"
                onClick={() => setAcknowledged(v => !v)}
                className="flex items-start gap-2.5 w-full text-left group"
              >
                {acknowledged
                  ? <CheckSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-purple-400 transition-colors" />
                }
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I confirm the campaign brief is complete and accurate.
                </span>
              </button>

              <Button onClick={handleUpload} className="w-full" disabled={!acknowledged || !fileUrl || !fileName}>
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
