import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials missing in .env");
    process.exit(1);
  }

  console.log("Connected to Supabase");
};

export { supabase, connectDB };
