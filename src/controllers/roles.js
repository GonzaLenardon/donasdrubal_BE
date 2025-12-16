import Roles from '../models/roles.js';

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
    return res.status(200).json({
       message: 'Rol creado exitosamente', 
       newUser 
    });
  } catch (error) {
    console.error('Error al agregar rol:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });

  }
};

const updateRole = async (req, res) => {
  console.log('updateRole', req.params?.role_id, req.body);
  try {
    const {nombre, descripcion} = req.body;
    const role_id = req.params?.role_id ?? req.body?.role_id;
    if (!role_id) {
      return res.status(400).json({ error: 'role_id es obligatorio' });
    }
console.log('Role ID a actualizar:', role_id);
    // const role = await Roles.findOne({ where: { id: role_id } });
    const role = await Roles.findByPk(role_id);
    
    
    if (!role) {
      return res.status(400).json({ message: '¡Roles NO está registrado!' });
    }

    const resp = await role.update(
      { nombre, descripcion }
    );

    res.status(200).json({ 
      message: 'Rol actualizado exitosamente', 
      data: resp
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const getRole = async (req, res) => {
  try { 
    const role_id = req.params?.role_id ?? req.body?.role_id;
    if (!role_id) {
      return res.status(400).json({ error: 'role_id es obligatorio' });
    }
    const role = await Roles.findOne({ where: { id: role_id } });  
    console.log('Rol;', role);
    if (!role) {
      return res.status(404).json({ message: 'Rol NO está registrado' });
    }     
    return res.status(200).json({
      message: 'Rol encontrado',
      data: role,
    });
  } catch (error) {
    console.log('Error ', error);
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: error.message,
    });
  }   
};

const allRoles = async (req, res) => {
  try {
    const roles = await Roles.findAll();
    console.log('Roles', roles);
    return res.status(200).json({
      message: 'Roles obtenidos correctamente',
      data: roles,
    });
  } catch (error) {
    console.log('Error ', error);
    return res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: error.message,
    });
  }
};  

// -------------------OJO--------
//  aca ver de borrar solo si no existe ningun usuario con el rol a borrar
//--------------------------------
const deleteRole = async (req, res) => { 
  try {
    const role_id = req.params?.role_id ?? req.body?.role_id;
    if (!role_id) {
      return res.status(400).json({ error: 'role_id es obligatorio' });
    }
    const role = await Roles.findOne({ where: { id: role_id } });  
    console.log('Rol;', role);        
    if (!role) {
      return res.status(400).json({ message: '¡Rol NO está registrado!' });   
    }     
    await role.destroy(); 
    return res.status(200).json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.log('Error ', error);
    return res.status(500).json({ error: 'Error al eliminar Rol' });
  }     
};


export { addRole, deleteRole, updateRole, getRole, allRoles };
