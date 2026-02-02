import { TipoClientes } from '../models/index.js';

const allTipoClientes = async (req, res) => {
  try {
    const resp = await TipoClientes.findAll();

    return res
      .status(200)
      .json({ message: 'Tipo Clientes  obtenidas correctamente', data: resp });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export { allTipoClientes };
