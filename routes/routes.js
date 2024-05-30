import express from 'express';
import * as ctrl from '../controllers/mainController.js';
import * as auth from '../controllers/authController.js';

import Opportunity from '../models/Opportunity.js';  // Adjusted path
import Letter from '../models/Letter.js';
import multer from 'multer';

const router = express.Router();

// Route to add a new opportunity
router.post('/opportunities', async (req, res) => {
    try {
        const { name, organization, date, photo, applicableTo, uploadedBy, tags, description } = req.body;
        const newOpportunity = new Opportunity({
            name,
            organization,
            date,
            photo,
            applicableTo: applicableTo.split(','), // Assuming applicableTo is a comma-separated string
            uploadedBy,
            tags: tags.split(','), // Assuming tags is a comma-separated string
            description
        });
        await newOpportunity.save();
        res.status(201).send({ message: 'Opportunity created successfully' });
    } catch (error) {
        res.status(400).send({ error: 'Error creating opportunity' });
    }
});



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the destination folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

router.post('/api/letters', upload.single('file'), async (req, res) => {
    try {
        const { topic, link, who } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const newLetter = new Letter({
            topic,
            link,
            who,
            file: file.path,
            fileName: file.originalname
        });

        await newLetter.save();
        res.status(201).json({ message: 'Letter uploaded successfully' });
    } catch (error) {
        console.error('Error uploading letter:', error);
        res.status(500).json({ error: 'Server error' });
    }
});



// Define routes
router.get('/', ctrl.home);
router.get('/about', ctrl.about);
router.get('/newsletters', (req, res) => {
    res.render('newsletters'); // Render the newsletters page
});

router.get('/opportunities', ctrl.opps);

router.get('/letters', (req, res) => {
    res.render('letters'); // Render the newsletters page
});


router.post('/submit-letter', upload.single('fileInput'), ctrl.lettersubmit);

router.get('/login', auth.login);
router.post('/login', auth.verifyLogin);
router.get('/register', auth.register);
router.post('/register', auth.verifyRegister);
router.get('/logout', auth.logout);

//router.get('/profile', auth.isAuthenticated);
//router.post('/api/products', auth.isAuthenticated, ctrl.getProducts);

export default router;

