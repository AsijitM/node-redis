const express = require("express");
const app = express();
const redis = require("redis");
const axios = require("axios");

//create a client for redis
let redisClient;
(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (error) => console.error(`Error : ${error}`));
  await redisClient.connect();
})();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/data", async (req, res) => {
  try {
    if (await redisClient.get("todos")) {
      return res.json(JSON.parse(await redisClient.get("todos")));
    }
    const response = await axios.get(
      "https://jsonplaceholder.typicode.com/todos"
    );
    await redisClient.set("todos", JSON.stringify(response.data));
    return res.json({ data: response.data });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

// without any caching
app.get("/calc", (req, res) => {
  try {
    let calc = 0;
    for (let i = 0; i < 10000000000; i++) {
      calc += i;
    }
    return res.json({ data: calc });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

// with caching
app.get("/calc-cache", async (req, res) => {
  try {
    // Initialize calculate to 0
    let calculate = 0;

    // Check if present in Redis
    const cachedData = await redisClient.get("calculatedData");
    if (cachedData) {
      return res.json({ data: JSON.parse(cachedData) }); // Parse the cached data
    }

    // Run the operation
    for (let i = 0; i < 10000000000; i++) {
      calculate += i;
    }

    // Set the value in Redis
    await redisClient.set("calculatedData", JSON.stringify(calculate)); // Stringify the calculated data

    return res.json({ data: calculate });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
