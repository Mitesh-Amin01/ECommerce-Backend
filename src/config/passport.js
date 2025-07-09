import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.models.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "http://localhost:4000/v1/users/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
                firstName: profile.name.givenName || "Google",
                lastName: profile.name.familyName || "User",
                email,
                password: "", // Google users may not have password
                avatar: profile.photos[0]?.value,
                phone: "",
            });
        }

        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));
