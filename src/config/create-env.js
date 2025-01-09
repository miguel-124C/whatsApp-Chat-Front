import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';

// Obtener el equivalente a __dirname
const __filename = fileURLToPath(import.meta.url); // Ruta completa del archivo actual
const __dirname = path.dirname(__filename); // Directorio donde se encuentra este archivo

const pathEnv = path.resolve(__dirname, '../../env.js');

if(!fs.existsSync(pathEnv)){
    fs.writeFileSync('./env.js', `const ENVS = {
        BACK_URL: '${process.env.BACK_URL || 'http://localhost:3000'}',
        SOCKET_URL: '${process.env.SOCKET_URL || 'wss://localhost:3000/ws'}'
    }
    `, {encoding: 'utf-8'});
    console.log('Archivo env.json generado.');
}
