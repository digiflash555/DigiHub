const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function run() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management');
    
    const user = await User.findOne({ 'securityQuestions.bestFriendName': { $exists: true, $ne: '' } }).select('+securityQuestions');
    if (!user) {
        console.log("No user found with security questions");
        // Create a test user
        const testUser = await User.create({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password123',
            securityQuestions: {
                bestFriendName: 'Alice',
                favoriteColor: 'Blue',
                favoriteHero: 'Superman'
            }
        });
        console.log("Created test user:", testUser.email);
        const refetched = await User.findById(testUser._id).select('+securityQuestions');
        console.log("Raw securityQuestions:", refetched.securityQuestions);
        console.log("Is match with raw values?", refetched.matchSecurityAnswers({
            bestFriendName: refetched.securityQuestions.bestFriendName,
            favoriteColor: refetched.securityQuestions.favoriteColor,
            favoriteHero: refetched.securityQuestions.favoriteHero
        }));
        console.log("Is match with plain text?", refetched.matchSecurityAnswers({
            bestFriendName: 'Alice',
            favoriteColor: 'Blue',
            favoriteHero: 'Superman'
        }));
        process.exit(0);
    }
    
    console.log("Raw securityQuestions:", user.securityQuestions);
    console.log("Is match with plain text 'test'?", user.matchSecurityAnswers({
        bestFriendName: 'test',
        favoriteColor: 'test',
        favoriteHero: 'test'
    }));
    
    process.exit(0);
}

run();
