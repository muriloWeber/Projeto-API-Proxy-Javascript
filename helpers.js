/* neste código estão as funções assícronas e síncronas auxiliares nos processos
de leitura de arquivos, criação de corpo HTML, aquisição de dados por streaming
(body), escrita de arquivos, querystring e url (pokemon).
*/

//importação dos pacotes necessários
const fsPromise = require('fs').promises;
const path = require('path');
const https = require('https');

// definição do caminho dos arquivos a serem lidos como response das requisições
// __dirname é utilizado para qualquer diretório
const FOLDER_PATH = path.join(__dirname, 'beer_txt_files');

// função assícrona para leitura de arquivos para response de método GET
// recebe como parâmetro o caminho dos arqivos a serem lidos
// no final retorna uma promise.all para aguardar a leitura de todas as promises
// promise.all devolve o resultado de todas as promises
async function readTxtFiles(folderPath) {
    if (folderPath === undefined) {
        throw new Error('folderPath is undefined');
    }

    try {
        const files = await fsPromise.readdir(folderPath);
        const readPromises = files.map(file => {
            const filePath = path.join(__dirname, 'beer_txt_files', file);
            return fsPromise.readFile(filePath, 'utf-8');
        });
        return Promise.all(readPromises);
    } catch (err) {
        throw new Error('error reading files', err);
    }
}

// função para criação de corpo em HTML para as cervejas retornadas/enviadas
function createHTMLBody(items) {
    const liItems = (
        items.map((item) => (`<li>${item}</li>`)).join('')
    );

    return `
        <div
            style="width: 100vw;
                   height: 100vh;
                   text-align: center;">
            <h1>Cervejas</h1>
            <ul>
                ${liItems}
            </ul>
        </div>
        `;
}

// função para aquisição de corpo via streaming (pedaços) com ForAwait
// pedaços do corpo são obtidos (chunk) e adicionados ao array buffers
// retorna a concatenação dos chunk em string
async function getBodyWithForAwait(req) {
    const buffers = [];

    for await (const chunk of req) {
        buffers.push(chunk);
    }

    return Buffer.concat(buffers).toString();
}

// função com mesma lógica da acima porém utilizando promise
// receberá por eventos (req.on) pedaços do corpo
function getBodyWithPromise(req) {
    return new Promise((resolve, reject) => {
        const buffers = [];

        req.on('data', chunk => {
            console.log({chunk});
            buffers.push(chunk);
        });
        req.on('end', () => {
            const data = Buffer.concat(buffers).toString();
            resolve(data);
        });
        req.on('error', (e) => {
            reject(e);
        });
    });
}

// função para escrita de arquivo de novo item (cerveja) recebido através do método POST
// retorna objeto com infos do que foi salvo
async function writeTxtFile(content) {
    const newFileName = `${new Date().toISOString().substring(0,9)}.txt`;
    const newFilePath = path.join(FOLDER_PATH, newFileName);

    await fsPromise.writeFile(newFilePath, content);
    return {
        fileName: newFileName,
        content,
    };
}

// função que usa módulo https para redirecionar a requisição para a api do pokemon
// dentro da requisição assíncrona recebe os pedaços (chunk) dos dados
// ao receber o 'end' retorna os dados em JSON
function fetchPokemon(id = 1) {
    const BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';
    const pokeURL = `${BASE_URL}${id}`;

    return new Promise((resolve, reject) => {
        const req = https.request(pokeURL, res => {
            const data = [];

            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {
                const pokemonRaw = Buffer.concat(data).toString();
                const pokemonJSON = JSON.parse(pokemonRaw);
                resolve(pokemonJSON.name);
            });
        });

        req.on('error', error => {
            reject(error);
        });

        req.end();
    });
}

module.exports = {
    readTxtFiles,
    createHTMLBody,
    getBodyWithForAwait,
    getBodyWithPromise,
    FOLDER_PATH,
    writeTxtFile,
    fetchPokemon,
};
