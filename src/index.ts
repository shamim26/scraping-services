import { Request, Response } from "express";
import scrapeRouter from "./routes/scrape.routes";
const cors = require("cors");

const express = require("express");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/scrape", scrapeRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
