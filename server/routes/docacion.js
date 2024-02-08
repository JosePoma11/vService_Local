import express from 'express';
import Donacion from '../models/donacion.js';
import Factura from '../models/Factura.js';
import moment from 'moment';

const router = express.Router();

router.post('/add-to-donation', async (req, res) => {
  try {
    // Obtén la lista de IDs desde la solicitud
    const { Ids } = req.body;

    // Genera la fecha y hora actual usando moment
    const fechaHora = moment().format('YYYY-MM-DD HH:mm');

    // Crea un nuevo registro de Donacion con los IDs y la fecha generada
    const donacion = new Donacion({
      serviceOrder: Ids,
      donationDate: {
        fecha: fechaHora.split(' ')[0],
        hora: fechaHora.split(' ')[1],
      },
    });

    // Guarda el almacenamiento en la base de datos
    await donacion.save();

    res.status(201).json({ message: 'Donacion agregado con éxito' });
  } catch (error) {
    console.error('Error al agregar la Donacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/get-donated-orders', async (req, res) => {
  try {
    // Obtén todos los registros de Donacion
    const donacionRegistros = await Donacion.find();

    // Array para almacenar los resultados finales
    const resultados = [];

    // Itera a través de los registros de Almacen
    for (const donated of donacionRegistros) {
      // Itera a través de los serviceOrder del registro de Almacen
      for (const serviceOrderId of donated.serviceOrder) {
        // Encuentra la factura correspondiente a serviceOrderId
        const factura = await Factura.findOne({ _id: serviceOrderId });

        if (factura) {
          // Convierte el objeto factura a un objeto JavaScript estándar
          const facturaObj = factura.toObject();

          // Crea un objeto que incluye todos los campos de factura y agrega dateStorage
          const resultadoFactura = {
            ...facturaObj,
            dateStorage: donated.storageDate,
          };

          // Agrega el objeto a los resultados
          resultados.push(resultadoFactura);
        }
      }
    }

    res.status(200).json(resultados);
  } catch (error) {
    console.error('Error al obtener datos: ', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/get-donated/:idOrder', async (req, res) => {
  const idOrder = req.params.idOrder;
  try {
    // Obtén todos los registros de Donacion
    const donacionRegistros = await Donacion.find();

    // Array para almacenar los resultados finales
    let resultados;

    // Itera a través de los registros de Almacen
    for (const donated of donacionRegistros) {
      // Itera a través de los serviceOrder del registro de Almacen
      for (const serviceOrderId of donated.serviceOrder) {
        if (serviceOrderId === idOrder) {
          // Encuentra la factura correspondiente a serviceOrderId
          resultados = donated.donationDate;
          break; // Si se encontró la factura, puedes salir del bucle
        }
      }
      if (resultados) {
        break;
      }
    }

    if (resultados) {
      res.status(200).json(resultados);
    } else {
      res.status(404).json({ mensaje: 'ID de orden no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener datos: ', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

export default router;
