/* Neste código serão definidos as rotas de requisição e respostas de cervejas
para os métodos POST, GET etc
*/

// importação dos módulos
const path = require('path');
const URL = require('url');
const gtts = require('node-gtts')('pt');

// importação das funções do arquivo helpers
const {
    readTxtFiles,
    createHTMLBody,
    getBodyWithForAwait,
    writeTxtFile,
    FOLDER_PATH,
} = require('../helpers');

// função do router para cervejas
// de acordo com o método manipulará conforme a função de cada método
async function beerRouter(req, res) {
    const { method } = req;

    if (method === 'GET') {
        handleGETRequest(req, res);
    } else if (method === 'POST') {
        handlePOSTRequest(req, res);
    } else {
        res.statusCode = 404;
        res.end('method not implemented');
    }
}

// função assíncrona para manipular dados do método POST
// utilizará a obtenção de corpo e fará a escrita de um novo arquivo
// responderá com status code 201 e o tipo de conteúdo em JSON
async function handlePOSTRequest(req, res) {
    const body = await getBodyWithForAwait(req);
    const result = await writeTxtFile(body);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
}

// função assíncrona para lidar com requisições do método GET
// para cada tipo de conteúdo haverá um tratamento para a devolução
// das cervejas que já constam salvas nos arquivos lidos
async function handleGETRequest(req, res) {
    const { query, host, pathname, search } = URL.parse(req.url, true);
    // console.log({
    //   host,
    //   pathname,
    //   search,
    //   encrypted: req.socket.encrypted,
    //   headerURL: req.headers.host,
    //   localAddress: req.socket.localAddress,
    //   port: req.socket.localPort,
    // });
    const contentType = query['content-type'];

    const filesContent = await readTxtFiles(FOLDER_PATH);

    if (contentType === 'html') {
        res.writeHead(200, { 'Content_Type': 'text/html' });
        const HTMLContent = createHTMLBody(filesContent);
        res.end(HTMLContent);

    } else if (contentType === 'json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const JSONContent = { cervejas: filesContent};
        const JSONContentAsStr = JSON.stringify(JSONContent);
        res.end(JSONContentAsStr);

    } else if (contentType === 'audio') {
        res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
        const contentsAsStr = `Nossas cervejas são ${filesContent.join(', e ')}`;
        const readStream = gtts.stream(contentsAsStr);

        readStream.pipe(res);
        readStream.on('end', () => {
            console.log('ended streaming audio to response!');
            res.end();
        });

    } else {
        res.statusCode = 404;
        res.end('beer not found');
    }
}

module.exports = beerRouter;