const express = require("express");
const { mongoose } = require("mongoose");
const app = express();
const User = require("./model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const verifyToken = require("./middleware/authmw")
const Library = require("./model/library")
const bodyParser = require('body-parser');
const UserLib = require("./model/userlibrary")
app.use(cookieParser())

app.use(bodyParser.json())

mongoose.connect("mongodb://localhost:27017/Library_Management");

const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});

app.post('/register',  async(req,res) => {
    try{
        const userDetails = req.body;
        const { username, email, userType, password } = userDetails;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email, userType });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    }catch (error) {
        console.log("err", error);
        res.status(500).json({ error: "Registration failed" });
      }
});

app.post('/login', async( req,res) => {
    try{
        const { email, password } = req.body;

        console.log(email, password);
        const user = await User.findOne({ email });
        console.log(user, "user");
        if (!user) {
          return res
            .status(401)
            .json({ error: "Authentication failed- User doesn't exists" });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res
            .status(401)
            .json({ error: "Authentication failed- password doesn't match" });
        }
        const token = jwt.sign(
          { userId: user._id, userType: user.userType },
          "your-secret-key",
          {
            expiresIn: "1h",
          }
        );
    
        res.cookie("Authtoken", token);
        res.json({
          status: true,
          message: "login success",
          token,
          userType: user.userType
        });
        return res;
    }catch (error){
        console.log(error);
        res.status(500).json({ error: "Login failed" });
    }

})


app.post('/books', verifyToken, async (req, res) => {
    if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const book = new Library(req.body);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});


app.get('/books', verifyToken, async (req,res) => {
    const details = await Library.find({});
    res.json(details);
})

app.get('/books/:id', async(req,res) =>{
    const bookid = req.params.id;
    const details = await Library.findOne({bookid: bookid});
    res.json(details);
})

app.get('/availablebooks', verifyToken, async (req, res) => {
    try {
        const details = await Library.find({ status: "available" });
        res.json(details);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.put('/books/:id', verifyToken, async (req, res) => {

    if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
        
    }
    const data = req.body;
    const bookid = req.params.id;
    try {
        const book = await Library.findOneAndUpdate({bookid}, req.body, { new: true, runValidators: true });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});



app.delete('/books/:id', verifyToken, async (req, res) => {

    if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
        
    }
    const data = req.body;
    const bookid = req.params.id;
    try {
        const book = await Library.findOneAndDelete({bookid});
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.send("Book deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

app.post('/library',verifyToken, async (req,res) =>{
    if (req.userType !== 'user') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const user = await User.findById(req.user.userId); // Use userId set by middleware
        if (!user) return res.sendStatus(404);
        const book = new UserLib(req.body);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create book' });
    }
})

app.get('/library', verifyToken, async(req,res)=>{
    const details = await UserLib.find({});
    res.json(details);
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});