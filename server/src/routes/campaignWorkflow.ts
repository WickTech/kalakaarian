import { Router, Request, Response } from 'express';
import CampaignWorkflow from '../models/CampaignWorkflow';
import Campaign from '../models/Campaign';
import Proposal from '../models/Proposal';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/:campaignId/workflow', auth, async (req: Request, res: Response) => {
  try {
    let workflow = await CampaignWorkflow.findOne({ campaignId: req.params.campaignId })
      .populate('selectedCreators', 'name email profileImage')
      .populate('videos.influencerId', 'name profileImage');

    if (!workflow) {
      const campaign = await Campaign.findById(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

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
