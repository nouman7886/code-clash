const express = require("express");
const axios = require("axios");

const router = express.Router();

const LANGUAGE_IDS = {
  python: 71,
  java: 62,
  cpp: 54,
  javascript: 63,
};

router.post("/", async (req, res) => {

  try {

    const { code, language, input } = req.body;

    const response = await axios.post(
      "https://ce.judge0.com/submissions?wait=true",
      {
        source_code: code,
        language_id: LANGUAGE_IDS[language],
        stdin: input || ""
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);

  } catch (err) {

    console.log(err.response?.data || err.message);

    res.status(500).json({
      error: "Execution failed"
    });

  }

});

module.exports = router;