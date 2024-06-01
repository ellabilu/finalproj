import User from '../models/User.js';
import Opportunity from '../models/Opportunity.js';
import Letter from '../models/Letter.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import express from 'express';

const router = express.Router();
export const home = async (req, res) => {
  res.render('index', {title: 'Node Template'});
};

export const about = (req, res) => {
    // Render the about page template or send a response
    res.render('about'); // Assuming you have an "about" template to render
};

export const opps = async (req, res) => {
    try {
        let opportunities = await Opportunity.find();

        // Check if there's a search query
        const { search } = req.query;
        if (search) {
            // Filter opportunities based on search query
            opportunities = opportunities.filter(opportunity => 
                opportunity.name.toLowerCase().includes(search.toLowerCase()) ||
                opportunity.organization.toLowerCase().includes(search.toLowerCase()) ||
                opportunity.description.toLowerCase().includes(search.toLowerCase()) ||
                opportunity.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
            );
        }

        res.render('opportunities', { opps: opportunities });
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        res.status(500).send('Server error');
    }
};

/*router.post('/opportunities', upload.none(), async (req, res) => {
    try {
        // Add your route logic here
    } catch (error) {
        console.error('Error creating opportunity:', error);
        res.status(500).send('Server error');
    }
});
export default router;
*/
export const lettersubmit = async (req, res) => {
    console.log(req.body);
    console.log("hi");
    try {
        const { topic, link, who } = req.body;
        const fileInput = req.body.fileInput;
        const file = req.file;
        
        console.log(fileInput);
        console.log(file);

        if (!file) {
            return res.status(400).json({ error: 'File is required' });
        }

        // Proceed with your logic to handle the submitted letter
        // For example, save the letter to the database

        res.status(201).json({ message: 'Letter submitted successfully' });
    } catch (error) {
        console.error('Error submitting letter:', error);
        res.status(500).json({ error: 'Server error' });
    }
}



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Allow PDF files
    } else {
        cb(null, false); // Reject non-PDF files
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

const processUpload = upload.single('fileInput'); // Multer middleware for single file upload

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or file type not allowed.');
  }

  console.log(req.file.originalname);
  const fileName = req.file.originalname.split('.')[0] + '-' + Date.now() + path.extname(req.file.originalname);
  const filePath = path.join(uploadDir, fileName);
  console.log(filePath);
  const fileUrl = req.file ? `/uploads/${req.file.fileName}` :'';

  try {
    await sharp(req.file.buffer)
      .resize(300)
      .toFile(filePath);
    
    

    console.log('file uploaded!');
    res.redirect('/');
  } catch (error) {
      res.status(500).send('Error processing file' + error);
  }
};

export { processUpload, uploadFile };
