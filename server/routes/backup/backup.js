import express from 'express';
import archiver from 'archiver';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import nodemailer from 'nodemailer';
import fsExtra from 'fs-extra';
import { emailBusiness, nameDataBase, passBusiness } from '../../config/_vGlobal.js';

const router = express.Router();

const currentDir = path.dirname(new URL(import.meta.url).pathname);
const backupFolderPath = path.join(currentDir, '../../../backup');

router.get('/backup', async (req, res) => {
  const backupDirectory = path.join(process.cwd(), 'backup');
  try {
    await executeMongodump();

    const zipFilePath = await compressBackup();

    // Envía el archivo zip por correo electrónico
    await sendEmailWithAttachment(zipFilePath);

    // Elimina todo dentro de la carpeta 'backup', pero no la carpeta en sí
    await deleteContentsOfBackup(backupDirectory);

    res.status(200).json({ message: 'Copia de seguridad generada y enviada con éxito' });
  } catch (error) {
    console.error('Error:', error);
    await deleteContentsOfBackup(backupDirectory);
    res.status(500).json({ error: 'Error al generar Copia de seguridad, no se pudo enviar' });
  }
});

async function executeMongodump() {
  return new Promise((resolve, reject) => {
    const normalizedBackupDir = backupFolderPath.replace(/\\/g, '/');
    const cleanedBackupDir = normalizedBackupDir.replace(/^\//, '');
    const quotedBackupDir = `"${cleanedBackupDir}"`;

    exec(`mongodump --db ${nameDataBase} --out ${quotedBackupDir}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log('Copia de seguridad generada con éxito:', stdout);
        resolve();
      }
    });
  });
}

async function compressBackup() {
  return new Promise((resolve, reject) => {
    try {
      // Obtén la ruta del directorio actual
      const currentDirectory = process.cwd();

      // Ruta a la carpeta 'img' dentro de la carpeta 'backup'
      const backupImgPath = path.join(currentDirectory, 'backup', `${nameDataBase}`);

      // Ruta para el archivo comprimido dentro del directorio 'backup'
      const zipFilePath = path.join(currentDirectory, 'backup', `${nameDataBase}.zip`);

      const output = fs.createWriteStream(zipFilePath);

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);

      archive.directory(backupImgPath, false);

      output.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
        console.log('Archiver has been finalized and the output file descriptor has closed.');

        resolve(zipFilePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

async function sendEmailWithAttachment(attachmentPath) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: emailBusiness,
      pass: passBusiness,
    },
  });
  const mailOptions = {
    from: emailBusiness,
    to: emailBusiness, // Reemplaza con la dirección de correo electrónico del destinatario
    subject: 'Copia de seguridad',
    text: 'Se adjunta la copia de seguridad.',
    attachments: [
      {
        filename: `${nameDataBase}.zip`,
        path: attachmentPath,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
}

async function deleteContentsOfBackup(backupDirectory) {
  try {
    await fsExtra.emptyDir(backupDirectory);
    console.log('Contenido de la carpeta backup eliminado con éxito.');
  } catch (error) {
    console.error('Error al eliminar el contenido de la carpeta backup:', error);
    throw error;
  }
}

export default router;
