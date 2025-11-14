import RolePermission from '../models/role_permissions.js';
import Role from '../models/roles.js';
import Permission from '../models/permissions.js'; 


  const allRolePermissions = async (req, res) => {
    try {
      const rolePermissions = await RolePermission.findAll({ include: [Role, Permission] });
      res.json(rolePermissions);
    } catch (error) {
      console.error('Error al obtener permisos de roles:', error);
      res.status(500).json({ error: 'Error al obtener permisos de roles' });
    }
  };

  const addRolePermission = async (req, res) => {
    try {
      const { roleId, permissionId } = req.body;
      const rolePermission = await RolePermission.create({ roleId, permissionId });
      res.status(201).json(rolePermission);
    } catch (error) {
      console.error('Error al asignar permiso al rol:', error);
      res.status(500).json({ error: 'Error al asignar permiso al rol' });
    }
  };

  const downRolePErmission = async (req, res) => {
    try {
      const { id } = req.params;
      const rolePermission = await RolePermission.findByPk(id);
      if (!rolePermission) return res.status(404).json({ error: 'Asignación no encontrada' });

      await rolePermission.destroy();
      res.json({ message: 'Asignación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      res.status(500).json({ error: 'Error al eliminar asignación' });
    }
  };

  export { allRolePermissions, addRolePermission, downRolePErmission };

