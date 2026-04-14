const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

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
const mysqlConnectionUrl = process.env.MYSQL_URI || process.env.MYSQL_URL || '';

const resolveSslCa = () => {
  const caPath = process.env.MYSQL_SSL_CA_PATH || process.env.MYSQL_SSL_CA_FILE;
  if (caPath && fs.existsSync(caPath)) {
    return fs.readFileSync(caPath, 'utf8');
  }

  if (process.env.MYSQL_SSL_CA_BASE64) {
    return Buffer.from(process.env.MYSQL_SSL_CA_BASE64, 'base64').toString('utf8');
  }

  if (process.env.MYSQL_SSL_CA) {
    return process.env.MYSQL_SSL_CA.replace(/\\n/g, '\n');
  }

  return null;
};

const buildDialectOptions = () => {
  if (mysqlSocketPath) {
    return { socketPath: mysqlSocketPath };
  }

  if (parseBoolean(process.env.MYSQL_SSL, false)) {
    const sslCa = resolveSslCa();
    const rejectUnauthorized = parseBoolean(
      process.env.MYSQL_SSL_REJECT_UNAUTHORIZED,
      Boolean(sslCa)
    );
    const ssl = { rejectUnauthorized };

    if (sslCa) {
      ssl.ca = sslCa;
    }

    return { ssl };
  }

  return {};
};

const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
  dialectOptions: buildDialectOptions(),
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
};

const sequelize = mysqlConnectionUrl
  ? new Sequelize(mysqlConnectionUrl, sequelizeOptions)
  : new Sequelize(
    process.env.MYSQL_DATABASE || 'Sigmora_db',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASSWORD || '',
    {
      ...sequelizeOptions,
      host: mysqlSocketPath ? undefined : (process.env.MYSQL_HOST || 'localhost'),
      port: Number(process.env.MYSQL_PORT || 3306),
    }
  );

const connectSequelize = async ({ syncSchema = false, alter = false } = {}) => {
  try {
    await sequelize.authenticate();
    console.log('[SEQUELIZE] MySQL Database connected successfully.');

    if (syncSchema) {
      try {
        await sequelize.sync({ alter });
        console.log(`[SEQUELIZE] MySQL schema synchronized${alter ? ' with alter' : ''}.`);
      } catch (error) {
        if (alter && /Too many keys specified/i.test(error.message)) {
          console.warn('[SEQUELIZE] Schema alter skipped because the local database has accumulated too many indexes. Retrying with safe sync only.');
          await sequelize.sync();
          console.log('[SEQUELIZE] MySQL schema synchronized without alter.');
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('[SEQUELIZE] Unable to connect to the MySQL database:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectSequelize };
