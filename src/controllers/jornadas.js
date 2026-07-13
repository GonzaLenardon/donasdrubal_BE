import { extractModelFields } from '../utils/model/payload.js';
import { Jornada, Clientes, Users } from '../models/index.js';

export const allJornadas = async (req, res) => {
  console.log('allJornadas controller');

  try {
    const resp = await Jornada.findAll();
    return res.status(200).json({
      message: 'Jornadas obtenidos correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const addJornada = async (req, res) => {
  // const { tipo_maquina, marca, modelo, responsable } = req.body;
  // const { cliente_id } = req.params;
  try {
    const payload = extractModelFields(Jornada, req.body);
    payload.cliente_id = req.params.cliente_id;
    console.log('addJornada controller: payload->', payload);
    const resp = await Jornada.create(payload);

    return res.status(201).json({
      message: 'Jornada creada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getJornada = async (req, res) => {
  const { jornada_id } = req.params;
  console.log('getJornada controller: jornada_id->', jornada_id);
  try {
    const jornada = await Jornada.findByPk(jornada_id);
    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    }
    return res.status(200).json({
      message: 'Jornada obtenido exitosamente',
      data: jornada,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateJornada = async (req, res) => {
  const { jornada_id } = req.params;

  console.log(
    'Llegamos a update Jornadas ........................',
    jornada_id,
  );
  try {
    const payload = extractModelFields(Jornada, req.body);
    if (payload.estado === 'PENDIENTE') {
      payload.estado = 'EN PROCESO';
    }
    const jornada = await Jornada.findByPk(jornada_id);

    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    }
    console.log('updateJornada controller: payload->', payload);
    const resp = await jornada.update(payload);

    return res.status(200).json({
      message: 'Jornada actualizada exitosamente',
      data: resp,
    });
  } catch (error) {
    console.log('Erroreeeeeeeeeeeeee', error);
    return res.status(500).json({
      error: 'Error al actualizar Jornada',
      details: error.message,
    });
  }
};

/* export const jornadasCliente = async (req, res) => {
  const cliente_id = req.params.cliente_id;
  console.log('jornadasCliente Controllerr: cliente_id->', cliente_id);

  try {
    const resp = await Jornada.findAll({
      where: { cliente_id: cliente_id },
    });

    return res.status(200).json({
      message: 'Jornada de cliente_id' + cliente_id + ' encontrados',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
}; */

/* export const jornadasCliente = async (req, res) => {
  const { cliente_id } = req.params;

  try {
    const resp = await Jornada.findAll({
      where: { cliente_id },
 
 
      include: [
        {
          model: Clientes,
          as: 'cliente',
          attributes: ['id'],
          include: [
            {
              model: Users,
              as: 'ingenieros',
              attributes: ['id', 'nombre'],
              through: {
                attributes: [], // opcional
              },
            },
          ],
        },


        { model: Users, as: 'responsable', attributes: ['nombre'] },

      ],
    });

    return res.status(200).json({
      message: `Jornadas del cliente ${cliente_id} encontradas`,
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
}; */

export const jornadasCliente = async (req, res) => {
  const { cliente_id } = req.params;

  try {
    const [jornadas, cliente] = await Promise.all([
      Jornada.findAll({
        where: { cliente_id },
        include: [
          {
            model: Users,
            as: 'responsable',
            attributes: ['id', 'nombre'],
          },
        ],
      }),

      Clientes.findByPk(cliente_id, {
        attributes: ['id', 'razon_social'],
        include: [
          {
            model: Users,
            as: 'ingenieros',
            attributes: ['id', 'nombre'],
            through: { attributes: [] },
          },
        ],
      }),
    ]);

    return res.status(200).json({
      message: `Jornadas del cliente ${cliente_id} encontradas`,
      data: {
        ingenieros: cliente?.ingenieros || [],
        jornadas,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const closeJornada = async (req, res) => {
  const { id } = req.params;

  try {
    const jornada = await Jornada.findByPk(id);

    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    }

    const resp = await jornada.update({ estado: 'CERRADO' });

    return res.status(200).json({
      message: 'Jornada cerrada exitosamente',
      data: resp,
    });
  } catch (error) {
    console.log('Erroreeeeeeeeeeeeee', error);
    return res.status(500).json({
      error: 'Error al CERRAR Jornada',
      details: error.message,
    });
  }
};

export const openJornada = async (req, res) => {
  const { id } = req.params;

  try {
    const jornada = await Jornada.findByPk(id);

    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    }

    const resp = await jornada.update({ estado: 'EN PROCESO' });

    return res.status(200).json({
      message: 'Jornada abierta exitosamente',
      data: resp,
    });
  } catch (error) {
    console.log('Erroreeeeeeeeeeeeee', error);
    return res.status(500).json({
      error: 'Error al CERRAR Jornada',
      details: error.message,
    });
  }
};

export const delJornada = async (req, res) => {
  const { id } = req.params;
  try {
    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    }

    await jornada.destroy();
    return res.status(200).json({
      message: 'Jornada eliminada exitosamente',
    });
  } catch (error) {
    console.log('Erroreeeeeeeeeeeeee', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};
