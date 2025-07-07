const express = require('express');
const onnx = require('onnxruntime-node');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.static(path.join(__dirname, '/../frontend')));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

let session;

// Load the ONNX model once on startup
(async () => {
    try {
        session = await onnx.InferenceSession.create('./ielts_model_GradientBoost2.onnx');
        console.log("ONNX model loaded.");
    } catch (err) {
        console.error("Failed to load ONNX model:", err);
    }
})();
const data=require("mysql") //calling the module
const jwt = require('jsonwebtoken');
const db=data.createConnection({"host":"localhost","user":"root","database":"ilets"}) //give it data to conect
db.connect((err)=>{
    if (err)
    console.log(err)
    else
    console.log("database is connected")
})
const JWT_SECRET = '248f1d566f6c50352a93625aaa9d3769c4b69749d400e87b718f32dd7f4b4e9'; 
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
const { log } = require('console');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}

// Modify login route to return JWT token
app.post("/login", (req, res) => {
    const { email, password } = req.body; // Debug log
    const query = `SELECT * FROM sign_up WHERE email = ?`;
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ success: false, message: 'Internal app error' });
            return;
        }

        if (results.length > 0) {
            // Compare hashed password
            const validPassword = await bcrypt.compare(password, results[0].password);
            // Debug log
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Invalid credentials. Please try again.' });
            }
            // Generate JWT token
            const user = { id: results[0].id, email: results[0].email };
            const token = jwt.sign(user, JWT_SECRET, { expiresIn: '2h' });

            res.status(200).json({
                success: true,
                message: 'Login successful!',
                token,
                redirectTo: '/pro'
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials. Please try again.' });
        }
    });
});

app.post("/sign_up", async (request, response) => {
    const savequery = "INSERT INTO sign_up SET ?";
    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(request.body.password, 10);
        const userData = { ...request.body, password: hashedPassword };
        db.query(savequery, userData, (err) => {
            if (err) {
                console.error('Error executing MySQL query:', err);
                return response.status(500).json({ success: false, message: 'Internal server error' });
            } else {
                response.status(200).json({ success: true, message: 'Sign up successful!' });
            }
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        return response.status(500).json({ success: false, message: 'Internal server error' });
    }
});
app.post('/result', async (req, res) => {
    try {
        const questionText = req.body.Question || "";
        const essayText = req.body.Essay || "";

        
        const feeds = {
            'assignment': new onnx.Tensor('string', [questionText], [1,1]),
            'full_text': new onnx.Tensor('string', [essayText], [1,1])
        };

        const results = await session.run(feeds);
        // console.log("Result keys:", Object.keys(results));
        const outputName = Object.keys(results)[0];
        const predictionRounded = results[outputName].data[0];
        const prediction = Math.round(predictionRounded * 2) / 2; // Round to nearest 0.5
        console.log(prediction);
        
        let ILTSRESULT;
        if (prediction >= 0 && prediction < 6) {
            ILTSRESULT = 'Need improvement';
        } else if (prediction >= 6 && prediction < 7) {
            ILTSRESULT = 'Good';
        } else {
            ILTSRESULT = 'Excellent';
        }
        // const prediction = results.label.data[0]; // adjust 'label' to your output name
        console.log(`🎯 Prediction raw value: ${ILTSRESULT}`);

        

        res.json({
            band: prediction,
            message: ILTSRESULT
        });

    } catch (err) {
        console.error("❌ Error during inference:", err);
        res.status(500).send("Prediction failed.");
    }
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/../frontend', 'login.html'));}); 

app.get('/signup',(req, res) => {
    res.sendFile(path.join(__dirname, '/../frontend', 'signup.html'));
});
app.get('/pro', (req, res) => {
    res.sendFile(path.join(__dirname, '/../frontend', 'pro.html'));
});

// Protected API endpoint for pro page content
app.get('/api/protected-content', authenticateToken, (req, res) => {
    // You can customize this data as needed
    res.json({
        success: true,
        message: 'Welcome to the protected content!',
        user: req.user
    });
});

app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
