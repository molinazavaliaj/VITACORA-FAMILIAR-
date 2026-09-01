import { createClient } from '@supabase/supabase-js';
import { cargarConfig } from '../config.js';

const config = cargarConfig();
export const db = createClient(config.supabaseUrl, config.supabaseServiceKey);
