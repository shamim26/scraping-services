import { Router, Request, Response } from "express";
import { getPhoneSuggestions } from "../automation";

const scrapeRouter = Router();

scrapeRouter.post("/suggestions", async (req: Request, res: Response) => {
  try {
    const { search } = req.body;
    const suggestions = await getPhoneSuggestions(
      "https://gadgetandgear.com/brand",
      search
    );
    res.json(suggestions);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Scraping failed", details: (err as Error).message });
  }
});

export default scrapeRouter;
