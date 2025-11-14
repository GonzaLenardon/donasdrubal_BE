// controllers/clientController.js

import User from '../models/users.js';
import Client from '../models/clients.js';


// const bcrypt = require('bcrypt');

const addClient = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company_name,
      trade_name,
      tax_id,
      phone,
      address,
      city,
      state,
      country,
      source,
      notes
    } = req.body;

    // 1. Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'cliente'
    });

    // 2. Crear cliente asociado
    const client = await Client.create({
      user_id: user.id,
      company_name,
      trade_name,
      tax_id,
      phone,
      address,
      city,
      state,
      country,
      source,
      notes
    });

    res.json({
      message: "Cliente creado correctamente",
      user,
      client
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

export { addClient };