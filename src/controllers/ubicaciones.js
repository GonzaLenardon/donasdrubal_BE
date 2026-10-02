import { Ciudad, Pais, Provincia } from '../models/index.js';

const isValidId = (id) => /^\d+$/.test(id) && BigInt(id) > 0n;

const getPaises = async (req, res) => {
  try {
    const paises = await Pais.findAll({
      order: [['pais_nombre', 'ASC']],
    });

    return res.status(200).json({ data: paises });
  } catch (error) {
    console.error('Error al obtener países:', error);
    return res.status(500).json({ message: 'Error al obtener países' });
  }
};

const getProvinciasPorPais = async (req, res) => {
  const { pais_id } = req.params;
  if (!isValidId(pais_id)) {
    return res.status(400).json({ message: 'El ID del país no es válido' });
  }

  try {
    const provincias = await Provincia.findAll({
      where: { pais_id },
      order: [['nombre', 'ASC']],
    });

    return res.status(200).json({ data: provincias });
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    return res.status(500).json({ message: 'Error al obtener provincias' });
  }
};

const getCiudadesPorProvincia = async (req, res) => {
  const { provincia_id } = req.params;
  if (!isValidId(provincia_id)) {
    return res
      .status(400)
      .json({ message: 'El ID de la provincia no es válido' });
  }

  try {
    const ciudades = await Ciudad.findAll({
      where: { provincia_id },
      order: [['nombre', 'ASC']],
    });

    return res.status(200).json({ data: ciudades });
  } catch (error) {
    console.error('Error al obtener ciudades:', error);
    return res.status(500).json({ message: 'Error al obtener ciudades' });
  }
};

export { getCiudadesPorProvincia, getPaises, getProvinciasPorPais };
