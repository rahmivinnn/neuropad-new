import express from "express";

const router = express.Router();
const articles: any[] = [];

router.post('/article-simulate/push', (req, res) => {
  const article = { ...req.body, id: `${Date.now()}`, createdAt: Date.now() };
  articles.push(article);
  res.json(article);
});

router.get('/article-simulate/history', (_req, res) => {
  res.json(articles.slice(-50));
});

export default router;