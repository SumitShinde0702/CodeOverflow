const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/users.routes");
const questionRoutes = require("./routes/questions.routes");
const answersRoutes = require("./routes/answers.routes");
const session = require('express-session');
const { getUserByUsername, insertUser } =  require("./lib/database");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pics'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

const app = express();
const port = 3000;

// Use bodyParser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: true,
        cookie: {
        secure: false, 
    },
    })
);

// Set view engine to EJS
app.set("view engine", "ejs");

app.use("/users", userRoutes);

app.use("/questions", questionRoutes);

app.use("/answers", answersRoutes);

app.use((req, res, next) => {
    res.locals.user = req.session.user || null; 
    next();
});

app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

const uploadDir = path.join(__dirname, 'uploads', 'profile_pics');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.get("/", (req, res) => {
    res.render('main', {
        userId: req.session.userId
    });
});

app.get("/login", (req, res) => {
    res.render("users/login");
});

app.get("/logout", (req, res) => {
    req.session.userId = null;
    res.redirect("/login");
});

app.post("/dologin", async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await getUserByUsername(username);
    if (foundUser && foundUser.password === password) {
        req.session.userId = foundUser._id;
        res.redirect("/questions");
    } else {
        res.redirect("/login");
    }
});

app.get("/register", (req, res) => {
    res.render("users/register");
});

app.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, email, password, confirmPassword, bio } = req.body;
    const profilePicture = req.file ? 'uploads/profile_pics/' + req.file.filename : null;  

    if (password !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
        return res.status(400).send("Username already exists");
    }

    try {
        const newUser = {
            username,
            email,
            password, 
            bio,
            profilePicture, 
        };

        const insertedUser = await insertUser(newUser);
        console.log("User successfully created:", insertedUser);

        res.redirect("/login"); // Redirect to login 
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Error creating user");
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

