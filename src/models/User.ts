// src/models/User.ts
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  displayName: String,
  username: { type: String, required: true },
  profileUrl: String,
  avatarUrl: String,
});

const User = mongoose.model('User', userSchema);

export default User;
