import Roles from '../models/roles.js';


const pruebaRoles = async (req, res) => {
  console.log('haber que nos llega', req);
  res.send('hola ROL QUERIDO');
};

const addRole = async (req, res) => {
  console.log('->Alta Rol', req.body);
  try {
    const {nombre, descripcion} = req.body;

    const rol = await Roles.findOne({ where: { nombre } });

    if (rol) {
      return res.status(400).json({ message: '¡Ya existe un ROL con ese Nombre!' });
    }

    const newUser = await Roles.create({
      nombre,
      descripcion 
    });
    res.status(201).json({ message: 'Rol creado exitosamente', newUser });
  } catch (error) {
    console.error('Error al agregar rol:', error);
    res
      .status(500)
      .json({ error: 'Error en el servidor', details: error.message });
  }
};

const upRole = async (req, res) => {
  try {
    const {nombre, descripcion} = req.body;
    const role = await Roles.findOne({ where: { id } });
    /*   console.log('Rol;', role); */

    if (!role) {
      return res.status(400).json({ message: '¡Roles NO está registrado!' });
    }

    await Roles.update(
      { nombre, descripcion },
      { where: { id } }
    );

    res.status(201).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res
      .status(500)
      .json({ error: 'Error en el servidor', details: error.message });
  }
};

const getRole = async (req, res) => {
  try { 
    const { id } = req.body;
    const role = await Roles.findOne({ where: { id } });  
    console.log('Rol;', role);
    if (!role) {
      return res.status(400).json({ message: '¡Rol NO está registrado!' });
    }     
    res.status(200).json(role);
  } catch (error) {
    console.log('Error ', error);
    res.status(500).json({ error: 'Error al obtener Rol solicitado' });
  }   
};

const allRoles = async (req, res) => {
  try {
    const roles = await Roles.findAll();
    console.log('Roles', roles);
    res.status(200).json(roles);
  } catch (error) {
    console.log('Error ', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};  

// -------------------OJO--------
//  aca ver de borrar solo si no existe ningun usuario con el rol a borrar
//--------------------------------
const downRole = async (req, res) => { 
  try {
    const { id } = req.body;
    const role = await Roles.findOne({ where: { id } });  
    console.log('Rol;', role);        
    if (!role) {
      return res.status(400).json({ message: '¡Rol NO está registrado!' });   
    }     
    await Roles.destroy({ where: { id } }); 
    res.status(200).json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.log('Error ', error);
    res.status(500).json({ error: 'Error al eliminar Rol' });
  }     
};


export { addRole, downRole, upRole, getRole, allRoles };
