import { createConnection } from 'typeorm';

const connection = async () => {
    try {
        const conn = await createConnection({
            type: 'postgres', // or your preferred database type
            host: 'localhost',
            port: 5432, // default port for PostgreSQL
            username: 'your_username',
            password: 'your_password',
            database: 'employee_login_system',
            entities: [
                __dirname + '/../models/*.ts' // adjust path as necessary
            ],
            synchronize: true, // set to false in production
        });
        console.log('Database connection established successfully');
        return conn;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

export default connection;