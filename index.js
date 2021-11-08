require('dotenv').config()
const {RELOAD, PORT, DATA_WS, DATA_DIR,BASEURL} = process.env
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// START UP
const configDB = require('./configDB');
const { config } = require('dotenv');
configDB.load();

if (RELOAD === "true") configDB.empty();

if (DATA_WS) DATA_WS.split(";").forEach(path=>require('./loadData').fromWS(path))
if (DATA_DIR) DATA_DIR.split(";").forEach(path=>require('./loadData').fromFolder(path))


// SERVER START
const fastify = require('fastify')({
  ignoreTrailingSlash: true,
  caseSensitive: false,
  logger: {
    level: 'info',
    file: 'log' // Will use pino.destination()
  }
});
fastify.register(require('fastify-compress'), { global: true });
fastify.register(require('fastify-cors'), {exposedHeaders: 'Content-Disposition'});
//fastify.register(require('fastify-sensible'));

fastify.register(require('fastify-static'), {  
  root: path.join(__dirname, '/views'),
})


// MAIN SERVER
fastify.register(async (childserver) => {
  
  childserver.decorate('verifytoken', (req, reply, done) => {
    //console.log('verifytoken', req)
    const token = configDB.getToken(req.query.token)
    if (token) done()
    else {
      return done(new Error('Invalid Token'))
    }
  })

  childserver.decorate('verifyJWT', async (req,reply) => {
    try {
      await req.jwtVerify()
    } catch (err) {
      if(req.query.f == "json") reply.code(401).send({"statusCode":401,"error":"Unauthorized","message":"Unauthorized"});
      reply.redirect(BASEURL+'/login')
    }
  })

  childserver.register(require('fastify-auth'));
  childserver.after(() => {
    childserver.addHook('preHandler', childserver.auth([childserver.verifytoken, childserver.verifyJWT], { relation: 'or' }  )  )

  })

  const spec = yaml.load(fs.readFileSync('./schema.yaml', 'utf8'));
  const handler = require('./handlers');
  childserver.register(require('./plugins/oas3-fastify'), { spec, handler })

})



// API ROUTE
fastify.register(require('fastify-swagger'), {
  routePrefix: '/api',
  exposeRoute: true,
  mode: 'static',
  specification: {
    path: './schema.yaml',
  }
})



// USERS LOGIN
fastify.register(require('fastify-cookie'))
fastify.register(require('fastify-formbody'))
fastify.register(require('fastify-jwt'), {
  secret: 'foobar',
  cookie: {
    cookieName: 'token',
    signed: false
  }
})
fastify.get('/login', (req, reply) => {
  const bufferIndexHtml = require('fs').readFileSync('./login.html')
  reply.type('text/html').send(bufferIndexHtml)
})

fastify.post('/signin', async (req, reply) => {
  const {username, password} = req.body
  const user = configDB.getUser(username, password)
  if(user){
    const token = await reply.jwtSign(user)
    reply
      .setCookie('token', token)
      .redirect('./')
  }
  else{
    
    reply.redirect('./login')
  }
})



// START SERVER
fastify.listen(PORT || 1234, function (err, address) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.info(`Server listening on ${address}`)
})