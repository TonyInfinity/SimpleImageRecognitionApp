const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const helpers = require("./helpers");
var upload = multer({ dest: "uploads/" });
const AWS = require("aws-sdk");

const port = process.env.port || 5000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

AWS.config.update({
  region: "us-east-1",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

app.post("/upload", (req, res) => {
  const s3 = new AWS.S3();

  const s3Params = {
    Bucket: "fpt-edu-hackathon-2021-s3-bucket",
    Key: req.body.name,
    Body: "uploads\\" + req.body.path,
  };

  s3.upload(s3Params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });


  // This part down doesn't work yet. Don't know why, will TRY to fix it later. Maybe with a promise
  const rekognition = new AWS.Rekognition();

  var detectLabelsParams = {
    Image: {
      S3Object: {
        Bucket: "fpt-edu-hackathon-2021-s3-bucket",
        Name: req.body.name,
      },
    },
    MaxLabels: 10,
    MinConfidence: 90,
  };

  rekognition.detectLabels(detectLabelsParams, (error, data) => {
    if (error) {
      console.log(error, error.stack);
    } else {
      console.log(data["Labels"].length);
      for (x in data["Labels"]) {
        if (data["Labels"][x]["Name"] === "Cat") {
          res.send("<h1>It's a cat</h1>");
        } else {
          res.send("<h1>It's not a cat</h1>");
        }
      }
    }
  });
});

app.listen(port, () => console.log("Server is running on port " + port));
