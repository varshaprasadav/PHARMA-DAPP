import "dotenv/config";
import chalk from "chalk";
import instance from "./ethers.js";

(() => {
  console.log(chalk.magenta("════════════════════════════════════════"));
  console.log(chalk.magenta("  PharmaChain — Event Listener"));
  console.log(chalk.magenta("════════════════════════════════════════"));
  console.log(chalk.cyan("Contract: " + instance.target));
  console.log(chalk.yellow("Listening for events... do a transaction now!\n"));

  instance.on("MedicineAdded", (medicineId, name, owner, timestamp) => {
    console.log(chalk.bgGreen.black("\n**** EVENT OCCURRED ****"));
    console.log(chalk.green("Event     : ") + "MedicineAdded");
    console.log(chalk.green("MedicineID: ") + medicineId);
    console.log(chalk.green("Name      : ") + name);
    console.log(chalk.green("Owner     : ") + owner);
    console.log(chalk.green("Time      : ") + new Date(Number(timestamp) * 1000).toLocaleString());
    console.log(chalk.bgGreen.black("************************\n"));
  });

  instance.on("DistributorUpdated", (medicineId, distributorName, newOwner, timestamp) => {
    console.log(chalk.bgYellow.black("\n**** EVENT OCCURRED ****"));
    console.log(chalk.yellow("Event          : ") + "DistributorUpdated");
    console.log(chalk.yellow("MedicineID     : ") + medicineId);
    console.log(chalk.yellow("DistributorName: ") + distributorName);
    console.log(chalk.yellow("New Owner      : ") + newOwner);
    console.log(chalk.yellow("Time           : ") + new Date(Number(timestamp) * 1000).toLocaleString());
    console.log(chalk.bgYellow.black("************************\n"));
  });

  instance.on("PharmacyUpdated", (medicineId, pharmacyName, newOwner, timestamp) => {
    console.log(chalk.bgMagenta.white("\n**** EVENT OCCURRED ****"));
    console.log(chalk.magenta("Event       : ") + "PharmacyUpdated");
    console.log(chalk.magenta("MedicineID  : ") + medicineId);
    console.log(chalk.magenta("PharmacyName: ") + pharmacyName);
    console.log(chalk.magenta("New Owner   : ") + newOwner);
    console.log(chalk.magenta("Time        : ") + new Date(Number(timestamp) * 1000).toLocaleString());
    console.log(chalk.bgMagenta.white("************************\n"));
  });

  instance.on("OwnershipTransferred", (medicineId, from, to, timestamp) => {
    console.log(chalk.bgBlue.white("\n**** EVENT OCCURRED ****"));
    console.log(chalk.blue("Event     : ") + "OwnershipTransferred");
    console.log(chalk.blue("MedicineID: ") + medicineId);
    console.log(chalk.blue("From      : ") + from);
    console.log(chalk.blue("To        : ") + to);
    console.log(chalk.blue("Time      : ") + new Date(Number(timestamp) * 1000).toLocaleString());
    console.log(chalk.bgBlue.white("************************\n"));
  });

  instance.on("MedicineSold", (medicineId, timestamp) => {
    console.log(chalk.bgRed.white("\n**** EVENT OCCURRED ****"));
    console.log(chalk.red("Event     : ") + "MedicineSold");
    console.log(chalk.red("MedicineID: ") + medicineId);
    console.log(chalk.red("Time      : ") + new Date(Number(timestamp) * 1000).toLocaleString());
    console.log(chalk.bgRed.white("************************\n"));
  });

})();
