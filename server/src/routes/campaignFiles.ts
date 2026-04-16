import { Router, Request, Response } from 'express';
import CampaignFile from '../models/CampaignFile';
import Campaign from '../models/Campaign';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/:campaignId/files', auth, async (req: Request, res: Response) => {
  try {
    const { fileUrl, fileType, fileName } = req.body;
    const campaignId = req.params.campaignId;
    const userId = (req as any).userId;

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
