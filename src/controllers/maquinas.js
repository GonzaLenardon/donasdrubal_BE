import Maquinas from '../models/maquinas.js';

export const allMaquinas = async (req, res) => {
  console.log('all Maquinas');

  try {
    const resp = await Maquinas.findAll();
    res.status(201).json(resp);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error en el servidor', details: error.message });
  }
};

export const addMaquina = async (req, res) => {
  const { tipo_maquina, marca, modelo, responsable, user_id } = req.body;
  console.log(req.body);

  try {
    const newMaquina = Maquinas.create({
      tipo_maquina,
      marca,
      modelo,
      responsable,
      user_id,
    });

    res
      .status(201)
      .json({ message: 'Maquina  creada exitosamente', newMaquina });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error en el servidor', details: error.message });
  }
};

export const maquinasUser = async (req, res) => {
  const user = req.params.user;
  console.log('📥 por ando USER MAQUINAS', user);

  try {
    const maquinas = await Maquinas.findAll({ where: { user_id: user } });
    console.log('✅ maquinas encontradas', maquinas);
    res.status(200).json(maquinas);
  } catch (error) {
    console.error('❌ Error al obtener máquinas:', error);
    res.status(500).json({ error: error.message });
  }
};
