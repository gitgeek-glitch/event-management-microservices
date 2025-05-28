import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const connectDB = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials missing in .env");
    console.error("Required variables: SUPABASE_URL, SUPABASE_KEY");
    process.exit(1);
  }

  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error("Invalid SUPABASE_URL format:", supabaseUrl);
    console.error("Expected format: https://your-project.supabase.co");
    process.exit(1);
  }

  if (supabaseKey.length < 20) {
    console.error("Invalid SUPABASE_KEY - key appears too short");
    process.exit(1);
  }

  console.log("Connected to Supabase");
};

let supabase;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error("Failed to create Supabase client:", error.message);
  process.exit(1);
}

export { supabase, connectDB };