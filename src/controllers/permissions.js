import Permissions from '../models/permissions.js';

const allPermissions = async (req, res) => {
    try {
        const permissions = await Permissions.findAll();
        res.json(permissions);
    } catch (error) {
        console.error('Error al obtener permisos:', error);
        res.status(500).json({ error: 'Error al obtener permisos' });
    }
};

const getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permissions.findByPk(id);
        if (!permission) return res.status(404).json({ error: 'Permiso no encontrado' });
        res.json(permission);
    } catch (error) {
        console.error('Error al obtener permiso:', error);
        res.status(500).json({ error: 'Error al obtener permiso' });
    }
};

const addPermission = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const permission = await Permissions.create({ nombre, descripcion });
        res.status(201).json(permission);
    } catch (error) {
        console.error('Error al crear permiso:', error);
        res.status(500).json({ error: 'Error al crear permiso' });
    }
};

const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const permission = await Permissions.findByPk(id);
        if (!permission) return res.status(404).json({ error: 'Permiso no encontrado' });

        permission.nombre = nombre;
        permission.descripcion = descripcion;
        await permission.save();

        res.json(permission);
    } catch (error) {
        console.error('Error al actualizar permiso:', error);
        res.status(500).json({ error: 'Error al actualizar permiso' });
    }
};

const downPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permissions.findByPk(id);
        if (!permission) return res.status(404).json({ error: 'Permiso no encontrado' });

        await permission.destroy();
        res.json({ message: 'Permiso eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar permiso:', error);
        res.status(500).json({ error: 'Error al eliminar permiso' });
    }
};

export { allPermissions, getPermissionById, addPermission, updatePermission, downPermission };


