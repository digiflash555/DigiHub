require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const forms = await require('./src/models/NominationForm').find().lean();
  console.log(JSON.stringify(forms, null, 2));
  process.exit();
});
