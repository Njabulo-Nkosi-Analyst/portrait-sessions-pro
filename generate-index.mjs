import fs from "fs";
import path from "path";

const assetsDir = "dist/client/assets";
const files = fs.readdirSync(assetsDir);

const cssFile = files.find(f => f.startsWith("styles-") && f.endsWith(".css"));
const jsFile = files.find(f => f.startsWith("index-") && f.endsWith(".js") && !f.includes("esm"));

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tann Media</title>
    <link rel="stylesheet" href="/assets/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>`;

fs.writeFileSync("dist/client/index.html", html);
console.log("✓ Generated index.html with", cssFile, "and", jsFile);