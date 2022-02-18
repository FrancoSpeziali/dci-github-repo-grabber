import jq from "node-jq";
import { promises as fs } from "fs";
import fse from "fs-extra";
import jsonexport from "jsonexport";

const config = {
  prefixes: ["ui", "spa", "pb", "browser", "node", "be", "bdl"],
  outputFolder: "./output",
};

async function writeToCSV(filename, json) {
  const csv = await jsonexport(json);

  await fse.outputFile(
    `${config.outputFolder}/${filename}-repositories.csv`,
    csv
  );
}

void (async function main(filePath, config) {
  try {
    const file = await fs.readFile(filePath, "utf8");

    const filtered = await jq.run(
      "[.[] | ({name: .name, description: .description, url : .html_url, git_http_url: .git_url, git_ssh_url: .ssh_url})]",
      file,
      { input: "string" }
    );
    const concatPages = await jq.run(
      "reduce .[] as $x ([]; . + $x)",
      filtered,
      {
        input: "string",
        slurp: true,
      }
    );

    const json = JSON.parse(concatPages);

    await fse.outputJson(`${config.outputFolder}/all_repositories.json`, json);

    config.prefixes.forEach((prefix) => {
      const repos = json.filter((repo) => {
        const name = repo.name.toLowerCase();
        return name.startsWith(prefix);
      });

      writeToCSV(prefix, repos);
    });
  } catch (error) {
    console.log(error);
  }
})("./gh-raw.txt", config);
