import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['*'],
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

app.get('/test', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Test works' });
});

const handler = serverless(app);

export default function(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}