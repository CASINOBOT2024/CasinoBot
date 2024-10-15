const express = require("express");
const app = express();

module.exports = () => {
  app.use(express.static("./initMain/html"));
  app.listen(3000);
  console.log(`Página web iniciada con éxito.`);
  return true;
};
