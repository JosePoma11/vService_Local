import mongoose from 'mongoose';
import { nameDataBase } from './_vGlobal.js';

const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb://127.0.0.1:27017/${nameDataBase}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1); // Terminar el proceso con error
  }
};

export default connectDB;
