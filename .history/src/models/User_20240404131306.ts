import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: String,
    githubId: { type: String, unique: true, required: true },
    profileUrl: String,
    avatarUrl: String,
    accessToken: String,
});

const User = mongoose.model('User', userSchema);

export default User;
