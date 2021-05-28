const puppeteer = require("puppeteer");
const sharp = require("sharp");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.set("port", process.env.PORT || 3000);

app.get("/", async function(req, res, next) {
  try {
    const { vw, vh, w, h, resize, ...query } = req.query;

    const o = {
      url: "https://google.com",
      type: "jpeg", // jpeg or png
      output: "json", // json, base64, or binary
      vw: vw ? parseInt(vw) : 720,
      vh: vh ? parseInt(vh) : 1280,
      w: w ? parseInt(w) : 640,
      h: h ? parseInt(h) : 360,
      resize: resize ? String(resize).toLowerCase() === "true" : false,
      ...query
    };

    if (!o.url) {
      if (o.output === "binary") {
        res.type(o.type);
        res.end();
      } else if (o.output === "base64") {
        res.type("text");
        res.end();
      } else if (o.output === "json") {
        res.json({ image: "" });
      }
      return next();
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.setViewport({
      width: o.vw,
      height: o.vh
    });
    await page.goto(o.url);
    let binary = await page.screenshot({
      type: o.type
    });
    await browser.close();

    if (o.resize) {
      binary = await sharp(binary)
        .resize(o.w, o.h)
        .toBuffer();
    }

    if (o.output === "binary") {
      res.type(o.type);
      res.end(binary);
    } else {
      const base64 = binary.toString("base64");
      const dataUri = `data:image/${o.type};base64,${base64}`;

      if (o.output === "json") {
        res.json({ image: dataUri });
      } else if (o.output === "base64") {
        res.type("text");
        res.end(dataUri);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

app.listen(app.get("port"), function() {
  console.log("running at localhost:" + app.get("port"));
});
