const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
const app = express();
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const countTotalWords = require("./action");

const PORT = process.env.PORT || 3000;
const path = require("path");
const connectDatabase = require("./config/db");

if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "config/config.env" });
}

connectDatabase();

const countSchema = new mongoose.Schema({
  url: String,
  count: Number,
});
const Count = mongoose.model("Count", countSchema);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/count", async (req, res) => {
    // console.log("fhjsdhvjdfhvj");
  try {
    const url = req.body.url;
    const count = await countTotalWords(url);
    // console.log("count in app---",count);
    const newCount = new Count({ url, count });
    await newCount.save();
    
    res.json({ count });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.post("/screenshots", async (req, res) => {
  const { url } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const pageUrls = await page.$$eval("a", (links) =>
    links.map((link) => link.href)
  );

  const screenshotPromises = pageUrls.map(async (pageUrl) => {
    if (pageUrl.startsWith(url)) {
      const newPage = await browser.newPage();
      await newPage.goto(pageUrl,{ timeout: 60000 });
      const screenshot = await newPage.screenshot({ fullPage: true });
      await newPage.close();

      //uploading the images to cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "screenshots" },
        (err, result) => {
          if (err) {
            console.error(err);
          }
        }
      );
      streamifier.createReadStream(screenshot).pipe(uploadStream);
      return { url: pageUrl, screenshot };
    }
  });

  const screenshots = await Promise.all(screenshotPromises);
  await browser.close();

  const internalPages = screenshots.filter((screenshot) => screenshot);

  res.json({
    pages: internalPages.map(({ url, screenshot }) => ({
      url,
      screenshot: screenshot.toString("base64"),
    })),
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
