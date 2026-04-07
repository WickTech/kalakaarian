import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['*'],
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test works' });
});

const handler = serverless(app);
export default handler;