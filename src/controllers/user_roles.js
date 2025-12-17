import UserRole from '../models/user_roles.js'; 
import User from '../models/users.js';
import Roles from '../models/roles.js';


  const allUserRoles = async (req, res) => {
    try {
      const userRoles = await UserRole.findAll({ include: [User, Roles] });
      res.json(userRoles);
    } catch (error) {
      console.error('Error al obtener roles de usuario:', error);
      res.status(500).json({ error: 'Error al obtener roles de usuario' });
    }
  };

  const addUserRole = async (req, res) => {
    try {
      const { user_id, role_id } = req.body;
      const userRole = await UserRole.create({ user_id, role_id });
      res.status(201).json(userRole);
    } catch (error) {
      console.error('Error al asignar rol al usuario:', error);
      res.status(500).json({ error: 'Error al asignar rol al usuario' });
    }
  };

  const  downUserRole = async (req, res) => {
    try {
      const { user_id } = req.params;
      const userRole = await UserRole.findByPk(user_id);
      if (!userRole) return res.status(404).json({ error: 'Asignación no encontrada' });

      await userRole.destroy();
      res.json({ message: 'Asignación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      res.status(500).json({ error: 'Error al eliminar asignación' });
    }
  };

  const assignRoleToUser = async (req, res) => {
  try {
    const { user_id, role_id } = req.body;

    const user = await User.findByPk(user_id);
    const role = await Roles.findByPk(role_id);

    if (!user || !role) {
      return res.status(404).json({ message: 'Usuario o Rol no encontrado' });
    }

        // Crear relación
    await UserRole.create({ user_id: role_id, role_id: role_id });
    res.status(200).json({ message: 'Rol asignado correctamente al usuario' });
  } catch (error) {
    console.error('Error al asignar rol:', error);
    res.status(500).json({ message: 'Error al asignar rol', details: error.message });
  }
};

// Obtener los roles de un usuario
const getUserRoles = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id, {
      include: {
        model: Roles,
        through: { attributes: [] }, // no mostrar la tabla pivote
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user: user.nombre, roles: user.Roles });
  } catch (error) {
    console.error('Error al obtener roles del usuario:', error);
    res.status(500).json({ message: 'Error al obtener roles del usuario', error });
  }
};


  export { allUserRoles, addUserRole, downUserRole, assignRoleToUser, getUserRoles };
