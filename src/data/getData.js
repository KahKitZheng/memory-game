import puppeteer from "puppeteer";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getEmployees = async () => {
  console.log("Launching Puppeteer in headless mode 🚀");

  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will be in full width and height)
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  console.log("Navigating to website");

  // On this new page:
  // - open the "http://quotes.toscrape.com/" website
  // - wait until the dom content is loaded (HTML is ready)
  await page.goto("https://faqta.nl/ons-verhaal", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector('a[filter-category-eq="*"]');

  // Click on the anchor tag
  await page.evaluate(() => {
    const anchor = document.querySelector('a[filter-category-eq="*"]');
    if (anchor) {
      anchor.click();
    }
  });

  console.log("Scraping the data...");

  // Get page data
  const employees = await page.evaluate(() => {
    // Fetch the first element with class "quote"
    // Get the displayed text and returns it
    const quoteList = document.querySelectorAll("div.team-card");

    // Convert the quoteList to an iterable array
    // For each quote fetch the text and author
    return Array.from(quoteList).map((quote) => {
      // Fetch the sub-elements from the previously fetched quote element
      // Get the displayed text and return it (`.innerText`)
      const image = quote.querySelector("img")?.src;
      const name = quote.querySelector(".team-card__title")?.innerText;
      const firstName = name.includes("Kah Kit")
        ? "Kah Kit"
        : name.split(" ")[0];
      const jobTitle = quote.querySelector(".team-card__desc")?.innerText;

      return { image, name, firstName, jobTitle };
    });
  });

  console.log("Saving the output to employees.ts");

  let jsonString = JSON.stringify(employees, null, 2);

  // Use a regular expression to remove quotes from keys
  jsonString = jsonString.replace(/"([^"]+)":/g, "$1:");

  const fileContent = `export const EMPLOYEES_DATA: Person[] = ${jsonString};`;

  // write it to a file called employees.json in src/mock-data
  writeFileSync(join(__dirname, "employees.ts"), fileContent);

  // Display the quotes
  console.log("Finished 🎉");
  console.log(employees);

  // Close the browser
  await browser.close();
};

// // Start the scraping
getEmployees();
