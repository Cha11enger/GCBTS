import express from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User'; // Adjust this import according to your file structure

const router = express.Router();

// Replace 'process.env.*' with your GitHub OAuth credentials and callback URL
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const CALLBACK_URL = process.env.CALLBACK_URL || '';

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: CALLBACK_URL
}, async (accessToken: string, refreshToken: string | undefined, profile: any, cb: passport.AuthenticateCallback) => {
  try {
    let user = await User.findOne({ githubId: profile.id });

    if (!user) {
      user = new User({
        githubId: profile.id,
        username: profile.username,
        profileUrl: profile.profileUrl,
        avatarUrl: profile.photos[0].value,
        // Store additional fields as needed
      });

      await user.save();
    }

    cb(null, user);
  } catch (err) {
    cb(err, null);
  }
}));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the sessions
passport.deserializeUser((user: any, done) => {
    done(null, user);
});

router.use(passport.initialize());
router.use(passport.session()); // Make sure express-session is setup beforehand

// Redirects users to authenticate with GitHub
router.get('/oauth', passport.authenticate('github', { scope: [ 'user:email' ] }));

// GitHub redirects back to your app. Finish the authentication process
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  // Successful authentication, redirect home.
  res.redirect('/');
});


// const authRoutes = router;

// export default authRoutes;
