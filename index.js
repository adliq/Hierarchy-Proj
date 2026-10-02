const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

// Load environment variables
dotenv.config();

//const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests

// ✅ Serve uploaded image files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ❌ Commented out

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Routes
const userRoutes = require('./routes/userRoutes.js');
const ideaRoutes = require('./routes/ideaRoutes');
const ndaRoutes = require('./routes/ndaRoutes');      
const chatRoutes = require('./routes/chatRoutes');   
const settingsRoutes = require('./routes/settingsRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/ndas', ndaRoutes); 
app.use('/api/chat', chatRoutes);  
app.use('/api/settings', settingsRoutes);

// Custom file route (protected & NDA-aware)
const fileRoutes = require('./routes/fileRoutes');
app.use('/api/files', fileRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
