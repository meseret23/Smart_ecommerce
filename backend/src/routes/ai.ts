import { Router, Request, Response } from 'express';
import { processUserMessage } from '../services/aiShoppingService';

const router = Router();

// POST /api/ai/chat
router.post('/chat', async (req: Request, res: Response) => {
    console.log('➡️ Received AI chat request:', req.body);
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        console.log('🔄 Calling processUserMessage...');
        const result = await processUserMessage(message);
        console.log('✅ AI processing complete, sending response.');

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('❌ Error in route:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;