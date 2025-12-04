
import MaquinaTipo from '../models/maquina_tipo.js';

export const allMaquinaTipo = async (req, res) => {
  console.log('all MaquinaTipo');

  try {
    const resp = await MaquinaTipo.findAll();
    return res.status(200).json({
      message: 'Tipos Máquinas obtenidas correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const addMaquinaTipo = async (req, res) => {
  const { tipo, marca, modelo, fecha_fabricacion } = req.body;

  try {
    const resp = await MaquinaTipo.create({
      tipo,
      marca,
      modelo,
      fecha_fabricacion,
    });

    return res.status(201).json({
      message: 'Tipo máquina creada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateMaquinaTipo = async (req, res) => {
  const { maquina_tipo_id } = req.params;

  try {
    const maquina_tipo = await MaquinaTipo.findByPk(maquina_tipo_id);

    if (!maquina_tipo) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    const resp = await maquina_tipo.update(req.body);

    return res.status(200).json({
      message: 'Tipo máquina actualizada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const downMaquinaTipo = async (req, res) => {
  const { maquina_tipo_id } = req.params;           
    try {   
    const maquina_tipo = await MaquinaTipo.findByPk(maquina_tipo_id);

    if (!maquina_tipo) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }   
    await maquina_tipo.destroy();

    return res.status(200).json({
      message: 'Tipo máquina eliminada exitosamente',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',        
        details: error.message,
    });
    }
};

export const getMaquinaTipo = async (req, res) => {
  const { maquina_tipo_id } = req.params;   
  try {
    const resp = await MaquinaTipo.findByPk(maquina_tipo_id); 
    if (!resp) {
      return res.status(404).json({ error: 'Tipo de máquina no encontrada' });
    }

    return res.status(200).json({
      message: 'Tipo de máquina obtenida correctamente',    
      data: resp,
    });   
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',  
      details: error.message,
    });
  } 
};
