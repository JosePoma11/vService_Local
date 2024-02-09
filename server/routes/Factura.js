import express from 'express';
import Factura from '../models/Factura.js';
import { openingHours } from '../middleware/middleware.js';
import Delivery from '../models/delivery.js';
import clientes from '../models/clientes.js';
import moment from 'moment';

const router = express.Router();

router.post('/add-factura', openingHours, async (req, res) => {
  const { infoRecibo } = req.body;
  const {
    codRecibo,
    dateRecepcion,
    Modalidad,
    Nombre,
    Producto,
    celular,
    Pago,
    ListPago,
    datePrevista,
    dateEntrega,
    descuento,
    estadoPrenda,
    estado,
    dni,
    subTotal,
    totalNeto,
    cargosExtras,
    factura,
    modeRegistro,
    modoDescuento,
    gift_promo,
    attendedBy,
    lastEdit,
  } = infoRecibo;

  try {
    // Consultar el último registro ordenado por el campo 'index' de forma descendente
    const ultimoRegistro = await Factura.findOne().sort({ index: -1 }).exec();

    // Obtener el último índice utilizado o establecer 0 si no hay registros
    const ultimoIndice = ultimoRegistro ? ultimoRegistro.index : 0;

    // Crear el nuevo índice incrementando el último índice en 1
    const nuevoIndice = ultimoIndice + 1;

    const dateCreation = {
      fecha: moment().format('YYYY-MM-DD'),
      hora: moment().format('HH:mm'),
    };

    // Crear el nuevo registro con el índice asignado
    const nuevoDato = new Factura({
      dateCreation,
      codRecibo,
      dateRecepcion,
      Modalidad,
      Nombre,
      Producto,
      celular,
      Pago,
      ListPago,
      datePrevista,
      dateEntrega,
      descuento,
      estadoPrenda,
      estado,
      index: nuevoIndice, // Asignar el nuevo índice al registro
      dni,
      subTotal,
      totalNeto,
      cargosExtras,
      factura,
      modeRegistro,
      notas: [],
      modoDescuento,
      gift_promo,
      location: 1,
      attendedBy,
      lastEdit,
    });

    // Guardar el nuevo registro en la base de datos
    const facturaGuardada = await nuevoDato.save();
    res.json(facturaGuardada);
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    res.status(500).json({ mensaje: 'Error al guardar los datos' });
  }
});

router.get('/get-factura', (req, res) => {
  Factura.find()
    .then((facturas) => {
      res.json(facturas);
    })
    .catch((error) => {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ mensaje: 'Error al obtener los datos' });
    });
});

router.get('/get-factura/:id', (req, res) => {
  const { id } = req.params; // Obteniendo el id desde los parámetros de la URL
  Factura.findById(id)
    .then((factura) => {
      if (factura) {
        res.json(factura);
      } else {
        res.status(404).json({ mensaje: 'Factura no encontrada' });
      }
    })
    .catch((error) => {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ mensaje: 'Error al obtener los datos' });
    });
});

router.get('/get-factura/date/:datePago', (req, res) => {
  const { datePago } = req.params;

  Factura.find({ 'ListPago.date.fecha': datePago })
    .then((facturas) => {
      // Filtrar y mapear los resultados para incluir sólo los documentos que coincidan en la fecha de pago.
      const facturasConPagoCorrespondiente = facturas.filter((factura) =>
        factura.ListPago.some((pago) => pago.date.fecha === datePago)
      );

      res.json(facturasConPagoCorrespondiente);
    })
    .catch((error) => {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ mensaje: 'Error al obtener los datos' });
    });
});

router.get('/get-factura/date/:startDate/:endDate', (req, res) => {
  const { startDate, endDate } = req.params;

  Factura.find({
    'dateRecepcion.fecha': {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .then((iRangeFacturas) => {
      res.json(iRangeFacturas);
    })
    .catch((error) => {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ mensaje: 'Error al obtener los datos' });
    });
});

router.get('/get-factura/report/date-prevista/:datePrevista', async (req, res) => {
  try {
    const { datePrevista } = req.params;
    const facturas = await Factura.find({
      'datePrevista.fecha': datePrevista,
      estadoPrenda: { $nin: ['anulado', 'donado'] },
    });
    const resultado = {
      FechaPrevista: datePrevista,
      CantidadPedido: facturas.length,
      InfoCategoria: facturas.reduce((categorias, factura) => {
        factura.Producto.forEach(({ categoria, cantidad }) => {
          categorias[categoria] = (categorias[categoria] || 0) + Number(cantidad);
        });
        return categorias;
      }, {}),
    };

    resultado.InfoCategoria = Object.entries(resultado.InfoCategoria).map(([Categoria, Cantidad]) => ({
      Categoria,
      Cantidad,
    }));

    resultado.InfoCategoria.unshift({
      Categoria: 'Delivery',
      Cantidad: resultado.InfoCategoria.find(({ Categoria }) => Categoria === 'Delivery')?.Cantidad || 0,
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los datos' });
  }
});

router.put('/update-factura/:id', openingHours, (req, res) => {
  const facturaId = req.params.id;
  const { infoRecibo } = req.body;

  Factura.findById(facturaId)
    .then((factura) => {
      if (!factura) {
        return res.status(404).json({ mensaje: 'Factura no encontrada' });
      }

      // Crea un objeto con los campos y valores actualizados
      const updatedFields = {};

      // Itera a través de los campos existentes en la factura y actualiza si se proporcionan en req.body
      for (const field in factura.toObject()) {
        if (infoRecibo.hasOwnProperty(field)) {
          updatedFields[field] = infoRecibo[field];
        } else {
          updatedFields[field] = factura[field];
        }
      }

      // Actualiza los campos en la base de datos
      Factura.findByIdAndUpdate(facturaId, { $set: updatedFields }, { new: true })
        .then((facturaActualizada) => {
          // Eliminar el Id del almacena
          res.json(facturaActualizada);
        })
        .catch((error) => {
          console.error('Error al actualizar la factura:', error);
          res.status(500).json({ mensaje: 'Error al actualizar la factura' });
        });
    })
    .catch((error) => {
      console.error('Error al buscar la factura:', error);
      res.status(500).json({ mensaje: 'Error al buscar la factura' });
    });
});

router.post('/cancel-entrega/:idFactura', async (req, res) => {
  try {
    const { modalidad } = req.body;
    const facturaId = req.params.idFactura;

    // Obtener factura por ID
    const factura = await Factura.findById(facturaId);
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const fechaActual = moment().format('YYYY-MM-DD');

    let idDeliveryDeleted;
    if (factura.estadoPrenda === 'entregado' && factura.dateEntrega.fecha === fechaActual) {
      if (modalidad === 'Delivery') {
        const { IdDelivery } = req.body;
        idDeliveryDeleted = IdDelivery;
        await Delivery.findByIdAndDelete(IdDelivery, { session: session });
      }

      // Actualizar cliente si tiene DNI
      if (factura.dni !== '') {
        const cliente = await clientes.findOne({ dni: factura.dni });

        if (cliente) {
          // Actualizar cliente y sus infoScore
          const facturaIdString = factura._id.toString();

          const updatedInfoScore = cliente.infoScore.filter((score) => score.idOrdenService !== facturaIdString);

          // Actualizar el scoreTotal del cliente
          cliente.infoScore = updatedInfoScore;
          cliente.scoreTotal = cliente.infoScore.reduce((total, score) => total + parseInt(score.score), 0);

          await cliente.save();
        }
      }

      await Factura.findByIdAndUpdate(facturaId, {
        estadoPrenda: 'pendiente',
        dateEntrega: {
          fecha: '',
          hora: '',
        },
      });

      // Obtener la factura actualizada después de la actualización
      const orderUpdate = await Factura.findById(facturaId);
      res.json({
        orderUpdate: orderUpdate.toObject(),
        ...(idDeliveryDeleted && factura.Modalidad === 'Delivery' && { idDeliveryDeleted: idDeliveryDeleted }),
      });
    } else {
      res.status(404).json({ mensaje: 'No cumple con los parametros para cancelar entrega' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cancelar Entrega' });
  }
});

export default router;
