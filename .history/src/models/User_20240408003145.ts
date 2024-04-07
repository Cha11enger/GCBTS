import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: { type: String, unique: true, required: true },
  username: String,
  profileUrl: String,
  avatarUrl: String,
  accessToken: String,
  refreshToken: String, // Add this if you plan to implement token refresh
  tokenType: { type: String, default: 'bearer' }, // Useful for including in authorization headers
  expiresIn: Number, // The lifespan of the access token in seconds
});

const User = mongoose.model('User', userSchema);
export default User;
