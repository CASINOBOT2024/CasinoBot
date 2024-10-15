const { access, writeFile } = require("fs").promises;
const path = require("path");
const proceso = require("process");

const directorio = path.join(__dirname, "./error.txt");

module.exports = async () => {
  console.log(`Error service started.`);

  proceso.on("unhandledRejection", async (reason) => {
    console.log(`An error in the code has been logged.`);
    const data = `[${new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
    })}]\n${reason.message}\n--------------------\n`;

    if (await access(directorio).catch(() => false)) {
      const filedata = await fs.readFile(directorio, "utf8");
      await writeFile(directorio, filedata + data, "utf8");
    } else {
      await writeFile(directorio, data, "utf8");
    }
  });
};
