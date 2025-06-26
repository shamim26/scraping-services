import { Router, Request, Response } from "express";
import { getProductSuggestions } from "../automation";

const scrapeRouter = Router();

scrapeRouter.post("/suggestions", async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body;
    const suggestions = await getProductSuggestions(name, category);
    res.json({ suggestions });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Scraping failed", details: (err as Error).message });
  }
});

export default scrapeRouter;
