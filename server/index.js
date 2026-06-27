import app from "./app.js";

const port = process.env.PORT || 8787;

app.listen(port, () => {
  console.log(`ReviewLens API running on http://127.0.0.1:${port}`);
});
