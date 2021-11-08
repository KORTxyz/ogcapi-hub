const {baseurl} = process.env;
const fs = require('fs')

const format = require('./templates')
const configDB = require('./configDB');

module.exports = {
  getLandingpage: async (req, reply, fastify) => {
    const { f } = req.query;

    if (f == "json") reply.send(format.landingPage())
    else {
      const content = fs.createReadStream(__dirname + '/views/index.html')
      reply.type('text/html').send(content)
    }
  },

  getConformance: async (req, reply, fastify) => {
    reply.send(format.conformance())
  },

  getCollections: async (req, reply, fastify) => {
    const { f, q, keywords, limit, offset, bbox } = req.query;

    const collections = configDB.getCollections(q, keywords, limit, offset, bbox);
    const formattedCollections = format.collections(collections);

    if (f == "json") reply.send(formattedCollections)
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/index.html', { locals: { baseurl: baseurl, data: formattedCollections } })

      reply.type('text/html').send(content)
    }
  },

  getCollection: async (req, reply, fastify) => {
    const { collectionId } = req.params;
    const { f } = req.query;
    
    const collection = configDB.getCollection(collectionId);
    const formattedCollections = format.collection(collection);

    if (f == "json") {
      reply.send(formattedCollections)
    }
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/index.html', { locals: { baseurl: baseurl, collection: formattedCollections, tiles: collection.tiles } })

      reply.type('text/html').send(content)
    }

  },
  
  getEnclosure: async (req, reply, fastify) => {
    const { collectionId } = req.params;
    const { f } = req.query;

    const source = configDB.getSource(collectionId,f);
    if(source){
      reply.header('Content-disposition', 'attachment; filename=' + source.path.split("\\").pop());
      reply.header('Content-Type', 'application/vnd.sqlite3');
      reply.send(require('fs').createReadStream(source.path))
      
    }
    else{
      reply.status(404).send()
    }

  },

  getItems: async (req, reply, fastify) => {
    const { collectionId } = req.params;

    let source = await configDB.getSources(collectionId);
    console.log(source)

  },

  getItem: async (req, reply, fastify) => {
    reply.status(404).send()

  },

  getSingleLayerTilesDesc: async (req, reply, fastify) => {
    const { collectionId } = req.params;

    reply.send(format.tilesSets(collectionId))
  },

  getSingleLayerTileJSON: async (req, reply, fastify) => {
    const { collectionId } = req.params;
    const collection = configDB.getCollection(collectionId);


    reply.send(format.tileJSON(collection))
  },

  getSingleLayerTile: async (req, reply, fastify) => {
    const { collectionId, z, x, y } = req.params;

    let {type,format,path} = await configDB.getSources(collectionId);
    const tile = await require('./sources/' + type).getTile(path, z, x, y, collectionId)
    
    if (tile) {
      reply.headers({
        'Content-Type': 'application/vnd.vector-tile',
        'Content-Encoding': format == 'application/vnd.vector-tile'?'gzip':'none',
        'OATiles-hint': null // OATiles-hint: at all more detailed zoom levels empty (no data) or OATiles-hint: full (same color all the way down)
      }).send(tile)
    }
    else {
      reply.status(404).send()
    }


  },

  getWMTS: async (req, reply, fastify) => {
    const { collectionId} = req.params;

    let {tiles,format,sources} = await configDB.getCollection(collectionId);

    const formattedStyles = format.wmts(collectionId,styles);
    
    reply.type(format).send(content)
  },

  getCollectionStyles: async (req, reply, fastify) => {
    const { collectionId } = req.params;
    const { f } = req.query;

    const styles = configDB.getStyles(collectionId)

    const formattedStyles = format.styles(collectionId,styles);
    if (f == "json") {
      reply.send(formattedStyles)
      
    }
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/index.html', { locals: { baseurl: baseurl, data: formattedStyles, collectionId: collectionId } })

      reply.type('text/html').send(content)

    }

  },

  getCollectionStyle: async (req, reply, fastify) => {
    const { collectionId, styleId } = req.params;
    const { f } = req.query;
    const style = configDB.getStyle(collectionId, styleId).style
    
    if (style == null) reply.code(404).send()
    else if (f == "mapbox") {
      reply.header('Content-Type', 'application/json; charset=utf-8');

      reply.send(style)
    }
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/index.html', { locals: { baseurl: baseurl, collectionId: collectionId, styleId: styleId, style: style, } })

      reply.type('text/html').send(content)

    }
  },

  getCollectionMap: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    let { collectionId, styleId } = req.params;

    let { f, bbox, width, height } = req.query;
    bbox = bbox ? bbox.split(",").map(e => Number(e)) : [-180, -90, 180, 90]

    if (f == "png" || f == "jpeg") {
      const page = await globalThis.browser.newPage();
      await page.setViewport({
        width: Number(width) || 800,
        height: Number(height) || 450
      })
      await page.goto(baseurl + '/collections/' + collectionId + '/styles/' + styleId + '/map?f=html&bbox=' + bbox);

      await page.waitForFunction('window.ready == true');
      const element = await page.$('canvas');

      const image = await element.screenshot({
        omitBackground: true,
        type: f.split("/").pop()
      });
      await page.close();
      reply.type(f).send(image)
    }
    else {
      if (styleId.includes(":")) {
        split = styleId.split(":");
        styleId = split[1]
        collectionId = split[0]
      }
      const style = configDB.getStyle(collectionId, styleId)
      const es6Renderer = require('express-es6-template-engine');


      const content = await es6Renderer(__dirname + '/views/index.html', { locals: { style: JSON.stringify(style), bbox: bbox } })
      reply.type('text/html').send(content)

    }

  },

}