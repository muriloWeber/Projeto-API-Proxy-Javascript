//código para criação do servidor e para lidar com as requisições

// importação módulos
// importação dos códigos dos arquivos beer_router e helpers 
const http = require('http');
const beerRouter = require('./beer_routes/beer_router');
const { fetchPokemon } = require('./helpers');
const URL = require('url');

// criação de servidor local do módulo HTTP
const server = http.createServer();

// ações para requisições de acordo com a url
server.on('request', async (req, res) => {
    const { method, url } = req;
    const { query } = URL.parse(req.url, true);

    if (url.startsWith('/poke')) {
        const pokemonName = await fetchPokemon(query.id);
        res.end(pokemonName);

    } else if (url.startsWith('/beer')) {
        beerRouter(req, res);

    } else {
        res.statusCode = 404;
        res.end('resource not found'); 
    }
});

server.listen(8080, () => {
    console.log(`escutando em http://localhost:8080`);
});
