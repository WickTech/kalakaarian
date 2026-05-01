import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.post('/:campaignId/files', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { fileUrl, fileType, fileName } = req.body;
    const { campaignId } = req.params;
    const userId = req.user!.userId;

    // Verify brand owns the campaign
    const { data: campaign } = await adminClient.from('campaigns').select('id').eq('id', campaignId).eq('brand_id', userId).single();
    if (!campaign) { res.status(403).json({ message: 'Not authorized' }); return; }

    const { data, error } = await adminClient.from('campaign_files').insert({
      campaign_id: campaignId,
      uploader_id: userId,
      file_url: fileUrl,
      file_type: fileType || 'brief',
      file_name: fileName || 'Untitled',
    }).select().single();
    if (error || !data) { res.status(500).json({ message: 'Error uploading file' }); return; }
    res.json(data);
  } catch { res.status(500).json({ message: 'Error uploading file' }); }
});

router.get('/:campaignId/files', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('campaign_files')
      .select('*, profiles!campaign_files_uploader_id_fkey(name, email)')
      .eq('campaign_id', req.params.campaignId);
    res.json(data ?? []);
  } catch { res.status(500).json({ message: 'Error fetching files' }); }
});

router.delete('/:campaignId/files/:fileId', auth, async (req: AuthRequest, res: Response) => {
  try {
    await adminClient.from('campaign_files').delete()
      .eq('id', req.params.fileId)
      .eq('campaign_id', req.params.campaignId)
      .eq('uploader_id', req.user!.userId);
    res.json({ message: 'File deleted' });
  } catch { res.status(500).json({ message: 'Error deleting file' }); }
});

export default router;
