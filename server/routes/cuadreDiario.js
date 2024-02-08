import express from 'express';
import CuadreDiario from '../models/cuadreDiario.js';
import { openingHours } from '../middleware/middleware.js';
const router = express.Router();

router.post('/save-cuadre', openingHours, (req, res) => {
  const { infoCuadre } = req.body;
  const { dateCuadre, Montos, cajaInicial, cajaFinal, corte, notas } = infoCuadre;

  CuadreDiario.findOne({ 'dateCuadre.fecha': dateCuadre.fecha }) // Buscar un registro con la fecha proporcionada
    .then((cuadreExistente) => {
      if (cuadreExistente) {
        // Si existe un registro con la misma fecha, actualizar los valores
        cuadreExistente.Montos = Montos;
        cuadreExistente.cajaInicial = cajaInicial;
        cuadreExistente.cajaFinal = cajaFinal;
        cuadreExistente.corte = corte;
        cuadreExistente.notas = notas;

        cuadreExistente
          .save()
          .then((cuadreActualizado) => {
            res.json(cuadreActualizado);
          })
          .catch((error) => {
            console.error('Error al actualizar los datos:', error);
            res.status(500).json({ mensaje: 'Error al actualizar los datos' });
          });
      } else {
        // Si no existe un registro con la misma fecha, crear uno nuevo
        const nuevoCuadre = new CuadreDiario({
          dateCuadre,
          Montos,
          cajaInicial,
          cajaFinal,
          corte,
          notas,
        });

        nuevoCuadre
          .save()
          .then((cuadreGuardado) => {
            res.json(cuadreGuardado);
          })
          .catch((error) => {
            console.error('Error al guardar los datos:', error);
            res.status(500).json({ mensaje: 'Error al guardar los datos' });
          });
      }
    })
    .catch((error) => {
      console.error('Error al buscar los datos:', error);
      res.status(500).json({ mensaje: 'Error al buscar los datos' });
    });
});

router.get('/get-cuadre/date/:dateCuadre', (req, res) => {
  const { dateCuadre } = req.params;

  CuadreDiario.findOne({ 'dateCuadre.fecha': dateCuadre })
    .then((cuadre) => {
      if (cuadre) {
        res.json(cuadre);
      } else {
        res.json(null);
      }
    })
    .catch((error) => {
      console.error('Error al obtener el dato:', error);
      res.status(500).json({ mensaje: 'Error al obtener el dato' });
    });
});

router.get('/get-cuadre/last', (req, res) => {
  CuadreDiario.findOne()
    .sort({ $natural: -1 }) // Ordenar por el orden natural en la colección
    .then((cuadre) => {
      if (cuadre) {
        res.json(cuadre);
      } else {
        res.json(null);
      }
    })
    .catch((error) => {
      console.error('Error al obtener el último registro:', error);
      res.status(500).json({ mensaje: 'Error al obtener el último registro' });
    });
});

export default router;
