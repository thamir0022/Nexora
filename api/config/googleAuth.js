import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID } from "../utils/env.js";

export const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);