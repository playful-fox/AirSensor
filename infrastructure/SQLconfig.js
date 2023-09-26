const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.db_host,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
}

export default config;