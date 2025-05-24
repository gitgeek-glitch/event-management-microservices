import express from "express";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get("/health", (req, res) => res.send("Student Service is healthy."));
app.get("/students", (req, res) => {
  res.json([
    { id: 1, name: "Alice", department: "CSE" },
    { id: 2, name: "Bob", department: "ECE" },
  ]);
});

app.listen(PORT, () => {
  console.log(`✅ Student Service running on port ${PORT}`);
});
