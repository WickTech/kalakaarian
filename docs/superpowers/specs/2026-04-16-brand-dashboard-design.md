# Brand Dashboard - Campaign File Upload & Workflow

**Date:** 2026-04-16  
**Status:** Approved

## Overview

Add campaign file upload capability and workflow tracking to the Brand Dashboard, allowing brands to upload briefs, track campaign progress through stages, and manage uploaded videos.

---

## Features

### 1. Campaign File Upload
- **Purpose**: Upload campaign brief documents (PDF, DOC, Drive links)
- **Storage**: URL/link storage (no local file storage needed)
- **Model**: `CampaignFile`
  ```typescript
  {
    campaignId: ObjectId,
    fileUrl: string,
    fileType: 'brief' | 'contract' | 'other',
    fileName: string,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }
  ```
- **Auto-notify**: Brief URL sent to selected creators via message

### 2. Campaign Workflow Tracking
- **Stages**: Selected → Shooting → Uploaded → Payment Done
- **Visual**: Horizontal timeline stepper
- **Model**: `CampaignWorkflow`
  ```typescript
  {
    campaignId: ObjectId,
    selectedCreators: [ObjectId],
    shooting: boolean,
    shootingAt: Date,
    uploaded: boolean,
    uploadedAt: Date,
    paymentDone: boolean,
    paymentAt: Date,
    notes: string
  }
  ```

### 3. Video Review
- **Purpose**: Review videos uploaded by creators
- **Actions**: Approve, Request Revision
- **Feedback**: Optional text feedback per video
- **Status**: pending → approved | revision

### 4. Previous Campaigns Section
- List completed campaigns with video links
- Download option for videos
- Invoice links (future: PDF generation)

---

## Backend Changes

### New Models
1. **CampaignFile**: campaignId, fileUrl, fileType, fileName, uploadedBy, uploadedAt
2. **CampaignWorkflow**: campaignId, selectedCreators, shooting, uploaded, paymentDone, timestamps

### New Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns/:id/files` | Upload campaign file |
| GET | `/api/campaigns/:id/files` | List campaign files |
| POST | `/api/campaigns/:id/workflow` | Create/update workflow |
| GET | `/api/campaigns/:id/workflow` | Get workflow status |
| PUT | `/api/campaigns/:id/workflow/stage` | Update workflow stage |
| GET | `/api/campaigns/:id/videos` | Get uploaded videos |
| PUT | `/api/campaigns/:id/videos/:videoId` | Approve/reject video |

---

## Frontend Changes

### Components
1. **WorkflowTimeline** - Horizontal stepper with 4 stages
2. **CampaignFileUpload** - File/brief upload section
3. **VideoReviewGrid** - Grid of uploaded videos with actions

### BrandDashboard Enhancements
- Expandable campaign rows showing workflow
- File upload modal per campaign
- Video review section

---

## Implementation Order

1. Backend models (CampaignFile, CampaignWorkflow)
2. Backend routes
3. WorkflowTimeline component
4. CampaignFileUpload component
5. VideoReviewGrid component
6. BrandDashboard integration

---

## Success Criteria
- Brand can upload brief files to campaigns
- Workflow timeline shows progress stages
- Brand can mark stages complete
- Videos from creators can be reviewed
