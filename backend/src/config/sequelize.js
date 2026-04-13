const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const resolveSocketPath = () => {
  const configuredSocketPath = process.env.MYSQL_SOCKET_PATH;
  if (configuredSocketPath && fs.existsSync(configuredSocketPath)) {
    return configuredSocketPath;
  }

  const host = (process.env.MYSQL_HOST || 'localhost').trim().toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') {
    const localSocketCandidates = [
      '/tmp/mysql.sock',
      '/var/run/mysqld/mysqld.sock',
      '/opt/homebrew/var/mysql/mysql.sock',
      '/usr/local/var/mysql/mysql.sock',
    ];

    return localSocketCandidates.find((socketPath) => fs.existsSync(socketPath)) || null;
  }

  return null;
};

const mysqlSocketPath = resolveSocketPath();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'Sigmora_db',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: mysqlSocketPath ? undefined : (process.env.MYSQL_HOST || 'localhost'),
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Set to true to see SQL queries
    dialectOptions: mysqlSocketPath
      ? { socketPath: mysqlSocketPath }
      : undefined,
    pool: {
      max: 20, // Increase pool size for massive seeding
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

const connectSequelize = async ({ syncSchema = false, alter = false } = {}) => {
  try {
    await sequelize.authenticate();
    console.log('[SEQUELIZE] MySQL Database connected successfully.');

    if (syncSchema) {
      await sequelize.sync({ alter });
      console.log(`[SEQUELIZE] MySQL schema synchronized${alter ? ' with alter' : ''}.`);
    }
  } catch (error) {
    console.error('[SEQUELIZE] Unable to connect to the MySQL database:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectSequelize };
