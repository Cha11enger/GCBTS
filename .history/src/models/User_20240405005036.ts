import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: String,
  username: String,
  profileUrl: String,
  avatarUrl: String,
  // Add other fields as necessary
});

const User = mongoose.model('User', userSchema);
export default User;
