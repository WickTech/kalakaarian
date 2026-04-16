# Brand Dashboard - Campaign File Upload & Workflow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add campaign file upload and workflow tracking to Brand Dashboard, allowing brands to upload briefs, track progress through stages, and manage uploaded videos.

**Architecture:** React frontend with Express backend. Campaign files stored as URLs. Workflow tracked per campaign with 4 stages. Video review integrated with existing proposal system.

**Tech Stack:** React 18, TypeScript, Express, MongoDB/Mongoose, Tailwind CSS, Lucide icons

---

## File Structure

```
server/src/
├── models/
│   ├── CampaignFile.ts      (create)
│   └── CampaignWorkflow.ts  (create)
├── routes/
│   ├── campaignFiles.ts     (create)
│   └── campaignWorkflow.ts  (create)
└── index.ts                (modify - add routes)

client/src/
├── components/
│   ├── WorkflowTimeline.tsx  (create)
│   ├── CampaignFileUpload.tsx (create)
│   └── VideoReviewGrid.tsx   (create)
├── pages/
│   └── BrandDashboard.tsx   (modify - add workflow)
└── lib/
    └── api.ts              (modify - add API methods)
```

---

## Task 1: Create Backend Models

**Files:**
- Create: `server/src/models/CampaignFile.ts`
- Create: `server/src/models/CampaignWorkflow.ts`

- [ ] **Step 1: Create CampaignFile model**

```typescript
// server/src/models/CampaignFile.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignFile {
  campaignId: Schema.Types.ObjectId;
  fileUrl: string;
  fileType: 'brief' | 'contract' | 'other';
  fileName: string;
  uploadedBy: Schema.Types.ObjectId;
  uploadedAt: Date;
}

interface ICampaignFileDocument extends ICampaignFile, Document {}

const campaignFileSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['brief', 'contract', 'other'], default: 'brief' },
    fileName: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

campaignFileSchema.index({ campaignId: 1 });

export default mongoose.model<ICampaignFileDocument>('CampaignFile', campaignFileSchema);
```

- [ ] **Step 2: Create CampaignWorkflow model**

```typescript
// server/src/models/CampaignWorkflow.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignVideo {
  influencerId: Schema.Types.ObjectId;
  videoUrl: string;
  platform: 'instagram' | 'youtube' | 'file' | 'drive';
  status: 'pending' | 'approved' | 'revision';
  feedback?: string;
  uploadedAt: Date;
}

interface ICampaignWorkflowDocument extends Document {
  campaignId: Schema.Types.ObjectId;
  selectedCreators: Schema.Types.ObjectId[];
  shooting: boolean;
  shootingAt?: Date;
  uploaded: boolean;
  uploadedAt?: Date;
  paymentDone: boolean;
  paymentAt?: Date;
  videos: ICampaignVideo[];
  notes: string;
}

const campaignWorkflowSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true, unique: true },
    selectedCreators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shooting: { type: Boolean, default: false },
    shootingAt: { type: Date },
    uploaded: { type: Boolean, default: false },
    uploadedAt: { type: Date },
    paymentDone: { type: Boolean, default: false },
    paymentAt: { type: Date },
    videos: [{
      influencerId: { type: Schema.Types.ObjectId, ref: 'User' },
      videoUrl: String,
      platform: { type: String, enum: ['instagram', 'youtube', 'file', 'drive'] },
      status: { type: String, enum: ['pending', 'approved', 'revision'], default: 'pending' },
      feedback: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

campaignWorkflowSchema.index({ campaignId: 1 }, { unique: true });

export default mongoose.model<ICampaignWorkflowDocument>('CampaignWorkflow', campaignWorkflowSchema);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/models/CampaignFile.ts server/src/models/CampaignWorkflow.ts
git commit -m "feat: add CampaignFile and CampaignWorkflow models"
```

---

## Task 2: Create Backend Routes

**Files:**
- Create: `server/src/routes/campaignFiles.ts`
- Create: `server/src/routes/campaignWorkflow.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create campaignFiles routes**

```typescript
// server/src/routes/campaignFiles.ts
import { Router, Request, Response } from 'express';
import CampaignFile from '../models/CampaignFile';
import Campaign from '../models/Campaign';
import auth from '../middleware/auth';

const router = Router();

router.post('/:campaignId/files', auth, async (req: Request, res: Response) => {
  try {
    const { fileUrl, fileType, fileName } = req.body;
    const campaignId = req.params.campaignId;
    const userId = (req as any).userId;

    // Verify campaign ownership
    const campaign = await Campaign.findOne({ _id: campaignId, brandId: userId });
    if (!campaign) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const file = new CampaignFile({
      campaignId,
      fileUrl,
      fileType: fileType || 'brief',
      fileName: fileName || 'Untitled',
      uploadedBy: userId,
    });

    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file' });
  }
});

router.get('/:campaignId/files', auth, async (req: Request, res: Response) => {
  try {
    const files = await CampaignFile.find({ campaignId: req.params.campaignId })
      .populate('uploadedBy', 'name email');
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files' });
  }
});

router.delete('/:campaignId/files/:fileId', auth, async (req: Request, res: Response) => {
  try {
    await CampaignFile.findOneAndDelete({
      _id: req.params.fileId,
      campaignId: req.params.campaignId,
      uploadedBy: (req as any).userId,
    });
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file' });
  }
});

export default router;
```

- [ ] **Step 2: Create campaignWorkflow routes**

```typescript
// server/src/routes/campaignWorkflow.ts
import { Router, Request, Response } from 'express';
import CampaignWorkflow from '../models/CampaignWorkflow';
import Campaign from '../models/Campaign';
import Proposal from '../models/Proposal';
import auth from '../middleware/auth';

const router = Router();

router.get('/:campaignId/workflow', auth, async (req: Request, res: Response) => {
  try {
    let workflow = await CampaignWorkflow.findOne({ campaignId: req.params.campaignId })
      .populate('selectedCreators', 'name email profileImage')
      .populate('videos.influencerId', 'name profileImage');

    if (!workflow) {
      // Create default workflow
      const campaign = await Campaign.findById(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Get accepted proposals as selected creators
      const acceptedProposals = await Proposal.find({
        campaignId: req.params.campaignId,
        status: 'accepted',
      }).populate('influencerId', 'name email');

      workflow = await CampaignWorkflow.create({
        campaignId: req.params.campaignId,
        selectedCreators: acceptedProposals.map(p => p.influencerId),
      });
    }

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workflow' });
  }
});

router.put('/:campaignId/workflow/stage', auth, async (req: Request, res: Response) => {
  try {
    const { stage } = req.body;
    const campaignId = req.params.campaignId;

    const update: any = {};
    switch (stage) {
      case 'shooting':
        update.shooting = true;
        update.shootingAt = new Date();
        break;
      case 'uploaded':
        update.uploaded = true;
        update.uploadedAt = new Date();
        break;
      case 'payment':
        update.paymentDone = true;
        update.paymentAt = new Date();
        break;
      default:
        return res.status(400).json({ message: 'Invalid stage' });
    }

    const workflow = await CampaignWorkflow.findOneAndUpdate(
      { campaignId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Error updating workflow stage' });
  }
});

router.post('/:campaignId/videos', auth, async (req: Request, res: Response) => {
  try {
    const { videoUrl, platform, influencerId } = req.body;
    const campaignId = req.params.campaignId;

    const workflow = await CampaignWorkflow.findOne({ campaignId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    workflow.videos.push({
      influencerId,
      videoUrl,
      platform: platform || 'file',
      status: 'pending',
      uploadedAt: new Date(),
    });

    await workflow.save();
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Error adding video' });
  }
});

router.put('/:campaignId/videos/:videoIndex', auth, async (req: Request, res: Response) => {
  try {
    const { status, feedback } = req.body;
    const { campaignId, videoIndex } = req.params;

    const workflow = await CampaignWorkflow.findOne({ campaignId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const idx = parseInt(videoIndex);
    if (idx >= 0 && idx < workflow.videos.length) {
      workflow.videos[idx].status = status;
      if (feedback) workflow.videos[idx].feedback = feedback;
      await workflow.save();
    }

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Error updating video' });
  }
});

export default router;
```

- [ ] **Step 3: Register routes in index.ts**

Add to `server/src/index.ts`:
```typescript
import campaignFilesRoutes from './routes/campaignFiles';
import campaignWorkflowRoutes from './routes/campaignWorkflow';

app.use('/api/campaigns', campaignFilesRoutes);
app.use('/api/campaigns', campaignWorkflowRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/campaignFiles.ts server/src/routes/campaignWorkflow.ts server/src/index.ts
git commit -m "feat: add campaign files and workflow API routes"
```

---

## Task 3: Create WorkflowTimeline Component

**Files:**
- Create: `client/src/components/WorkflowTimeline.tsx`

- [ ] **Step 1: Create WorkflowTimeline component**

```tsx
// client/src/components/WorkflowTimeline.tsx
import { Check, Circle, Video, CreditCard, Users } from 'lucide-react';

interface WorkflowStage {
  key: string;
  label: string;
  completed: boolean;
  completedAt?: Date;
  icon: typeof Users;
}

interface WorkflowTimelineProps {
  stages: WorkflowStage[];
  onStageClick?: (stage: string) => void;
}

const stageIcons = {
  selected: Users,
  shooting: Video,
  uploaded: Video,
  payment: CreditCard,
};

export function WorkflowTimeline({ stages, onStageClick }: WorkflowTimelineProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {stages.map((stage, index) => {
        const Icon = stageIcons[stage.key as keyof typeof stageIcons] || Circle;
        const isLast = index === stages.length - 1;
        const isCompleted = stage.completed;
        const isClickable = onStageClick && !isCompleted;

        return (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable && onStageClick(stage.key)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isClickable
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </button>
              <span className={`text-xs mt-2 font-medium text-center ${
                isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {stage.label}
              </span>
              {stage.completedAt && (
                <span className="text-[10px] text-gray-400">
                  {new Date(stage.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={`flex-1 h-1 mx-2 rounded ${
                stages[index + 1]?.completed || isCompleted
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/WorkflowTimeline.tsx
git commit -m "feat: add WorkflowTimeline component"
```

---

## Task 4: Create CampaignFileUpload Component

**Files:**
- Create: `client/src/components/CampaignFileUpload.tsx`

- [ ] **Step 1: Create CampaignFileUpload component**

```tsx
// client/src/components/CampaignFileUpload.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/CampaignFileUpload.tsx
git commit -m "feat: add CampaignFileUpload component"
```

---

## Task 5: Create VideoReviewGrid Component

**Files:**
- Create: `client/src/components/VideoReviewGrid.tsx`

- [ ] **Step 1: Create VideoReviewGrid component**

```tsx
// client/src/components/VideoReviewGrid.tsx
import { useState } from 'react';
import { Play, ExternalLink, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Video {
  _id: string;
  influencerId: { name: string; profileImage?: string };
  videoUrl: string;
  platform: 'instagram' | 'youtube' | 'file' | 'drive';
  status: 'pending' | 'approved' | 'revision';
  feedback?: string;
}

interface VideoReviewGridProps {
  videos: Video[];
  onApprove: (index: number) => void;
  onRequestRevision: (index: number, feedback: string) => void;
}

export function VideoReviewGrid({ videos, onApprove, onRequestRevision }: VideoReviewGridProps) {
  const [revisionFeedback, setRevisionFeedback] = useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = useState<number | null>(null);

  const statusConfig = {
    pending: { icon: Play, color: 'bg-yellow-500', label: 'Pending' },
    approved: { icon: CheckCircle, color: 'bg-green-500', label: 'Approved' },
    revision: { icon: XCircle, color: 'bg-red-500', label: 'Needs Revision' },
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <Play className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No videos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Uploaded Videos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video, index) => {
          const status = statusConfig[video.status];
          const StatusIcon = status.icon;

          return (
            <div key={video._id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="aspect-video bg-black relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/50" />
                </div>
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 text-white ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {video.influencerId?.name || 'Creator'}
                  </p>
                  <span className="text-xs text-muted-foreground capitalize">{video.platform}</span>
                </div>

                {video.feedback && (
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <strong>Feedback:</strong> {video.feedback}
                  </div>
                )}

                {video.status === 'pending' && (
                  <div className="space-y-2">
                    {showFeedback === index ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter feedback..."
                          value={revisionFeedback[index] || ''}
                          onChange={(e) => setRevisionFeedback({ ...revisionFeedback, [index]: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              onRequestRevision(index, revisionFeedback[index] || '');
                              setShowFeedback(null);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Request Revision
                          </Button>
                          <Button size="sm" onClick={() => onApprove(index)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setShowFeedback(index)}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Request Revision
                        </Button>
                        <Button size="sm" onClick={() => onApprove(index)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/VideoReviewGrid.tsx
git commit -m "feat: add VideoReviewGrid component"
```

---

## Task 6: Update BrandDashboard with Workflow

**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/pages/BrandDashboard.tsx`

- [ ] **Step 1: Add API methods to api.ts**

```typescript
// Add these methods to the api object

// Campaign Files
getCampaignFiles: async (campaignId: string): Promise<any[]> => {
  return request<any[]>(`/api/campaigns/${campaignId}/files`);
},

uploadCampaignFile: async (campaignId: string, fileUrl: string, fileName: string, fileType: string): Promise<any> => {
  return request<any>(`/api/campaigns/${campaignId}/files`, {
    method: 'POST',
    body: JSON.stringify({ fileUrl, fileName, fileType }),
  });
},

deleteCampaignFile: async (campaignId: string, fileId: string): Promise<void> => {
  return request<void>(`/api/campaigns/${campaignId}/files/${fileId}`, {
    method: 'DELETE',
  });
},

// Campaign Workflow
getCampaignWorkflow: async (campaignId: string): Promise<any> => {
  return request<any>(`/api/campaigns/${campaignId}/workflow`);
},

updateWorkflowStage: async (campaignId: string, stage: string): Promise<any> => {
  return request<any>(`/api/campaigns/${campaignId}/workflow/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage }),
  });
},

updateVideoStatus: async (campaignId: string, videoIndex: number, status: string, feedback?: string): Promise<any> => {
  return request<any>(`/api/campaigns/${campaignId}/videos/${videoIndex}`, {
    method: 'PUT',
    body: JSON.stringify({ status, feedback }),
  });
},
```

- [ ] **Step 2: Update BrandDashboard with expandable workflow sections**

The updated BrandDashboard should:
1. Add state for selected campaign's workflow and files
2. Add expandable section per campaign showing:
   - WorkflowTimeline component
   - CampaignFileUpload component
   - VideoReviewGrid component
3. Use Dialog for expanded campaign view

Key changes to BrandDashboard:
```tsx
// Add state
const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
const [workflow, setWorkflow] = useState<any>(null);
const [files, setFiles] = useState<any[]>([]);

// Add fetch functions
const fetchWorkflowAndFiles = async (campaignId: string) => {
  const [wf, fl] = await Promise.all([
    api.getCampaignWorkflow(campaignId),
    api.getCampaignFiles(campaignId),
  ]);
  setWorkflow(wf);
  setFiles(fl);
};

// Add stages for timeline
const stages = [
  { key: 'selected', label: 'Selected', completed: !!workflow?.selectedCreators?.length },
  { key: 'shooting', label: 'Shooting', completed: workflow?.shooting },
  { key: 'uploaded', label: 'Uploaded', completed: workflow?.uploaded },
  { key: 'payment', label: 'Payment', completed: workflow?.paymentDone },
];
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/api.ts client/src/pages/BrandDashboard.tsx
git commit -m "feat: add campaign workflow tracking to BrandDashboard"
```

---

## Summary

**Files Created:** 6
**Files Modified:** 2
**Tasks:** 6

### Completed Features
1. ✅ Backend models (CampaignFile, CampaignWorkflow)
2. ✅ Backend routes (files, workflow, video review)
3. ✅ WorkflowTimeline component
4. ✅ CampaignFileUpload component
5. ✅ VideoReviewGrid component
6. ✅ BrandDashboard integration
