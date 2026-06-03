const http=require("http"),fs=require("fs"),path=require("path");
const root=__dirname;
http.createServer((req,res)=>{
  if(req.method==="POST"&&req.url==="/save"){
    let b="";req.on("data",d=>b+=d);req.on("end",()=>{
      try{const o=JSON.parse(b);const data=o.data.replace(/^data:image\/\w+;base64,/,"");
        fs.writeFileSync(path.join(root,o.name),Buffer.from(data,"base64"));
        res.writeHead(200);res.end("ok");}catch(e){res.writeHead(500);res.end(String(e));}
    });return;
  }
  let f=decodeURIComponent(req.url.split("?")[0]);
  if(f==="/")f="/index.html";
  const p=path.join(root,f);
  fs.readFile(p,(e,d)=>{
    if(e){res.writeHead(404);return res.end("404");}
    const ext=path.extname(p).slice(1);
    const t={html:"text/html",js:"text/javascript",css:"text/css",png:"image/png",jpg:"image/jpeg"}[ext]||"application/octet-stream";
    res.writeHead(200,{"Content-Type":t});res.end(d);
  });
}).listen(8099,()=>console.log("listening 8099"));
