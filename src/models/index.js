import db from '../config/database.js';
import Users from './users.js';
import Maquinas from './maquinas.js';
import Calibraciones from './calibraciones.js';

Users.hasMany(Maquinas, { foreignKey: 'user_id', as: 'maquinas' });
Maquinas.belongsTo(Users, { foreignKey: 'user_id', as: 'cliente' });

Maquinas.hasMany(Calibraciones, {
  foreignKey: 'maquina_id',
  as: 'calibracionesmaquina',
});
Calibraciones.belongsTo(Maquinas, {
  foreignKey: 'maquina_id',
  as: 'calibraciones',
});

export { db };
export { Users, Maquinas, Calibraciones };
