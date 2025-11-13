import UserRole from '../models/user_roles.js'; 
import User from '../models/users.js';
import Role from '../models/roles.js';


  const allUserRoles = async (req, res) => {
    try {
      const userRoles = await UserRole.findAll({ include: [User, Role] });
      res.json(userRoles);
    } catch (error) {
      console.error('Error al obtener roles de usuario:', error);
      res.status(500).json({ error: 'Error al obtener roles de usuario' });
    }
  };

  const addUserRole = async (req, res) => {
    try {
      const { userId, roleId } = req.body;
      const userRole = await UserRole.create({ userId, roleId });
      res.status(201).json(userRole);
    } catch (error) {
      console.error('Error al asignar rol al usuario:', error);
      res.status(500).json({ error: 'Error al asignar rol al usuario' });
    }
  };

  const  downUserRole = async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = await UserRole.findByPk(id);
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
    const { userId, roleId } = req.body;

    const user = await Users.findByPk(userId);
    const role = await Roles.findByPk(roleId);

    if (!user || !role) {
      return res.status(404).json({ message: 'Usuario o Rol no encontrado' });
    }

    await user.addRole(role); // 👈 Sequelize crea la relación en UserRoles
    res.status(200).json({ message: 'Rol asignado correctamente al usuario' });
  } catch (error) {
    console.error('Error al asignar rol:', error);
    res.status(500).json({ message: 'Error al asignar rol', details: error.message });
  }
};

// Obtener los roles de un usuario
const getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Users.findByPk(userId, {
      include: {
        model: Roles,
        through: { attributes: [] }, // no mostrar la tabla pivote
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user: user.name, roles: user.Roles });
  } catch (error) {
    console.error('Error al obtener roles del usuario:', error);
    res.status(500).json({ message: 'Error al obtener roles del usuario', error });
  }
};


  export { allUserRoles, addUserRole, downUserRole, assignRoleToUser, getUserRoles };
