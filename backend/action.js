const cheerio = require("cheerio");
const axios = require("axios");


const getInternalLinks = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const internalLinks = [];
  $("a").each((i, link) => {
    const href = $(link).attr("href");
    if (href && (href.startsWith("/") || href.startsWith(url))) {
      internalLinks.push(href);
    }
  });

  return internalLinks;
};

//counting words of a single page
const countWords = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const text = $("body").text();
  const words = text.split(/\s+/);

  return words.length;
};

//iterating over all links and then counting total words
const countTotalWords = async (url) => {
  const internalLinks = await getInternalLinks(url);
  let totalWords = 0;

  for (const link of internalLinks) {
    const linkUrl = link.startsWith("/") ? url + link : link;
    const linkWords = await countWords(linkUrl);
    totalWords += linkWords;
  }

  return totalWords;
};

module.exports = countTotalWords;
