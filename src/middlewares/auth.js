import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    // Obtener token de las cookies
    const token = req.cookies.Token;
    console.log('pasox verificar token');

    // Verificar si existe el token
    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autorizado - Token no proporcionado',
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Agregar la info del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.user,
      rol: decoded.rol,
    };

    console.log('req.user', req.user);

    // Continuar con la siguiente función
    next();
  } catch (error) {
    console.error('Error en verificación de token:', error.message);

    // Token expirado
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token expirado - Por favor inicia sesión nuevamente',
      });
    }

    // Token inválido
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token inválido',
      });
    }

    // Otro error
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al verificar token',
    });
  }
};

// Middleware opcional: verificar roles específicos
export const verifyRole = (rolesPermitidos) => {
  console.log('Que llega a verifyRole', rolesPermitidos);

  return (req, res, next) => {
    // El usuario debe estar autenticado primero

    if (!req.user) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autorizado',
      });
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Acceso denegado - Permisos insuficientes',
      });
    }

    next();
  };
};
