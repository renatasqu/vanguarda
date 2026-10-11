import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const file = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(file), '../dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
export function createServer() {
  return http.createServer(async (req,res)=>{
    let target;
    try {const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));} catch {res.writeHead(400).end('Requisição inválida');return;}
    if(!target.startsWith(root+path.sep)){res.writeHead(403).end('Acesso negado');return;}
    try {const body=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);} catch {res.writeHead(404).end('Arquivo não encontrado');}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===file){
 const server=createServer();const port=Number(process.env.PORT||5173);
 server.on('error',e=>{console.error(`Não foi possível abrir a porta ${port}: ${e.message}`);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`Vanguarda — Radar PMO: http://127.0.0.1:${server.address().port}\nEncerre com Ctrl+C.`));
}
