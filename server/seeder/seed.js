import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Appliance from '../models/Appliance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const sampleAppliances = [
  {
    name: 'Living Room Air Conditioner',
    room: 'Living Room',
    type: 'ac',
    status: false,
    powerUsage: 1450,
    ratedPower: 1450,
    currentPower: 0,
  },
  {
    name: 'Master Bedroom Ambient Light',
    room: 'Bedroom',
    type: 'light',
    status: true,
    powerUsage: 25,
    ratedPower: 25,
    currentPower: 25,
  },
  {
    name: 'Kitchen Smart Geyser',
    room: 'Kitchen',
    type: 'geyser',
    status: false,
    powerUsage: 2000,
    ratedPower: 2000,
    currentPower: 0,
  },
  {
    name: 'Balcony High-Speed Fan',
    room: 'Balcony',
    type: 'fan',
    status: true,
    powerUsage: 75,
    ratedPower: 75,
    currentPower: 75,
  },
  {
    name: 'Home Theater Smart TV',
    room: 'Living Room',
    type: 'tv',
    status: false,
    powerUsage: 120,
    ratedPower: 120,
    currentPower: 0,
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }

    console.log(`[Seeder] Connecting to MongoDB Atlas...`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);

    console.log('[Seeder] Clearing old records...');
    await Appliance.deleteMany();

    console.log('[Seeder] Populating MongoDB Atlas with sample smart devices...');
    const created = await Appliance.insertMany(sampleAppliances);
    console.log(`[Seeder] Successfully inserted ${created.length} sample smart devices into Atlas!`);

    await mongoose.disconnect();
    console.log('[Seeder] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder] Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

// If run directly via `node seeder/seed.js` or `npm run seed`
if (process.argv[1] && process.argv[1].includes('seed.js')) {
  seedDB();
}

export default seedDB;

